import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import select, delete
from google import genai
from google.genai import types

from app.core.database import AsyncSessionLocal
from app.models.schema import Metric, Dimension
from app.api.routes.chat import get_current_tenant  # Reusing secure JWT interceptor

router = APIRouter()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class MetricCreate(BaseModel):
    canonical_name: str
    description: str
    grain: str
    base_table: str
    sql_template: str
    dependencies: List[str] = []

class MetricResponse(BaseModel):
    id: str
    canonical_name: str
    description: str
    grain: str
    base_table: str
    sql_template: str
    dependencies: List[str]
    is_active: bool

class DimensionCreate(BaseModel):
    canonical_name: str
    description: str
    column_name: str
    grain: str
    base_table: str
    data_type: str

class DimensionResponse(BaseModel):
    id: str
    canonical_name: str
    column_name: str
    grain: str
    base_table: str
    data_type: str
    is_active: bool

# ── Security Middleware ───────────────────────────────────────────────────────

def require_admin(tenant: dict = Depends(get_current_tenant)):
    if tenant.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    return tenant

# ── Embedding Helper ──────────────────────────────────────────────────────────

async def generate_embedding(text_input: str) -> list[float]:
    response = client.models.embed_content(
        model="models/gemini-embedding-001",
        contents=text_input,
        config=types.EmbedContentConfig(output_dimensionality=768)
    )
    return response.embeddings[0].values


# ── METRIC ROUTES ─────────────────────────────────────────────────────────────

@router.get("/metrics", response_model=List[MetricResponse])
async def get_all_metrics(admin: dict = Depends(require_admin)):
    """READ: Fetch all metrics to populate the Semantic Brain grid."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Metric).order_by(Metric.canonical_name))
        metrics = result.scalars().all()
        return [
            {
                "id": str(m.id),
                "canonical_name": m.canonical_name,
                "description": m.description,
                "grain": m.grain,
                "base_table": m.base_table,
                "sql_template": m.sql_template,
                "dependencies": m.dependencies,
                "is_active": m.is_active
            } for m in metrics
        ]

@router.post("/metrics")
async def create_metric(payload: MetricCreate, admin: dict = Depends(require_admin)):
    """CREATE: Vectorize and inject a new semantic metric definition."""
    async with AsyncSessionLocal() as session:
        try:
            combined_text = f"{payload.canonical_name}: {payload.description}"
            vector = await generate_embedding(combined_text)
            
            new_metric = Metric(
                canonical_name=payload.canonical_name,
                description=payload.description,
                grain=payload.grain,
                base_table=payload.base_table,
                sql_template=payload.sql_template,
                dependencies=payload.dependencies,
                embedding=vector
            )
            session.add(new_metric)
            await session.commit()
            return {"status": "success", "message": f"Metric '{payload.canonical_name}' injected."}
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=500, detail=f"Injection Error: {str(e)}")

@router.delete("/metrics/{metric_id}")
async def delete_metric(metric_id: str, admin: dict = Depends(require_admin)):
    """DELETE: Remove a metric from the Semantic Brain."""
    async with AsyncSessionLocal() as session:
        try:
            stmt = delete(Metric).where(Metric.id == metric_id)
            result = await session.execute(stmt)
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Metric not found.")
            await session.commit()
            return {"status": "success", "message": "Metric deleted."}
        except HTTPException:
            raise
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=500, detail=str(e))


# ── DIMENSION ROUTES ──────────────────────────────────────────────────────────

@router.get("/dimensions", response_model=List[DimensionResponse])
async def get_all_dimensions(admin: dict = Depends(require_admin)):
    """READ: Fetch all dimensions."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Dimension).order_by(Dimension.canonical_name))
        dims = result.scalars().all()
        return [
            {
                "id": str(d.id),
                "canonical_name": d.canonical_name,
                "column_name": d.column_name,
                "grain": d.grain,
                "base_table": d.base_table,
                "data_type": d.data_type,
                "is_active": d.is_active
            } for d in dims
        ]

@router.post("/dimensions")
async def create_dimension(payload: DimensionCreate, admin: dict = Depends(require_admin)):
    """CREATE: Vectorize and inject a new semantic dimension definition."""
    async with AsyncSessionLocal() as session:
        try:
            combined_text = f"{payload.canonical_name}: {payload.description}"
            vector = await generate_embedding(combined_text)
            
            new_dim = Dimension(
                canonical_name=payload.canonical_name,
                column_name=payload.column_name,
                grain=payload.grain,
                base_table=payload.base_table,
                data_type=payload.data_type,
                embedding=vector
            )
            session.add(new_dim)
            await session.commit()
            return {"status": "success", "message": f"Dimension '{payload.canonical_name}' injected."}
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=500, detail=f"Injection Error: {str(e)}")

@router.delete("/dimensions/{dim_id}")
async def delete_dimension(dim_id: str, admin: dict = Depends(require_admin)):
    """DELETE: Remove a dimension from the Semantic Brain."""
    async with AsyncSessionLocal() as session:
        try:
            stmt = delete(Dimension).where(Dimension.id == dim_id)
            result = await session.execute(stmt)
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Dimension not found.")
            await session.commit()
            return {"status": "success", "message": "Dimension deleted."}
        except HTTPException:
            raise
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=500, detail=str(e))


# ── WAREHOUSE SCHEMA ROUTE ────────────────────────────────────────────────────

@router.get("/warehouse/tables")
async def get_warehouse_schema(admin: dict = Depends(require_admin)):
    """READ: Fetch raw multi-tenant warehouse tables (SQLite) for the Data Dictionary."""
    import sqlite3

    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.abspath(os.path.join(current_dir, "../../.."))
        db_path = os.path.join(root_dir, "data_warehouse.db")

        if not os.path.exists(db_path):
            raise HTTPException(status_code=404, detail=f"Database not found at: {db_path}")

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall() if row[0] != 'sqlite_sequence']

        result = []
        for table in tables:
            cursor.execute(f"PRAGMA table_info({table});")
            columns = cursor.fetchall()
            cols = [{"name": col[1], "type": col[2]} for col in columns]
            result.append({"table_name": table, "columns": cols})

        conn.close()
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to inspect warehouse: {str(e)}")