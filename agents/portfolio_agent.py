from typing import Dict, Any, List

class PortfolioAgent:
    """Agent responsible for analyzing the user's manually input portfolio."""
    
    def analyze_portfolio(self, holdings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze sector concentration and risk level."""
        if not holdings:
            return {
                "total_value": 0,
                "insights": ["Portfolio is empty."],
                "risk_level": "None"
            }
            
        sector_counts = {}
        total_value = 0.0
        
        for item in holdings:
            sector = item.get("sector", "Unknown")
            value = float(item.get("shares", 0)) * float(item.get("price", 0))
            total_value += value
            
            if sector not in sector_counts:
                sector_counts[sector] = 0
            sector_counts[sector] += value
            
        # Sector Concentration Insight
        insights = []
        highest_sector = ""
        highest_percent = 0
        
        for sector, value in sector_counts.items():
            percent = (value / total_value) * 100 if total_value > 0 else 0
            if percent > highest_percent:
                highest_percent = percent
                highest_sector = sector
                
        if highest_percent > 50:
            insights.append(f"High exposure to {highest_sector} sector ({highest_percent:.1f}%)")
            risk_level = "High"
        elif highest_percent > 30:
            insights.append(f"Moderate exposure to {highest_sector} sector ({highest_percent:.1f}%)")
            risk_level = "Medium"
        else:
            insights.append("Portfolio is well-diversified across sectors.")
            risk_level = "Low"
            
        if len(sector_counts) < 3:
            insights.append("Low diversification: Consider adding more sectors to spread risk.")
            
        return {
            "total_value": total_value,
            "sector_allocation": {s: (v/total_value * 100) for s, v in sector_counts.items()},
            "insights": insights,
            "risk_level": risk_level
        }
