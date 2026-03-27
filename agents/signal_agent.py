import pandas as pd
from typing import Dict, Any, List

class SignalAgent:
    """Agent responsible for detecting real-time market signals."""
    
    def detect_signals(self, df: pd.DataFrame, ticker: str) -> List[Dict[str, Any]]:
        """Analyze recent price and volume for breakout signals."""
        signals = []
        if df is None or len(df) < 20:
            return signals
            
        latest = df.iloc[-1]
        previous = df.iloc[-2]
        
        # 1. Volume Spikes
        avg_volume_20 = df['Volume'].tail(20).mean()
        if latest['Volume'] > avg_volume_20 * 2.5:
            signals.append({
                "type": "Unusual Volume",
                "message": f"Unusual volume surge detected in {ticker} ({(latest['Volume']/avg_volume_20):.1f}x avg)",
                "impact": "Bullish" if latest['Close'] > previous['Close'] else "Bearish"
            })
            
        # 2. Price Breakouts (Over 20-day high)
        high_20 = df['High'].tail(20).max()
        if latest['Close'] > high_20 * 0.99 and latest['Close'] > previous['Close']:
            signals.append({
                "type": "Breakout",
                "message": f"Bullish breakout detected in {ticker}: price crossing recent highs.",
                "impact": "Bullish"
            })
            
        # 3. Sudden Trend Reversals
        # e.g. down 3 days, now up big with volume
        if len(df) >= 4:
            down_trend = all(df['Close'].iloc[-i] < df['Close'].iloc[-i-1] for i in range(2, 4))
            reversal = latest['Close'] > previous['Close'] * 1.02
            if down_trend and reversal:
                signals.append({
                    "type": "Reversal",
                    "message": f"Potential reversal pattern forming in {ticker} after recent downtrend.",
                    "impact": "Bullish"
                })

        return signals
