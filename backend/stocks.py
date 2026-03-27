import yfinance as yf
from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional

class StockResponse(BaseModel):
    symbol: str
    price: float
    company_name: Optional[str] = None

def get_real_time_stock(symbol: str) -> StockResponse:
    symbol = symbol.replace(" ", "").upper()
    if not symbol.endswith(".NS") and not symbol.endswith(".BO"):
        symbol += ".NS"
        
    try:
        stock = yf.Ticker(symbol)
        # Fast extraction using basic info or history
        hist = stock.history(period="1d")
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"Invalid symbol or no data for {symbol}")
            
        current_price = hist['Close'].iloc[-1]
        
        info = stock.info
        company_name = info.get("shortName", symbol)
        
        return StockResponse(
            symbol=symbol,
            price=current_price,
            company_name=company_name
        )
    except Exception as e:
        # Avoid crashing entirely on unexpected yfinance parsing errors
        raise HTTPException(status_code=500, detail=str(e))
