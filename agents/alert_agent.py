import random
from typing import List, Dict, Any

class AlertAgent:
    """Agent responsible for triggering simulated alerts based on market state."""
    
    def generate_alerts(self) -> List[Dict[str, Any]]:
        """Simulate real-time alerts based on random sample or detected conditions."""
        possible_alerts = [
            {"type": "Breakout", "message": "🚨 Breakout detected in TCS: Crossing 20-day high", "severity": "high"},
            {"type": "Weakness", "message": "⚠️ Weak trend in RELIANCE: Broken support", "severity": "medium"},
            {"type": "Volume Surge", "message": "📈 Huge volume spike in INFY", "severity": "high"},
            {"type": "Reversal", "message": "🔄 Potential reversal pattern forming in HDFC Bank", "severity": "low"}
        ]
        
        # Randomly select 1 to 3 alerts for the dashboard demo
        num_alerts = random.randint(1, 3)
        return random.sample(possible_alerts, num_alerts)
