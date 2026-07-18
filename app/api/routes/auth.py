import os
import sqlite3
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Resolve absolute path to the warehouse DB
_ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
_DB_PATH = os.path.join(_ROOT_DIR, "data_warehouse.db")

# In production, this would be a highly secure string in your .env file
SECRET_KEY = os.getenv("JWT_SECRET", "verabase-enterprise-secret-2025")
ALGORITHM = "HS256"

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(request: LoginRequest):
    # 1. Connect to the Multi-Tenant Warehouse (absolute path)
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 2. Check credentials
    cursor.execute(
        "SELECT id, company_id, name, role FROM employees WHERE email = ? AND password = ?", 
        (request.email, request.password)
    )
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # 3. Generate the Secure JWT Token
    payload = {
        "sub": request.email,
        "company_id": user["company_id"],
        "role": user["role"],
        "name": user["name"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    # Return the token and basic user info to the frontend
    return {"access_token": token, "token_type": "bearer", "user": dict(user)}