import os
import sys
import time
import json
from typing import List

# Add parent path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from pipeline.providers import get_market_data_provider, get_social_data_provider

TICKERS = ["TSLA", "AAPL", "NVDA", "MSFT", "META", "AMZN", "GOOGL", "NFLX"]

def main():
    source_type = os.getenv("DATA_SOURCE", "mock")
    kafka_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9094")
    
    print(f"Initializing Kafka stream generator. Data Source: {source_type.upper()}")
    
    # Ingest Kafka Producer
    try:
        from kafka import KafkaProducer
        producer = KafkaProducer(
            bootstrap_servers=kafka_servers.split(","),
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        print("Connected to Kafka bootstrap servers successfully.")
    except Exception as e:
        print(f"Error initializing Kafka Producer: {e}. Exiting Kafka Generator.")
        sys.exit(1)
        
    market_provider = get_market_data_provider(source_type)
    social_provider = get_social_data_provider(source_type)
    
    print("Streaming started. Producing events...")
    
    last_social_fetch = 0
    social_interval = 8 # Fetch news/tweets every 8 seconds
    
    try:
        while True:
            # 1. Fetch & Produce Stock prices
            prices = market_provider.fetch_latest_prices(TICKERS)
            for price_item in prices:
                producer.send("stock_prices", key=price_item["ticker"].encode('utf-8'), value=price_item)
                
            # 2. Fetch & Produce Tweets/News (interval regulated)
            current_time = time.time()
            if current_time - last_social_fetch >= social_interval:
                tweets = social_provider.fetch_latest_social(TICKERS)
                for tweet in tweets:
                    producer.send("social_tweets", key=tweet["ticker"].encode('utf-8'), value=tweet)
                last_social_fetch = current_time
                
            producer.flush()
            time.sleep(1.0) # Tick rate: 1 second
            
    except KeyboardInterrupt:
        print("Shutting down Kafka stream generator.")
    finally:
        producer.close()

if __name__ == "__main__":
    main()
