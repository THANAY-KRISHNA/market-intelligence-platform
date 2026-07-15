import os
import sys
import time
import asyncio
import math
from datetime import datetime, timedelta
from typing import List

# Add parent path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.database import SessionLocal, engine
from backend.app.models import Base, StockTick, Tweet, SentimentAggregate, CorrelationSignal, Alert
from backend.app.analyzer import get_sentiment_analyzer
from pipeline.providers import get_market_data_provider, get_social_data_provider

TICKERS = ["TSLA", "AAPL", "NVDA", "MSFT", "META", "AMZN", "GOOGL", "NFLX"]

# Pearson Correlation Helper
def calculate_pearson(x: List[float], y: List[float]) -> float:
    n = len(x)
    if n <= 1:
        return 0.0
    mean_x = sum(x) / n
    mean_y = sum(y) / n
    
    num = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    den_x = sum((xi - mean_x) ** 2 for xi in x)
    den_y = sum((yi - mean_y) ** 2 for yi in y)
    
    if den_x == 0 or den_y == 0:
        return 0.0
    return num / math.sqrt(den_x * den_y)

async def market_stream_worker():
    source_type = os.getenv("DATA_SOURCE", "mock")
    market_provider = get_market_data_provider(source_type)
    print(f"[WORKER] Stock market price stream generator started. Source: {source_type.upper()}")
    
    while True:
        try:
            db = SessionLocal()
            ticks = market_provider.fetch_latest_prices(TICKERS)
            for item in ticks:
                db_tick = StockTick(
                    ticker=item["ticker"],
                    price=item["price"],
                    open=item["open"],
                    high=item["high"],
                    low=item["low"],
                    close=item["close"],
                    volume=item["volume"],
                    timestamp=datetime.fromisoformat(item["timestamp"])
                )
                db.add(db_tick)
            db.commit()
            db.close()
        except Exception as e:
            print(f"[WORKER] Error in market price collector: {e}")
            
        await asyncio.sleep(1.0) # Price ticks every 1 second

async def social_stream_worker():
    source_type = os.getenv("DATA_SOURCE", "mock")
    social_provider = get_social_data_provider(source_type)
    analyzer_model = os.getenv("SENTIMENT_MODEL", "vader")
    analyzer = get_sentiment_analyzer(analyzer_model)
    
    print(f"[WORKER] Social sentiment pipeline started. Source: {source_type.upper()}. NLP Model: {analyzer_model.upper()}")
    
    while True:
        try:
            db = SessionLocal()
            tweets = social_provider.fetch_latest_social(TICKERS)
            for item in tweets:
                # Perform real-time NLP sentiment analysis
                sentiment = analyzer.analyze_sentiment(item["text"])
                
                db_tweet = Tweet(
                    id=item["id"],
                    ticker=item["ticker"],
                    text=item["text"],
                    username=item["username"],
                    timestamp=datetime.fromisoformat(item["timestamp"]),
                    followers=item["followers"],
                    likes=item["likes"],
                    retweets=item["retweets"],
                    views=item["views"],
                    source=item["source"],
                    compound=sentiment["compound"],
                    pos=sentiment["pos"],
                    neg=sentiment["neg"],
                    neu=sentiment["neu"],
                    confidence_score=item["confidence_score"],
                    bot_probability=item["bot_probability"]
                )
                db.add(db_tweet)
                
                # Anomaly Detection: Trigger warning alerts for extreme high/low sentiment
                if sentiment["compound"] <= -0.75:
                    alert = Alert(
                        ticker=item["ticker"],
                        timestamp=datetime.now(),
                        severity="CRITICAL",
                        message=f"Panic Alert: Extreme Bearish Sentiment detected on ${item['ticker']}. Username: @{item['username']}",
                        type="Bearish Crash"
                    )
                    db.add(alert)
                elif sentiment["compound"] >= 0.75:
                    alert = Alert(
                        ticker=item["ticker"],
                        timestamp=datetime.now(),
                        severity="INFO",
                        message=f"FOMO Alert: Extreme Bullish Sentiment detected on ${item['ticker']}. Username: @{item['username']}",
                        type="Bullish Spike"
                    )
                    db.add(alert)
                    
            db.commit()
            db.close()
        except Exception as e:
            print(f"[WORKER] Error in social stream collector: {e}")
            
        await asyncio.sleep(8.0) # Social ticks every 8 seconds

