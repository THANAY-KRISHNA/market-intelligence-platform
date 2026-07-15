from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

class StockTick(Base):
    __tablename__ = "stock_ticks"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticker = Column(String(10), nullable=False, index=True)
    price = Column(Float, nullable=False)
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    close = Column(Float, nullable=True)
    volume = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)

    __table_args__ = (
        Index("idx_tick_ticker_timestamp", "ticker", "timestamp"),
    )

class Tweet(Base):
    __tablename__ = "tweets"
    
    id = Column(String(50), primary_key=True)
    ticker = Column(String(10), nullable=False, index=True)
    text = Column(String(500), nullable=False)
    username = Column(String(100), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    followers = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    retweets = Column(Integer, default=0)
    views = Column(Integer, default=0)
    source = Column(String(100), nullable=True)
    
    # NLP Features
    compound = Column(Float, nullable=False)
    pos = Column(Float, nullable=False)
    neg = Column(Float, nullable=False)
    neu = Column(Float, nullable=False)
    confidence_score = Column(Float, default=1.0)
    bot_probability = Column(Float, default=0.0)

    __table_args__ = (
        Index("idx_tweet_ticker_timestamp", "ticker", "timestamp"),
    )

class SentimentAggregate(Base):
    __tablename__ = "sentiment_aggregates"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticker = Column(String(10), nullable=False, index=True)
    window_start = Column(DateTime, nullable=False, index=True)
    window_end = Column(DateTime, nullable=False, index=True)
    avg_sentiment = Column(Float, nullable=False)
    tweet_count = Column(Integer, nullable=False)
    bullish_ratio = Column(Float, nullable=False)
    bearish_ratio = Column(Float, nullable=False)
    velocity = Column(Float, default=0.0)

    __table_args__ = (
        Index("idx_sent_agg_ticker_window", "ticker", "window_start"),
    )

class CorrelationSignal(Base):
    __tablename__ = "correlation_signals"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticker = Column(String(10), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    pearson = Column(Float, nullable=False)
    lag = Column(Integer, default=0)
    signal = Column(String(10), nullable=False)  # BUY, SELL, HOLD
    confidence = Column(Float, nullable=False)

    __table_args__ = (
        Index("idx_corr_ticker_timestamp", "ticker", "timestamp"),
    )

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticker = Column(String(10), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    severity = Column(String(20), nullable=False)  # INFO, WARNING, CRITICAL
    message = Column(String(500), nullable=False)
    type = Column(String(50), nullable=False)  # e.g., Bullish Spike, Bearish Crash
