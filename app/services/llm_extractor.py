import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from app.models.domain import ExtractedQuery

load_dotenv()

# Initialize the modern client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def extract_semantic_intent(user_query: str) -> ExtractedQuery:
    """
    Takes raw natural language and extracts strict JSON mapped to the ExtractedQuery schema.
    """
    
    # Using the exact model listed on your resume!
    active_model = 'gemini-3.1-flash-lite' 
    
    response = client.models.generate_content(
        model=active_model,
        contents=user_query,
        config=types.GenerateContentConfig(
            system_instruction=(
                "You are a Semantic Extraction Engine for an enterprise NL2SQL system. "
                "Your ONLY job is to extract business metrics, dimensions, and filters from the user's text. "
                "DO NOT write SQL. DO NOT invent database column names. "
                "Translate the user's request into strict, structural parameters."
            ),
            response_mime_type="application/json",
            response_schema=ExtractedQuery,
            temperature=0.0 # Force deterministic output
        ),
    )

    # Validate and parse the returned JSON string into our Python object
    raw_json = response.text
    return ExtractedQuery.model_validate_json(raw_json)