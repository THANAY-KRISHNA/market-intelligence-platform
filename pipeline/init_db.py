import os
import sys

# Add parent path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.database import engine, Base
# Import all models to register them on Base metadata
from backend.app.models import User, StockTick, Tweet, SentimentAggregate, CorrelationSignal, Alert

def main():
    print("Initializing Database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Database schema successfully generated!")
    except Exception as e:
        print(f"Error occurred during database initialization: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
