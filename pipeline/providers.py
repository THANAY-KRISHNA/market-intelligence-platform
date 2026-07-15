import urllib.request
import json
import random
import time
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Any

# Define Abstract Base Class in python terms
class BaseMarketDataProvider:
    def fetch_latest_prices(self, tickers: List[str]) -> List[Dict[str, Any]]:
        raise NotImplementedError

class BaseSocialDataProvider:
    def fetch_latest_social(self, tickers: List[str]) -> List[Dict[str, Any]]:
        raise NotImplementedError

# ----------------- Market Data Providers -----------------

class MockMarketProvider(BaseMarketDataProvider):
    def __init__(self):
        # Initial base prices
        self.prices = {
            "TSLA": 180.0, "AAPL": 175.0, "NVDA": 850.0, "MSFT": 420.0,
            "META": 480.0, "AMZN": 180.0, "GOOGL": 150.0, "NFLX": 600.0
        }
        self.volatilities = {t: 0.015 for t in self.prices}
        self.momentum = {t: 0.0 for t in self.prices}

    def fetch_latest_prices(self, tickers: List[str]) -> List[Dict[str, Any]]:
        results = []
        for t in tickers:
            if t not in self.prices:
                continue
            
            # Simulate price movement via Random Walk with Gaussian Noise & Momentum
            vol = self.volatilities[t]
            mom = self.momentum[t]
            
            # Simple momentum update
            mom = 0.8 * mom + 0.2 * random.normalvariate(0.0, 0.05)
            self.momentum[t] = mom
            
            # Base price adjustment percentage
            change_pct = random.normalvariate(0.0, vol) + mom
            
            # Rare Shock Events (1% probability)
            if random.random() < 0.01:
                shock = random.choice([-0.05, 0.05]) # Up or down 5%
                change_pct += shock
                
            old_price = self.prices[t]
            new_price = round(old_price * (1.0 + change_pct), 2)
            self.prices[t] = new_price
            
            # Compute mock OHLC
            low = round(min(old_price, new_price) * (1.0 - abs(random.normalvariate(0.0, 0.002))), 2)
            high = round(max(old_price, new_price) * (1.0 + abs(random.normalvariate(0.0, 0.002))), 2)
            
            volume = random.randint(1000, 50000)

            results.append({
                "ticker": t,
                "price": new_price,
                "open": old_price,
                "high": high,
                "low": low,
                "close": new_price,
                "volume": volume,
                "timestamp": datetime.now().isoformat()
            })
        return results

class YahooFinanceProvider(BaseMarketDataProvider):
    """
    Real Market Data Provider utilizing Yahoo Finance v8 API.
    Fetches real-time price info with zero dependencies.
    """
    def fetch_latest_prices(self, tickers: List[str]) -> List[Dict[str, Any]]:
        results = []
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        for t in tickers:
            try:
                # Yahoo Finance v8 chart query
                url = f"https://query1.finance.yahoo.com/v8/finance/chart/{t}?interval=1m&range=1d"
                req = urllib.request.Request(url, headers=headers)
                
                with urllib.request.urlopen(req, timeout=5) as response:
                    data = json.loads(response.read().decode())
                    result_node = data["chart"]["result"][0]
                    indicators = result_node["indicators"]["quote"][0]
                    meta = result_node["meta"]
                    
                    price = round(meta["regularMarketPrice"], 2)
                    volume = int(indicators["volume"][-1] or 0)
                    
                    results.append({
                        "ticker": t,
                        "price": price,
                        "open": round(indicators["open"][-1] or price, 2),
                        "high": round(indicators["high"][-1] or price, 2),
                        "low": round(indicators["low"][-1] or price, 2),
                        "close": price,
                        "volume": volume,
                        "timestamp": datetime.now().isoformat()
                    })
            except Exception as e:
                # Fallback to mock on connection error to ensure robustness
                print(f"Error fetching Yahoo Finance for {t}: {e}. Falling back to mock price.")
                fallback = MockMarketProvider()
                results.append(fallback.fetch_latest_prices([t])[0])
        return results

# ----------------- Social Data Providers -----------------

