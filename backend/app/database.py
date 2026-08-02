import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configured to look at postgres first, then fallback to SQLite with dynamic path resolution
possible_paths = [
    os.path.join(os.path.dirname(__file__), "..", "market_sentiment.db"),
    os.path.join(os.path.dirname(__file__), "..", "..", "market_sentiment.db"),
    os.path.abspath("market_sentiment.db"),
    os.path.abspath("backend/market_sentiment.db")
]

db_file = "market_sentiment.db"
for p in possible_paths:
    if os.path.exists(p):
        db_file = os.path.abspath(p)
        break

default_db_url = f"sqlite:///{db_file}"
DATABASE_URL = os.getenv("DATABASE_URL", default_db_url)

# Configuration adjustments based on DB type
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

