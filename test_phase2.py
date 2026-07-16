from app.services.llm_extractor import extract_semantic_intent

if __name__ == "__main__":
    test_queries = [
        "Show me the monthly revenue from new customers in the south region excluding refunds.",
        "What was our net revenue during the festive season?"
    ]

    for query in test_queries:
        print(f"\n💬 User Query: '{query}'")
        try:
            extracted_data = extract_semantic_intent(query)
            print("⚙️ Extracted JSON Plan:")
            # Print the parsed Pydantic object as a beautifully indented JSON string
            print(extracted_data.model_dump_json(indent=2))
        except Exception as e:
            print(f"❌ Error during extraction: {e}")