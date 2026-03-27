from pydantic import BaseModel
from fastapi import HTTPException

class LoginRequest(BaseModel):
    email: str
    password: str

def authenticate_user(req: LoginRequest):
    # Dummy user authentication
    if req.email == "demo@example.com" and req.password == "password":
        return {"success": True, "user": {"email": req.email, "name": "Demo Investor"}}
    
    raise HTTPException(status_code=401, detail="Invalid credentials. Use demo@example.com / password")
