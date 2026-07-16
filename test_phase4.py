import asyncio
from app.services.llm_extractor import extract_semantic_intent
from app.services.semantic_search import parallel_retrieve
from app.services.resolver_engine import generate_validated_plan

async def main():
    # Notice we are asking for BOTH a metric and a dimension now to trigger the Join Planner
    query = "Show me net revenue by region during the festive season"
    
    print("🧠 1. LLM Extraction...")
    extracted_plan = extract_semantic_intent(query)
    
    print("⚡ 2. Parallel Semantic Retrieval...")
    retrieved_context = await parallel_retrieve(extracted_plan)
    
    print("🗺️ 3. Join Planner & Resolver Engine (BFS Graph Traversal)...")
    final_plan = await generate_validated_plan(retrieved_context)
    
    print("\n✅ FINAL VALIDATED QUERY PLAN:")
    import json
    print(json.dumps(final_plan, indent=2))

if __name__ == "__main__":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())