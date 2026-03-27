from typing import Dict, Any, List
import os
import openai

class ExplanationAgent:
    """Agent responsible for explaining raw signals in simple English using LLM."""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key:
            openai.api_key = self.api_key
            
    def generate_insight(self, ticker: str, signals: List[dict], ta_data: dict) -> str:
        """Use LLM (or fallback) to convert raw signals into explanations."""
        if not signals and not ta_data:
            return f"No significant signals for {ticker} at the moment."
            
        prompt = f"Stock: {ticker}\n"
        if signals:
            prompt += f"Signals Detected: {signals}\n"
        if ta_data:
            trend = ta_data.get('trend', 'Neutral')
            explanations = ta_data.get('explanations', [])
            prompt += f"Technical Analysis: Trend is {trend}. {explanations}\n"
            
        prompt += "\nExplain this stock's current situation simply for a retail Indian investor. In one sentence, give a reasonable suggestion (Buy/Hold/Sell is okay but mention it's not financial advice)."
        
        if self.api_key:
            try:
                response = openai.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful stock market expert giving simple explanations to a retail investor."},
                        {"role": "user", "content": prompt}
                    ]
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"ExplanationAgent Error: {e}")
                return self._fallback_explanation(ticker, signals, ta_data)
        else:
            return self._fallback_explanation(ticker, signals, ta_data)
            
    def _fallback_explanation(self, ticker: str, signals: List[dict], ta_data: dict) -> str:
        """Provide a template-based explanation when OpenAI API is unavailable/fails."""
        insight = f"For {ticker}: "
        bullish_count = 0
        bearish_count = 0
        
        for sig in signals:
            impact = sig.get("impact", "Neutral")
            if impact == "Bullish": bullish_count += 1
            if impact == "Bearish": bearish_count += 1
            
        if ta_data.get("trend") == "Bullish": bullish_count += 1
        else: bearish_count += 1
        
        if bullish_count > bearish_count:
            insight += "The stock is showing strong bullish momentum based on recent volume and price action. A potential short-term holding opportunity. (Not financial advice)"
        elif bearish_count > bullish_count:
            insight += "The stock is showing signs of weakness and bearish pressure. Proceed with caution. (Not financial advice)"
        else:
            insight += "The stock is currently consolidating with mixed signals. Might be wise to hold and watch. (Not financial advice)"
            
        return insight
