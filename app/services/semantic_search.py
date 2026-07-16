import asyncio
from sqlalchemy import select
from app.models.schema import Metric, Dimension, BusinessGlossary
from app.models.domain import ExtractedQuery
from app.core.database import AsyncSessionLocal

# Note: In a full production environment, these functions would use pgvector cosine 
# similarity (<=>). For our local MVP to ensure stability, we are using fast ILIKE 
# keyword matching (which is standard practice before falling back to vector search).

async def fetch_metric(metric_name: str):
    """Searches the metrics table using its own dedicated DB connection."""
    async with AsyncSessionLocal() as session:
        normalized_name = metric_name.replace(" ", "_").lower()
        stmt = select(Metric).where(Metric.canonical_name.ilike(f"%{normalized_name}%"))
        result = await session.execute(stmt)
        return result.scalars().first()

async def fetch_dimension(dim_name: str):
    """Searches the dimensions table using its own dedicated DB connection."""
    async with AsyncSessionLocal() as session:
        normalized_name = dim_name.replace(" ", "_").lower()
        stmt = select(Dimension).where(Dimension.canonical_name.ilike(f"%{normalized_name}%"))
        result = await session.execute(stmt)
        return result.scalars().first()

async def fetch_glossary(term: str):
    """Searches the glossary table using its own dedicated DB connection."""
    async with AsyncSessionLocal() as session:
        stmt = select(BusinessGlossary).where(BusinessGlossary.term.ilike(f"%{term}%"))
        result = await session.execute(stmt)
        return result.scalars().first()

async def parallel_retrieve(extracted_plan: ExtractedQuery):
    """
    Takes the JSON plan from the LLM and concurrently fetches all required 
    metadata from PostgreSQL in a single async sweep.
    """
    tasks = []
    
    # 1. Queue Metric searches
    for m in extracted_plan.metrics:
        tasks.append(fetch_metric(m))
        
    # 2. Queue Dimension searches
    for d in extracted_plan.dimensions:
        tasks.append(fetch_dimension(d))
        
    # 3. Queue Glossary search if a time range or modifier exists
    if extracted_plan.time_range:
        tasks.append(fetch_glossary(extracted_plan.time_range))
        
    # ⚡ EXECUTE ALL DATABASE QUERIES CONCURRENTLY ⚡
    # Because each function creates its own session, they can safely run in parallel
    results = await asyncio.gather(*tasks)
    
    # Filter out None values (where a term wasn't found in the DB)
    retrieved_objects = [res for res in results if res is not None]
    return retrieved_objects