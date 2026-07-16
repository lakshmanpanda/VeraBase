from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
from app.services.llm_extractor import extract_semantic_intent
from app.services.semantic_search import parallel_retrieve
from app.services.resolver_engine import generate_validated_plan
from app.services.sql_builder import build_sql
from app.services.executor import execute_sql_on_warehouse

router = APIRouter()

# We update our response model to include the final 'data' array
class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    sql_query: str
    execution_plan: dict[str, Any]
    data: list[dict]

@router.post("/generate", response_model=ChatResponse)
async def generate_sql(request: ChatRequest):
    try:
        # 1. LLM Extraction
        extracted_plan = extract_semantic_intent(request.query)
        
        # 2. Parallel Database Retrieval (Metadata)
        retrieved_context = await parallel_retrieve(extracted_plan)
        
        # 3. Resolution and Join Planning
        final_plan = await generate_validated_plan(retrieved_context)
        
        # 4. Deterministic SQL Construction
        final_sql = build_sql(final_plan)
        
        # 5. EXECUTION: Run the generated SQL against the Data Warehouse
        # We strip out the "-- CONTEXT APPLIED" comments before executing, as some DBs reject them
        executable_sql = "\n".join([line for line in final_sql.split("\n") if not line.startswith("--")])
        query_results = execute_sql_on_warehouse(executable_sql)
        
        return ChatResponse(
            sql_query=final_sql, 
            execution_plan=final_plan,
            data=query_results
        )
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")