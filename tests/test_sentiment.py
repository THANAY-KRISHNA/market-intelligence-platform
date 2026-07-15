import unittest
import sys
import os

# Add parent path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.analyzer import get_sentiment_analyzer, VaderAnalyzer

class TestSentimentIntensityAnalyzer(unittest.TestCase):
    def setUp(self):
        self.analyzer = get_sentiment_analyzer("vader")

    def test_positive_tweet(self):
        text = "$TSLA is going to explode! Best stock ever 🚀🚀"
        scores = self.analyzer.analyze_sentiment(text)
        self.assertGreater(scores["compound"], 0.3)
        self.assertGreater(scores["pos"], 0.1)
        self.assertEqual(scores["neg"], 0.0)

    def test_negative_tweet(self):
        text = "$AAPL is a terrible investment, sales are crashing down. 📉"
        scores = self.analyzer.analyze_sentiment(text)
        self.assertLess(scores["compound"], -0.3)
        self.assertGreater(scores["neg"], 0.1)
        self.assertEqual(scores["pos"], 0.0)

    def test_neutral_tweet(self):
        text = "$MSFT is a stock."
        scores = self.analyzer.analyze_sentiment(text)
        self.assertEqual(scores["compound"], 0.0)

if __name__ == '__main__':
    unittest.main()
