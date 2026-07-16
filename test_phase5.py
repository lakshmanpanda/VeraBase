import asyncio
from app.services.llm_extractor import extract_semantic_intent
from app.services.semantic_search import parallel_retrieve
from app.services.resolver_engine import generate_validated_plan
from app.services.sql_builder import build_sql

async def main():
    query = "Show me net revenue by region during the festive season"
    
    print(f"👤 USER: '{query}'\n")
    
    # Run the pipeline
    extracted_plan = extract_semantic_intent(query)
    retrieved_context = await parallel_retrieve(extracted_plan)
    final_plan = await generate_validated_plan(retrieved_context)
    
    print("✨ GENERATING DETERMINISTIC SQL...\n")
    
    final_sql = build_sql(final_plan)
    
    # Print the final result in green
    print("\033[92m" + final_sql + "\033[0m")

if __name__ == "__main__":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())