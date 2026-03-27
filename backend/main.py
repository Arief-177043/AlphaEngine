from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

import sys
import os

# Add the parent directory to sys.path so 'agents' can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.data_agent import DataAgent
from agents.signal_agent import SignalAgent
from agents.technical_agent import TechnicalAnalysisAgent
from agents.portfolio_agent import PortfolioAgent
from agents.explanation_agent import ExplanationAgent
from agents.alert_agent import AlertAgent

import auth
import stocks

app = FastAPI(title="AI Opportunity Radar API")

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate Agents
data_agent = DataAgent(use_mock=False) # Will fallback to mock if yfinance fails
signal_agent = SignalAgent()
ta_agent = TechnicalAnalysisAgent()
portfolio_agent = PortfolioAgent()
explanation_agent = ExplanationAgent()
alert_agent = AlertAgent()

class PortfolioItem(BaseModel):
    ticker: str
    shares: float
    price: float
    sector: Optional[str] = "Unknown"

@app.get("/scan")
async def scan_market(ticker: str):
    """Scan a specific stock and return real-time signals and AI insights."""
    # 1. Fetch Data
    df = data_agent.fetch_data(ticker, period="3mo")
    info = data_agent.fetch_info(ticker)
    
    # 2. Extract Signals
    signals = signal_agent.detect_signals(df, ticker)
    
    # 3. Technical Analysis
    ta_data = ta_agent.analyze(df)
    
    # 4. Generate AI Explanation
    insight = explanation_agent.generate_insight(ticker, signals, ta_data)
    
    return {
        "ticker": ticker,
        "company_name": info.get("shortName", ticker),
        "current_price": ta_data.get("current_price", info.get("currentPrice", 0)),
        "signals": signals,
        "technical_analysis": ta_data,
        "ai_insight": insight
    }

@app.post("/portfolio")
async def analyze_portfolio(holdings: List[PortfolioItem]):
    """Analyze the user's current manual portfolio."""
    data = [h.model_dump() for h in holdings]
    analysis = portfolio_agent.analyze_portfolio(data)
    return analysis

@app.get("/alerts")
async def get_alerts():
    """Simulate real-time alerts."""
    alerts = alert_agent.generate_alerts()
    return {"alerts": alerts}

@app.post("/login")
async def login(req: auth.LoginRequest):
    return auth.authenticate_user(req)

@app.get("/stock/{symbol}")
async def get_stock_price(symbol: str):
    return stocks.get_real_time_stock(symbol)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
