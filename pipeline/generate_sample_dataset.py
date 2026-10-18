import os
import random
import csv
from datetime import datetime, timedelta

TICKERS = [
    ("TSLA", "Tesla, Inc.", 248.50),
    ("AAPL", "Apple Inc.", 224.30),
    ("NVDA", "NVIDIA Corporation", 128.80),
    ("MSFT", "Microsoft Corporation", 446.50),
    ("META", "Meta Platforms, Inc.", 502.10),
    ("AMZN", "Amazon.com, Inc.", 186.40),
    ("GOOGL", "Alphabet Inc. (Google)", 178.90),
    ("NFLX", "Netflix, Inc.", 654.20)
]

SOURCES = ["Twitter/X", "StockTwits", "Reddit/r/wallstreetbets", "Bloomberg Terminal", "Reuters RSS"]

BULLISH_TEMPLATES = [
    "${ticker} strong breakout above resistance! Institutional accumulation underway.",
    "Record quarterly earnings forecast for ${ticker}. Upgrading price targets.",
    "Unbelievable momentum in ${ticker}. High buy-side order flow detected.",
    "${ticker} AI infrastructure expansion announced, demand exceeding production.",
    "Massive short squeeze potential in ${ticker}. Bulls are in full control."
]

BEARISH_TEMPLATES = [
    "Heavy distribution seen in ${ticker}. Support levels failing.",
    "Analyst downgrades ${ticker} citing margin compression and slowing growth.",
    "Unexpected inventory backlog reported for ${ticker}. Selling pressure mounting.",
    "Macro headwinds and high yield curve volatility impacting ${ticker} valuation.",
    "${ticker} insider selling alerts triggered. Caution recommended."
]

NEUTRAL_TEMPLATES = [
    "${ticker} trading in a tight consolidation range ahead of FOMC meeting.",
    "Options volume steady for ${ticker} across 30-day implied volatility.",
    "${ticker} daily volume in line with 90-day moving average.",
    "Market participants awaiting tomorrow's catalyst event on ${ticker}.",
    "Neutral sentiment prevails across sector peers alongside ${ticker}."
]

def generate():
    random.seed(42)
    rows = []
    base_time = datetime(2026, 10, 18, 9, 30, 0)
    
    for i in range(1, 10001):
        ticker, name, base_price = random.choice(TICKERS)
        source = random.choice(SOURCES)
        
        # Determine sentiment type
        sentiment_type = random.choices(["BULLISH", "BEARISH", "NEUTRAL"], weights=[0.45, 0.30, 0.25])[0]
        if sentiment_type == "BULLISH":
            text = random.choice(BULLISH_TEMPLATES).format(ticker=ticker)
            score = round(random.uniform(0.25, 0.95), 3)
            price_delta = random.uniform(0.005, 0.04)
        elif sentiment_type == "BEARISH":
            text = random.choice(BEARISH_TEMPLATES).format(ticker=ticker)
            score = round(random.uniform(-0.95, -0.25), 3)
            price_delta = random.uniform(-0.04, -0.005)
        else:
            text = random.choice(NEUTRAL_TEMPLATES).format(ticker=ticker)
            score = round(random.uniform(-0.15, 0.15), 3)
            price_delta = random.uniform(-0.005, 0.005)
            
        cur_price = round(base_price * (1.0 + price_delta) + random.uniform(-0.5, 0.5), 2)
        volume = random.randint(15000, 250000)
        likes = random.randint(0, 850)
        retweets = random.randint(0, 320)
        bot_prob = round(random.uniform(0.01, 0.45), 3)
        timestamp = base_time + timedelta(seconds=random.randint(0, 21600))
        part_hour = timestamp.hour
        
        # Inject realistic data quality flaws for profiling evaluation:
        # 1. Occasional missing source (0.5% missing)
        if random.random() < 0.005:
            source = ""
        # 2. Occasional missing bot probability (0.8% missing)
        if random.random() < 0.008:
            bot_prob = None
            
        rec_id = f"REC-{i:06d}"
        row = {
            "id": rec_id,
            "timestamp": timestamp.isoformat(),
            "ticker": ticker,
            "company_name": name,
            "source": source,
            "text": text,
            "sentiment_score": score,
            "sentiment_label": sentiment_type,
            "stock_price": cur_price,
            "trading_volume": volume,
            "engagement_likes": likes,
            "retweets_shares": retweets,
            "bot_probability": bot_prob if bot_prob is not None else "",
            "partition_hour": part_hour
        }
        rows.append(row)
        
    # Inject 20 realistic duplicates
    for _ in range(20):
        dup_row = dict(random.choice(rows[:500]))
        rows.append(dup_row)
        
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "financial_sentiment_10k.csv")
    
    headers = [
        "id", "timestamp", "ticker", "company_name", "source", "text",
        "sentiment_score", "sentiment_label", "stock_price", "trading_volume",
        "engagement_likes", "retweets_shares", "bot_probability", "partition_hour"
    ]
    
    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
        
    print(f"Dataset successfully generated: {out_file} with {len(rows)} records.")

if __name__ == "__main__":
    generate()
