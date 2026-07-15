import os
import sys
from typing import Dict

# Helper to load VADER dynamically and ensure lexicon is present
class BaseSentimentAnalyzer:
    def analyze_sentiment(self, text: str) -> Dict[str, float]:
        raise NotImplementedError

class VaderAnalyzer(BaseSentimentAnalyzer):
    def __init__(self):
        try:
            import nltk
            from nltk.sentiment.vader import SentimentIntensityAnalyzer
            
            # Automate download of Lexicon resource
            try:
                nltk.data.find('sentiment/vader_lexicon.zip')
            except LookupError:
                print("Downloading NLTK VADER lexicon...")
                nltk.download('vader_lexicon', quiet=True)
                
            self.sid = SentimentIntensityAnalyzer()
        except ImportError:
            print("Warning: NLTK not installed. Using a fallback regex sentiment scorer.")
            self.sid = None

    def analyze_sentiment(self, text: str) -> Dict[str, float]:
        if self.sid:
            scores = self.sid.polarity_scores(text)
            return {
                "compound": scores["compound"],
                "pos": scores["pos"],
                "neg": scores["neg"],
                "neu": scores["neu"]
            }
        
        # Simple regex/word-matching fallback if NLTK is not available
        text_lower = text.lower()
        pos_words = ["bull", "call", "buy", "up", "long", "moon", "good", "great", "revenue", "crush", "growth", "high", "gains", "🚀"]
        neg_words = ["bear", "put", "sell", "down", "short", "bad", "drop", "crash", "losses", "weak", "overvalued", "dump", "📉"]
        
        pos_count = sum(1 for w in pos_words if w in text_lower)
        neg_count = sum(1 for w in neg_words if w in text_lower)
        
        total = pos_count + neg_count
        if total == 0:
            return {"compound": 0.0, "pos": 0.0, "neg": 0.0, "neu": 1.0}
        
        pos_ratio = pos_count / total
        neg_ratio = neg_count / total
        compound = (pos_count - neg_count) / total
        
        return {
            "compound": round(compound, 3),
            "pos": round(pos_ratio, 3),
            "neg": round(neg_ratio, 3),
            "neu": 0.0
        }

class FinBertAnalyzer(BaseSentimentAnalyzer):
    """
    Financial BERT Sentiment Analyzer.
    Loads FinBERT model from transformers if available,
    otherwise falls back to VaderAnalyzer.
    """
    def __init__(self):
        self.fallback = VaderAnalyzer()
        self.model = None
        self.tokenizer = None
        
        try:
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            import torch
            
            model_name = "yiyanghkust/finbert-tone"
            print(f"Loading FinBERT model '{model_name}'...")
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model = self.model.to(self.device)
            print(f"FinBERT loaded successfully on {self.device}.")
        except Exception as e:
            print(f"Transformers/FinBERT not loaded ({e}). Falling back to VADER Sentiment Analyzer.")

    def analyze_sentiment(self, text: str) -> Dict[str, float]:
        if not self.model or not self.tokenizer:
            # Fallback to Vader
            return self.fallback.analyze_sentiment(text)
            
        import torch
        import torch.nn.functional as F
        
        try:
            inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            with torch.no_grad():
                outputs = self.model(**inputs)
                probs = F.softmax(outputs.logits, dim=-1).cpu().numpy()[0]
            
            # FinBERT Tone classes: 0 = Neutral, 1 = Positive, 2 = Negative
            # Map classes to compound score in range [-1.0, 1.0]
            neu, pos, neg = probs[0], probs[1], probs[2]
            compound = pos - neg
            
            return {
                "compound": float(compound),
                "pos": float(pos),
                "neg": float(neg),
                "neu": float(neu)
            }
        except Exception as e:
            print(f"FinBERT inference error: {e}. Falling back.")
            return self.fallback.analyze_sentiment(text)

class LlmAnalyzer(BaseSentimentAnalyzer):
    """
    Simulated LLM Sentiment Analyzer.
    Can be easily connected to OpenAI API or Ollama in production.
    """
    def __init__(self):
        self.fallback = VaderAnalyzer()

    def analyze_sentiment(self, text: str) -> Dict[str, float]:
        # Skeleton for API/Ollama integration
        # Under local development, it simulates a LLM's response using VADER scoring
        # but formats it like a LLM evaluation.
        scores = self.fallback.analyze_sentiment(text)
        
        # Add slight volatility to represent LLM variance
        scores["compound"] = max(-1.0, min(1.0, scores["compound"] * 1.05))
        return scores

# ----------------- Factory Function -----------------

def get_sentiment_analyzer(model_type: str) -> BaseSentimentAnalyzer:
    m_type = model_type.lower()
    if m_type == "finbert":
        return FinBertAnalyzer()
    elif m_type == "llm":
        return LlmAnalyzer()
    return VaderAnalyzer()