MOCK_TWEET_TEXTS = {
    "bullish": [
        "is looking absolutely unstoppable right now. Targets set higher! 🚀",
        "earnings are going to be massive. Buying the dip before the breakout.",
        "institutional volume is spiking here. Bull flag pattern forming. 🔥",
        "is the absolute future. Hard to ignore this momentum.",
        "AI demand and product pipeline are completely dominating.",
        "breaking major resistance levels. Next stop is all-time highs!"
    ],
    "bearish": [
        "guidance looks extremely weak, sell-off incoming. 📉",
        "overvalued, bubble territory. Taking profits and moving to cash.",
        "insiders are selling off shares. Major red flag.",
        "technical support levels broken. Next leg down starting.",
        "product delays and supply constraints are dragging progress down.",
        "regulators looking into investigations. Hard pass for now."
    ],
    "neutral": [
        "analyzing the 10-K report. Normal trading ranges for now.",
        "consolidating within this wedge. Waiting for direction.",
        "just holding positions. No clear breakout signal yet.",
        "investing with a long-term view. Short-term movements are just noise.",
        "shares trading sideways ahead of the upcoming macro reports."
    ]
}

USERNAMES = ["alpha_trader", "bull_market_cap", "macro_pulse", "option_god", "quant_vision", "finance_bee", "value_investor", "wsb_degen"]
HASHTAGS = ["#trading", "#stocks", "#finance", "#bullish", "#investing", "#wallstreet", "#market"]

class MockSocialProvider(BaseSocialDataProvider):
    def fetch_latest_social(self, tickers: List[str]) -> List[Dict[str, Any]]:
        results = []
        for _ in range(random.randint(1, 4)):  # Generate 1 to 4 tweets per fetch cycle
            t = random.choice(tickers)
            sentiment_cat = random.choice(["bullish", "bearish", "neutral"])
            text_template = random.choice(MOCK_TWEET_TEXTS[sentiment_cat])
            
            tweet_text = f"${t} {text_template}"
            if random.random() < 0.5:
                tweet_text += f" {random.choice(HASHTAGS)}"
                
            confidence = round(random.uniform(0.65, 0.99), 2)
            bot_prob = round(random.uniform(0.01, 0.35) if random.random() > 0.15 else random.uniform(0.7, 0.99), 2)

            results.append({
                "id": f"tw_{int(time.time() * 1000)}_{random.randint(1000, 9999)}",
                "ticker": t,
                "text": tweet_text,
                "username": random.choice(USERNAMES),
                "timestamp": datetime.now().isoformat(),
                "followers": random.randint(100, 150000),
                "likes": random.randint(1, 450),
                "retweets": random.randint(0, 120),
                "views": random.randint(20, 25000),
                "source": random.choice(["Twitter Web App", "Twitter for iPhone", "Twitter for Android"]),
                "confidence_score": confidence,
                "bot_probability": bot_prob
            })
        return results

class NewsApiProvider(BaseSocialDataProvider):
    """
    Real-time news headlines fetched via Yahoo Finance RSS feed.
    No API keys required, parsing XML directly.
    """
    def fetch_latest_social(self, tickers: List[str]) -> List[Dict[str, Any]]:
        results = []
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        t = random.choice(tickers)  # Pull news for a random ticker to distribute load
        
        try:
            url = f"https://finance.yahoo.com/rss/headlines?s={t}"
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=5) as response:
                xml_data = response.read()
                root = ET.fromstring(xml_data)
                
                # Parse RSS items
                items = root.findall(".//item")
                if items:
                    # Pick 2 random recent items
                    for item in random.sample(items, min(len(items), 2)):
                        title = item.find("title").text
                        description = item.find("description").text if item.find("description") is not None else ""
                        pub_date = item.find("pubDate").text if item.find("pubDate") is not None else datetime.now().isoformat()
                        
                        tweet_text = f"${t} News: {title}. {description[:100]}"
                        
                        results.append({
                            "id": f"news_{hash(title) % 100000000}",
                            "ticker": t,
                            "text": tweet_text,
                            "username": "YahooFinanceNews",
                            "timestamp": datetime.now().isoformat(),
                            "followers": 1500000,
                            "likes": random.randint(10, 80),
                            "retweets": random.randint(2, 25),
                            "views": random.randint(1000, 15000),
                            "source": "Yahoo Finance RSS",
                            "confidence_score": 0.95,
                            "bot_probability": 0.05
                        })
        except Exception as e:
            print(f"Error fetching news RSS for {t}: {e}. Falling back to mock tweets.")
            # Fallback to mock tweets
            fallback = MockSocialProvider()
            results.extend(fallback.fetch_latest_social([t]))
            
        return results

# ----------------- Factory Functions -----------------

def get_market_data_provider(source_type: str) -> BaseMarketDataProvider:
    if source_type.lower() == "live":
        return YahooFinanceProvider()
    return MockMarketProvider()

def get_social_data_provider(source_type: str) -> BaseSocialDataProvider:
    if source_type.lower() == "live":
        return NewsApiProvider()
    return MockSocialProvider()