async def aggregation_correlation_worker():
    # Processes rolling window aggregations and correlations every 15 seconds
    print("[WORKER] Aggregation & Correlation analytics calculator started.")
    await asyncio.sleep(5.0) # Let data populate first
    
    while True:
        try:
            db = SessionLocal()
            now = datetime.utcnow()
            five_mins_ago = now - timedelta(minutes=5)
            
            for t in TICKERS:
                # 1. 5-Min Rolling Sentiment Aggregation
                # Count and compute VADER averages
                tweets_in_window = db.query(Tweet).filter(
                    Tweet.ticker == t,
                    Tweet.timestamp >= five_mins_ago
                ).all()
                
                cnt = len(tweets_in_window)
                if cnt == 0:
                    continue
                    
                avg_sent = sum(tw.compound for tw in tweets_in_window) / cnt
                bull_cnt = sum(1 for tw in tweets_in_window if tw.compound > 0.15)
                bear_cnt = sum(1 for tw in tweets_in_window if tw.compound < -0.15)
                bull_ratio = bull_cnt / cnt
                bear_ratio = bear_cnt / cnt
                
                # Calculate velocity (rate of tweets per minute)
                velocity = cnt / 5.0
                
                agg = SentimentAggregate(
                    ticker=t,
                    window_start=five_mins_ago,
                    window_end=now,
                    avg_sentiment=avg_sent,
                    tweet_count=cnt,
                    bullish_ratio=bull_ratio,
                    bearish_ratio=bear_ratio,
                    velocity=velocity
                )
                db.add(agg)
                
                # 2. Pearson Correlation & Trading Signals
                # Pull stock ticks and match them by timestamps to tweets in the window
                ticks_in_window = db.query(StockTick).filter(
                    StockTick.ticker == t,
                    StockTick.timestamp >= five_mins_ago
                ).order_by(StockTick.timestamp.asc()).all()
                
                if len(ticks_in_window) >= 5:
                    # Align price history and sentiment history
                    prices = [tk.price for tk in ticks_in_window]
                    
                    # For each tick, calculate rolling sentiment score at that tick
                    sentiments = []
                    for tk in ticks_in_window:
                        # Sentiment in 2-min window surrounding that tick
                        t_start = tk.timestamp - timedelta(minutes=2)
                        t_end = tk.timestamp
                        sub_tweets = [tw.compound for tw in tweets_in_window if t_start <= tw.timestamp <= t_end]
                        sentiments.append(sum(sub_tweets)/len(sub_tweets) if sub_tweets else 0.0)
                        
                    # Pearson Correlation calculation
                    pearson = calculate_pearson(prices, sentiments)
                    
                    # Calculate momentum (price slope)
                    price_change = (prices[-1] - prices[0]) / prices[0]
                    
                    # Determine Trading Signal
                    trading_signal = "HOLD"
                    confidence = 0.5
                    
                    # BUY: positive sentiment + positive price trend correlation + price momentum
                    if avg_sent > 0.4 and pearson > 0.25 and price_change > 0.002:
                        trading_signal = "BUY"
                        confidence = round(min(0.99, 0.5 + abs(pearson) * 0.4 + price_change * 10), 2)
                    # SELL: negative sentiment + negative price trend correlation
                    elif avg_sent < -0.4 and pearson < -0.25 and price_change < -0.002:
                        trading_signal = "SELL"
                        confidence = round(min(0.99, 0.5 + abs(pearson) * 0.4 + abs(price_change) * 10), 2)
                        
                    db_signal = CorrelationSignal(
                        ticker=t,
                        timestamp=now,
                        pearson=pearson,
                        lag=0,
                        signal=trading_signal,
                        confidence=confidence
                    )
                    db.add(db_signal)
                    
                    # Store alert if signal changes from HOLD
                    if trading_signal != "HOLD":
                        alert = Alert(
                            ticker=t,
                            timestamp=now,
                            severity="WARNING" if confidence < 0.75 else "CRITICAL",
                            message=f"Trading Alert: Strong {trading_signal} Signal generated for ${t}. Pearson: {round(pearson,2)}. Confidence: {int(confidence*100)}%",
                            type="Momentum Shift"
                        )
                        db.add(alert)
                        
            db.commit()
            db.close()
        except Exception as e:
            print(f"[WORKER] Error in aggregation and correlation analytics: {e}")
            
        await asyncio.sleep(15.0) # Run calculations every 15 seconds

async def main():
    print("Starting local fallback background workers...")
    
    # Verify tables are initialized
    try:
        db = SessionLocal()
        # Verify db connection is healthy
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        print(f"Error connecting to database: {e}. Running init_db first.")
        Base.metadata.create_all(bind=engine)
        
    # Launch concurrent tasks
    await asyncio.gather(
        market_stream_worker(),
        social_stream_worker(),
        aggregation_correlation_worker()
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Fallback background workers terminated.")
