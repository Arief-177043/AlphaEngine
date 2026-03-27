import pandas as pd
from typing import Dict, Any

class TechnicalAnalysisAgent:
    """Agent responsible for Chart Pattern Intelligence (TA)."""
    
    def analyze(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Implement simple logic for Support, Resistance, MA"""
        if df is None or len(df) < 50:
            return {}
            
        latest_price = df['Close'].iloc[-1]
        
        # Calculate Moving Averages
        ma_20 = df['Close'].tail(20).mean()
        ma_50 = df['Close'].tail(50).mean()
        
        # Very basic Support and Resistance
        recent_lows = df['Low'].tail(20).min()
        recent_highs = df['High'].tail(20).max()
        
        analysis = {
            "current_price": latest_price,
            "ma_20": ma_20,
            "ma_50": ma_50,
            "support_level": recent_lows,
            "resistance_level": recent_highs,
            "trend": "Bullish" if ma_20 > ma_50 else "Bearish"
        }
        
        # Plain-English explanation
        explanations = []
        if latest_price > recent_highs * 0.98:
            explanations.append("Stock is nearing resistance -> indicates upward momentum could stall or break out.")
        elif latest_price < recent_lows * 1.02:
            explanations.append("Stock is near support -> potential bounce point.")
            
        if ma_20 > ma_50:
            explanations.append("Short-term moving average (20d) is above medium-term (50d) -> upward momentum.")
        else:
            explanations.append("Short-term moving average (20d) is below medium-term (50d) -> downward momentum.")

        analysis["explanations"] = explanations
        return analysis
