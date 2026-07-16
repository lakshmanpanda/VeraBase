import os
import asyncio
from google import genai
from google.genai import types
from sqlalchemy import select, text
from app.models.schema import Metric, Dimension, BusinessGlossary
from app.models.domain import ExtractedQuery
from app.core.database import AsyncSessionLocal

# Initialize the modern Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

async def get_embedding(text_input: str) -> list[float]:
    """Converts a natural language string into a 768-dimensional vector."""
    response = client.models.embed_content(
        model="models/gemini-embedding-001",
        contents=text_input,
        config=types.EmbedContentConfig(
            output_dimensionality=768 # Forces 768 dimensions to match our database
        )
    )
    return response.embeddings[0].values

async def fetch_metric(metric_name: str):
    """Searches the metrics table using pgvector cosine similarity."""
    async with AsyncSessionLocal() as session:
        try:
            vector = await get_embedding(metric_name)
            # Use pgvector's <-> operator to find the closest semantic match
            stmt = select(Metric).order_by(text("embedding <-> :vector")).limit(1)
            result = await session.execute(stmt, {"vector": str(vector)})
            return result.scalars().first()
        except Exception as e:
            print(f"Error fetching metric {metric_name}: {e}")
            return None

async def fetch_dimension(dim_name: str):
    """Searches the dimensions table using pgvector cosine similarity."""
    async with AsyncSessionLocal() as session:
        try:
            vector = await get_embedding(dim_name)
            stmt = select(Dimension).order_by(text("embedding <-> :vector")).limit(1)
            result = await session.execute(stmt, {"vector": str(vector)})
            return result.scalars().first()
        except Exception as e:
            print(f"Error fetching dimension {dim_name}: {e}")
            return None

async def fetch_glossary(term: str):
    """Searches the glossary table using pgvector cosine similarity."""
    async with AsyncSessionLocal() as session:
        try:
            vector = await get_embedding(term)
            stmt = select(BusinessGlossary).order_by(text("embedding <-> :vector")).limit(1)
            result = await session.execute(stmt, {"vector": str(vector)})
            return result.scalars().first()
        except Exception as e:
            print(f"Error fetching glossary {term}: {e}")
            return None

async def parallel_retrieve(extracted_plan: ExtractedQuery):
    """
    Takes the JSON plan from the LLM and concurrently fetches all required 
    metadata from PostgreSQL in a single async sweep using Vector Search.
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
        
    # ⚡ EXECUTE ALL VECTOR QUERIES CONCURRENTLY ⚡
    results = await asyncio.gather(*tasks)
    
    # Filter out None values
    retrieved_objects = [res for res in results if res is not None]
    return retrieved_objects