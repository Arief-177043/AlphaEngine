import yfinance as yf
import pandas as pd
from typing import Optional
import numpy as np

class DataAgent:
    """Agent responsible for fetching market data."""
    def __init__(self, use_mock: bool = False):
        self.use_mock = use_mock

    def fetch_data(self, ticker: str, period: str = "3mo") -> Optional[pd.DataFrame]:
        """Fetch historical data for a ticker. Returns DataFrame with Open, High, Low, Close, Volume."""
        ticker = ticker.replace(" ", "").upper()
        if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
            ticker += ".NS"
            
        try:
            if self.use_mock:
                return self._generate_mock_data(ticker)
                
            ticker_obj = yf.Ticker(ticker)
            hist = ticker_obj.history(period=period)
            if hist.empty:
                return self._generate_mock_data(ticker)
            return hist
        except Exception as e:
            print(f"DataAgent Error ({ticker}): {e}")
            return self._generate_mock_data(ticker)

    def _generate_mock_data(self, ticker: str) -> pd.DataFrame:
        """Generate some fake realistic data if real data fails or mock is requested."""
        dates = pd.date_range(end=pd.Timestamp.now(), periods=60)
        np.random.seed(hash(ticker) % (2**32))
        
        base_price = np.random.uniform(100, 3000)
        returns = np.random.normal(0, 0.02, 60)
        prices = base_price * np.exp(returns.cumsum())
        
        # Add a sudden volume spike in the last few days
        volumes = np.random.randint(100000, 500000, 60)
        volumes[-1] = volumes[-1] * 5  # 5x volume spike today
        
        df = pd.DataFrame({
            "Open": prices * np.random.uniform(0.99, 1.01, 60),
            "High": prices * np.random.uniform(1.0, 1.02, 60),
            "Low": prices * np.random.uniform(0.98, 1.0, 60),
            "Close": prices,
            "Volume": volumes
        }, index=dates)
        return df

    def fetch_info(self, ticker: str) -> dict:
        ticker = ticker.replace(" ", "").upper()
        if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
            ticker += ".NS"
            
        if self.use_mock:
            return {"sector": "Technology", "shortName": f"{ticker} Limited", "currentPrice": 1500.0}
        try:
            info = yf.Ticker(ticker).info
            return info
        except:
            return {"sector": "Unknown", "shortName": ticker, "currentPrice": 0.0}
