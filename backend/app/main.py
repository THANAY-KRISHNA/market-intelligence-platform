import math
import os
import sys
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, Depends, HTTPException, Query, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func, case, text
from pydantic import BaseModel

from .database import get_db, Base, engine
from .models import User, StockTick, Tweet, SentimentAggregate, CorrelationSignal, Alert
from .schemas import (
    UserCreate, UserResponse, TokenResponse,
    MarketSummaryResponse, TickerSummary,
    CorrelationDetailResponse, CorrelationTimelinePoint,
    DashboardSummaryResponse, TweetLogCreate, AlertResponse
)
from .auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_user
)
from .analyzer import get_sentiment_analyzer

app = FastAPI(title="Real-Time Stock Sentiment & Price Correlation Pipeline API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TICKERS = ["TSLA", "AAPL", "NVDA", "MSFT", "META", "AMZN", "GOOGL", "NFLX"]

# ----------------- WebSocket Connection Manager -----------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send initial welcome message
        await websocket.send_json({"type": "connection_established", "timestamp": datetime.now().isoformat()})

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Remove dead connections
                pass

manager = ConnectionManager()

# ----------------- Background Database Watcher -----------------
# Monitors the SQLite/PostgreSQL database for new ticks and alerts to push via WebSocket.
last_broadcasted_tick_id = 0
last_broadcasted_alert_id = 0
last_broadcasted_tweet_id = None

async def database_broadcast_loop():
    global last_broadcasted_tick_id, last_broadcasted_alert_id, last_broadcasted_tweet_id
    
    # Give the app a moment to start
    await asyncio.sleep(5.0)
    
    print("WebSocket live database broadcaster loop started.")
    while True:
        try:
            db: Session = next(get_db())
            
            # 1. Check for new Stock Ticks
            new_ticks = db.query(StockTick).filter(StockTick.id > last_broadcasted_tick_id).order_by(StockTick.id.asc()).all()
            if new_ticks:
                last_broadcasted_tick_id = new_ticks[-1].id
                ticks_payload = [
                    {"ticker": t.ticker, "price": t.price, "volume": t.volume, "timestamp": t.timestamp.isoformat()}
                    for t in new_ticks
                ]
                await manager.broadcast({"type": "new_ticks", "data": ticks_payload})
                
            # 2. Check for new Alerts
            new_alerts = db.query(Alert).filter(Alert.id > last_broadcasted_alert_id).order_by(Alert.id.asc()).all()
            if new_alerts:
                last_broadcasted_alert_id = new_alerts[-1].id
                alerts_payload = [
                    {"id": a.id, "ticker": a.ticker, "severity": a.severity, "message": a.message, "type": a.type, "timestamp": a.timestamp.isoformat()}
                    for a in new_alerts
                ]
                await manager.broadcast({"type": "new_alerts", "data": alerts_payload})
                
            # 3. Check for new Tweets
            # We select the latest tweet based on datetime since primary key is string (e.g. tw_123456)
            latest_tweet = db.query(Tweet).order_by(Tweet.timestamp.desc()).first()
            if latest_tweet and latest_tweet.id != last_broadcasted_tweet_id:
                last_broadcasted_tweet_id = latest_tweet.id
                tweet_payload = {
                    "id": latest_tweet.id, "ticker": latest_tweet.ticker, "text": latest_tweet.text,
                    "username": latest_tweet.username, "timestamp": latest_tweet.timestamp.isoformat(),
                    "compound": latest_tweet.compound, "bot_probability": latest_tweet.bot_probability
                }
                await manager.broadcast({"type": "new_tweet", "data": tweet_payload})
                
            db.close()
        except Exception as e:
            # Silence background database connection logs on reset
            pass
            
        await asyncio.sleep(1.0) # Check every 1 second

@app.on_event("startup")
async def startup_event():
    # Start database broadcast loop in the background
    asyncio.create_task(database_broadcast_loop())

# ----------------- Auth Endpoints -----------------

@app.post("/api/auth/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(username=user_data.username, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=TokenResponse)
def login_user(user_data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "username": user.username}

@app.post("/api/auth/token", response_model=TokenResponse)
def login_for_oauth_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2 Password Flow endpoint required by Swagger UI Authorization
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "username": user.username}

@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_profile(user: User = Depends(require_user)):
    return user

class GoogleLoginPayload(BaseModel):
    code: str
    redirect_uri: str

@app.post("/api/auth/google", response_model=TokenResponse)
def login_with_google(payload: GoogleLoginPayload, db: Session = Depends(get_db)):
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
    
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=400,
            detail="Google OAuth is not configured on the backend. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        )
        
    import urllib.request
    import urllib.parse
    import json
    from pydantic import BaseModel
    
    try:
        # Exchange authorization code for token
        token_url = "https://oauth2.googleapis.com/token"
        req_data = urllib.parse.urlencode({
            "code": payload.code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": payload.redirect_uri,
            "grant_type": "authorization_code"
        }).encode("utf-8")
        
        req = urllib.request.Request(token_url, data=req_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        with urllib.request.urlopen(req, timeout=5) as res:
            tokens = json.loads(res.read().decode())
            access_token = tokens["access_token"]
            
        # Retrieve Google user information
        userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        user_req = urllib.request.Request(userinfo_url, headers={"Authorization": f"Bearer {access_token}"})
        with urllib.request.urlopen(user_req, timeout=5) as user_res:
            user_data = json.loads(user_res.read().decode())
            email = user_data["email"]
            username = email.split("@")[0]
            
        # Create user profile if missing
        user = db.query(User).filter(User.username == username).first()
        if not user:
            # Generate random password hash for federated credentials
            import secrets
            hashed_pwd = get_password_hash(secrets.token_urlsafe(16))
            user = User(username=username, hashed_password=hashed_pwd)
            db.add(user)
            db.commit()
            db.refresh(user)
            
        jwt_token = create_access_token(data={"sub": user.username})
        return {"access_token": jwt_token, "token_type": "bearer", "username": user.username}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google authentication failed: {str(e)}")

# ----------------- Business API Endpoints -----------------

@app.get("/api/tickers", response_model=List[str])
def get_tickers():
    return TICKERS

@app.get("/api/market-summary", response_model=MarketSummaryResponse)
def get_market_summary(db: Session = Depends(get_db)):
    ticker_summaries = []
    
    for t in TICKERS:
        # Get latest tick
        latest_tick = db.query(StockTick).filter(StockTick.ticker == t).order_by(StockTick.timestamp.desc()).first()
        if not latest_tick:
            continue
            
        # Get price change percentage (past 1 hour)
        hour_ago = datetime.utcnow() - timedelta(hours=1)
        old_tick = db.query(StockTick).filter(
            StockTick.ticker == t,
            StockTick.timestamp <= hour_ago
        ).order_by(StockTick.timestamp.desc()).first()
        
        # Fallback if no old ticks, compare to open price
        base_price = old_tick.price if old_tick else (latest_tick.open or latest_tick.price)
        price_change_pct = round(((latest_tick.price - base_price) / base_price) * 100, 2) if base_price > 0 else 0.0
        
        # Get 5-min sentiment averages
        recent_sentiment = db.query(SentimentAggregate).filter(
            SentimentAggregate.ticker == t
        ).order_by(SentimentAggregate.window_end.desc()).first()
        
        avg_sentiment = round(recent_sentiment.avg_sentiment, 3) if recent_sentiment else 0.0
        bull_ratio = round(recent_sentiment.bullish_ratio, 3) if recent_sentiment else 0.5
        tweet_cnt = recent_sentiment.tweet_count if recent_sentiment else 0
        
        # Get latest correlation signal
        signal_rec = db.query(CorrelationSignal).filter(
            CorrelationSignal.ticker == t
        ).order_by(CorrelationSignal.timestamp.desc()).first()
        
        signal = signal_rec.signal if signal_rec else "HOLD"
        pearson = round(signal_rec.pearson, 3) if signal_rec else 0.0
        
        ticker_summaries.append(TickerSummary(
            ticker=t,
            current_price=latest_tick.price,
            price_change_pct=price_change_pct,
            volume=latest_tick.volume,
            avg_sentiment=avg_sentiment,
            bullish_ratio=bull_ratio,
            tweet_count=tweet_cnt,
            signal=signal,
            pearson=pearson
        ))
        
    return MarketSummaryResponse(
        timestamp=datetime.now(),
        tickers=ticker_summaries
    )

@app.get("/api/correlation/{ticker}", response_model=CorrelationDetailResponse)
def get_correlation_detail(ticker: str, db: Session = Depends(get_db)):
    if ticker not in TICKERS:
        raise HTTPException(status_code=400, detail="Ticker not supported")
        
    # Get latest correlation record
    latest_signal = db.query(CorrelationSignal).filter(
        CorrelationSignal.ticker == ticker
    ).order_by(CorrelationSignal.timestamp.desc()).first()
    
    pearson = latest_signal.pearson if latest_signal else 0.0
    confidence = latest_signal.confidence if latest_signal else 0.5
    signal = latest_signal.signal if latest_signal else "HOLD"
    
    # Gather alignment timeline points (last 30 stock ticks paired with closest sentiment)
    # We will pull ticks for the last 30 minutes
    recent_ticks = db.query(StockTick).filter(
        StockTick.ticker == ticker
    ).order_by(StockTick.timestamp.desc()).limit(30).all()
    
    # Sort chronologically
    recent_ticks = recent_ticks[::-1]
    
    timeline = []
    for tick in recent_ticks:
        # Find matching 5-min sentiment aggregate window
        m_sentiment = db.query(SentimentAggregate).filter(
            SentimentAggregate.ticker == ticker,
            SentimentAggregate.window_start <= tick.timestamp,
            SentimentAggregate.window_end >= tick.timestamp
        ).first()
        
        sentiment_score = m_sentiment.avg_sentiment if m_sentiment else 0.0
        
        # Build timeline point
        timeline.append(CorrelationTimelinePoint(
            timestamp=tick.timestamp.strftime("%H:%M:%S"),
            price=tick.price,
            sentiment=sentiment_score,
            pearson=pearson
        ))
        
    return CorrelationDetailResponse(
        ticker=ticker,
        pearson_coefficient=pearson,
        confidence_score=confidence,
        trading_signal=signal,
        timeline=timeline
    )

@app.get("/api/alerts", response_model=List[AlertResponse])
def get_alerts(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).limit(limit).all()
    return alerts

@app.get("/api/dashboard", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    # 1. Calculate macro Fear & Greed Index
    # Based on overall average sentiment of all tweets in the last 2 hours
    two_hours_ago = datetime.utcnow() - timedelta(hours=2)
    avg_compound = db.query(func.avg(Tweet.compound)).filter(Tweet.timestamp >= two_hours_ago).scalar()
    
    # Scale compound [-1.0, 1.0] to Fear & Greed [0, 100]
    compound_val = avg_compound if avg_compound is not None else 0.0
    fear_greed_score = int((compound_val + 1.0) * 50)
    
    # Define macro mood
    if fear_greed_score < 25:
        market_mood = "EXTREME FEAR"
    elif fear_greed_score < 45:
        market_mood = "FEAR"
    elif fear_greed_score <= 55:
        market_mood = "NEUTRAL"
    elif fear_greed_score <= 75:
        market_mood = "GREED"
    else:
        market_mood = "EXTREME GREED"
        
    # 2. Trending tickers (most discussed in last 1 hour)
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    trending_query = db.query(
        Tweet.ticker,
        func.count(Tweet.id).label("cnt")
    ).filter(Tweet.timestamp >= one_hour_ago)\
     .group_by(Tweet.ticker)\
     .order_by(text("cnt DESC"))\
     .limit(4).all()
     
    discussed_tickers = [{"ticker": item[0], "mentions": item[1]} for item in trending_query]
    
    # 3. Top Gainers & Losers (based on price changes from open price)
    gainers = []
    losers = []
    
    for t in TICKERS:
        latest = db.query(StockTick).filter(StockTick.ticker == t).order_by(StockTick.timestamp.desc()).first()
        if latest:
            open_p = latest.open or latest.price
            change = round(((latest.price - open_p) / open_p) * 100, 2) if open_p > 0 else 0.0
            item = {"ticker": t, "price": latest.price, "change": change}
            if change >= 0:
                gainers.append(item)
            else:
                losers.append(item)
                
    top_gainers = sorted(gainers, key=lambda x: x["change"], reverse=True)[:3]
    top_losers = sorted(losers, key=lambda x: x["change"], reverse=False)[:3]
    
    # 4. News Feed (Latest tweets / headlines)
    recent_tweets = db.query(Tweet).order_by(Tweet.timestamp.desc()).limit(6).all()
    news_feed = [
        {
            "id": tw.id, "ticker": tw.ticker, "headline": tw.text,
            "username": tw.username, "sentiment": "BULLISH" if tw.compound > 0.15 else ("BEARISH" if tw.compound < -0.15 else "NEUTRAL"),
            "timestamp": tw.timestamp.strftime("%H:%M:%S")
        }
        for tw in recent_tweets
    ]
    
    return DashboardSummaryResponse(
        fear_greed_score=fear_greed_score,
        market_mood=market_mood,
        discussed_tickers=discussed_tickers,
        top_gainers=top_gainers,
        top_losers=top_losers,
        news_feed=news_feed
    )

@app.post("/api/log-tweet")
def log_manual_tweet(payload: TweetLogCreate, db: Session = Depends(get_db)):
    # Feed manual tweet logs into the pipeline
    analyzer_model = os.getenv("SENTIMENT_MODEL", "vader")
    analyzer = get_sentiment_analyzer(analyzer_model)
    
    # Score sentiment
    scores = analyzer.analyze_sentiment(payload.text)
    
    tweet_id = f"tw_manual_{int(datetime.utcnow().timestamp())}_{random.randint(1000, 9999)}"
    new_tweet = Tweet(
        id=tweet_id,
        ticker=payload.ticker.upper(),
        text=payload.text,
        username=payload.username,
        timestamp=datetime.utcnow(),
        followers=payload.followers,
        likes=0,
        retweets=0,
        views=15,
        source="Manual API Feed",
        compound=scores["compound"],
        pos=scores["pos"],
        neg=scores["neg"],
        neu=scores["neu"],
        confidence_score=0.98,
        bot_probability=0.01
    )
    
    db.add(new_tweet)
    db.commit()
    db.refresh(new_tweet)
    
    return {"status": "success", "message": "Manual tweet logged", "tweet": {
        "id": new_tweet.id,
        "ticker": new_tweet.ticker,
        "sentiment": scores
    }}

@app.post("/api/reset")
def reset_database(db: Session = Depends(get_db)):
    # Truncate tables for resetting demo state
    try:
        db.query(Alert).delete()
        db.query(CorrelationSignal).delete()
        db.query(SentimentAggregate).delete()
        db.query(Tweet).delete()
        db.query(StockTick).delete()
        db.commit()
        return {"status": "success", "message": "Database tables truncated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reset failed: {e}")

@app.get("/health")
def get_health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    # Returns lightweight statistics
    return {
        "total_tweets": db.query(Tweet).count(),
        "total_ticks": db.query(StockTick).count(),
        "total_signals": db.query(CorrelationSignal).count(),
        "total_alerts": db.query(Alert).count()
    }

# ----------------- WebSocket Route -----------------

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for client messages if any
            data = await websocket.receive_text()
            # Simple Echo back for diagnostics
            await websocket.send_json({"type": "echo", "received": data, "timestamp": datetime.now().isoformat()})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
