from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any

# Pydantic v2 Config
pydantic_config = ConfigDict(from_attributes=True)

# ----------------- User Schemas -----------------
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)

class UserResponse(BaseModel):
    id: int
    username: str
    is_active: bool
    
    model_config = pydantic_config

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    username: str

# ----------------- Domain Schemas -----------------
class StockTickResponse(BaseModel):
    id: int
    ticker: str
    price: float
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: int
    timestamp: datetime
    
    model_config = pydantic_config

class TweetResponse(BaseModel):
    id: str
    ticker: str
    text: str
    username: str
    timestamp: datetime
    followers: int
    likes: int
    retweets: int
    views: int
    source: Optional[str] = None
    compound: float
    pos: float
    neg: float
    neu: float
    confidence_score: float
    bot_probability: float
    
    model_config = pydantic_config

class SentimentAggregateResponse(BaseModel):
    id: int
    ticker: str
    window_start: datetime
    window_end: datetime
    avg_sentiment: float
    tweet_count: int
    bullish_ratio: float
    bearish_ratio: float
    velocity: float
    
    model_config = pydantic_config

class CorrelationSignalResponse(BaseModel):
    id: int
    ticker: str
    timestamp: datetime
    pearson: float
    lag: int
    signal: str
    confidence: float
    
    model_config = pydantic_config

class AlertResponse(BaseModel):
    id: int
    ticker: str
    timestamp: datetime
    severity: str
    message: str
    type: str
    
    model_config = pydantic_config

# ----------------- API Payload Schemas -----------------
class TickerSummary(BaseModel):
    ticker: str
    current_price: float
    price_change_pct: float
    volume: int
    avg_sentiment: float
    bullish_ratio: float
    tweet_count: int
    signal: str  # BUY, SELL, HOLD
    pearson: float

class MarketSummaryResponse(BaseModel):
    timestamp: datetime
    tickers: List[TickerSummary]

class CorrelationTimelinePoint(BaseModel):
    timestamp: str
    price: float
    sentiment: float
    pearson: float

class CorrelationDetailResponse(BaseModel):
    ticker: str
    pearson_coefficient: float
    confidence_score: float
    trading_signal: str
    timeline: List[CorrelationTimelinePoint]

class DashboardSummaryResponse(BaseModel):
    fear_greed_score: int  # 0 to 100
    market_mood: str      # FEAR, GREED, NEUTRAL, EXTREME GREED
    discussed_tickers: List[Dict[str, Any]]
    top_gainers: List[Dict[str, Any]]
    top_losers: List[Dict[str, Any]]
    news_feed: List[Dict[str, Any]]

class TweetLogCreate(BaseModel):
    ticker: str
    text: str
    username: Optional[str] = "manual_feed"
    followers: Optional[int] = 500
