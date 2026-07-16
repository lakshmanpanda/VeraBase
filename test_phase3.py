import asyncio
from app.services.llm_extractor import extract_semantic_intent
from app.services.semantic_search import parallel_retrieve

async def main():
    # 1. The user's raw question
    query = "What was our net revenue during the festive season?"
    print(f"💬 User Query: '{query}'\n")

    # 2. Phase 2: LLM intent extraction (Fast & Deterministic)
    print("🧠 Step 1: Extracting intent via Gemini...")
    extracted_plan = extract_semantic_intent(query)
    print(f"✅ Intent extracted: Metrics={extracted_plan.metrics}, Time Range='{extracted_plan.time_range}'\n")

    # 3. Phase 3: Parallel Database Retrieval
    print("⚡ Step 2: Concurrently searching PostgreSQL Metadata tables...")
    retrieved_context = await parallel_retrieve(extracted_plan)
    
    print("✅ Retrieved Database Objects:")
    for obj in retrieved_context:
        # Check which SQLAlchemy model we retrieved and print its data
        if obj.__tablename__ == 'metrics':
            print(f"   📊 METRIC -> Name: {obj.canonical_name} | SQL: {obj.sql_template}")
        elif obj.__tablename__ == 'business_glossary':
            print(f"   📖 GLOSSARY -> Term: '{obj.term}' | Definition: '{obj.definition}'")

if __name__ == "__main__":
    # Suppress Windows ProactorEventLoop warnings for clean output
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())