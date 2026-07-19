import os
import jwt
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Any
from app.services.llm_extractor import extract_semantic_intent
from app.services.semantic_search import parallel_retrieve
from app.services.resolver_engine import generate_validated_plan
from app.services.sql_builder import build_sql
from app.services.executor import execute_sql_on_warehouse

router = APIRouter()
security = HTTPBearer()
SECRET_KEY = os.getenv("JWT_SECRET", "verabase-enterprise-secret-2025")

# Security Dependency: Extracts and verifies the JWT token
def get_current_tenant(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload  # Returns the dictionary containing company_id, role, etc.
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# The frontend only sends the natural language query — company_id is pulled from the verified JWT
class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    sql_query: str
    execution_plan: dict[str, Any]
    data: list[dict]
    recommended_chart_type: str  # "kpi" | "bar" | "line" | "pie" | "table"

# We inject the tenant dependency here
@router.post("/generate", response_model=ChatResponse)
async def generate_sql(request: ChatRequest, tenant: dict = Depends(get_current_tenant)):
    try:
        # 1. LLM: Extract semantic intent + recommended chart type
        extracted_plan = extract_semantic_intent(request.query)
        chart_type = extracted_plan.recommended_chart_type
        
        # 2. Vector search: Retrieve matching metrics/dimensions from PostgreSQL
        retrieved_context = await parallel_retrieve(extracted_plan)
        
        # 3. BFS Resolver: Build validated join plan
        #    Pass requested_dimensions so time keywords (month/year) get injected
        final_plan = await generate_validated_plan(
            retrieved_context,
            requested_dimensions=extracted_plan.dimensions
        )
        
        # 4. SQL Builder: Inject tenant security and assemble query
        verified_company_id = tenant.get("company_id")
        final_sql = build_sql(final_plan, verified_company_id)
        
        # 5. Executor: Run against SQLite data warehouse
        executable_sql = "\n".join([line for line in final_sql.split("\n") if not line.startswith("--")])
        query_results = execute_sql_on_warehouse(executable_sql)
        
        return ChatResponse(
            sql_query=final_sql, 
            execution_plan=final_plan,
            data=query_results,
            recommended_chart_type=chart_type
        )
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")