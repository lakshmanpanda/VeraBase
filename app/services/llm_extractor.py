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
    Also determines the most appropriate chart visualization type.
    """
    
    # gemini-3.1-flash-lite: 15 RPM / 500 RPD on free tier — confirmed available
    active_model = 'gemini-3.1-flash-lite'
    
    response = client.models.generate_content(
        model=active_model,
        contents=user_query,
        config=types.GenerateContentConfig(
            system_instruction=(
                "You are a Semantic Extraction Engine for an enterprise NL2SQL system. "
                "Your ONLY job is to extract business metrics, dimensions, and filters from the user's text. "
                "DO NOT write SQL. DO NOT invent database column names. "
                "Translate the user's request into strict, structural parameters.\n\n"
                "CHART TYPE SELECTION RULES (mandatory):\n"
                "- 'kpi': Single aggregate with NO group-by dimension (e.g., 'total revenue', 'how many orders')\n"
                "- 'line': Any question involving time trends, monthly/yearly breakdowns, or 'over time'\n"
                "- 'pie': Percentage share, distribution, or proportion across a small set of categories (< 8)\n"
                "- 'bar': Comparison across named categories like region, platform, segment (not time)\n"
                "- 'table': Multi-metric queries, detailed breakdowns with many rows, or 'show me all' questions\n"
            ),
            response_mime_type="application/json",
            response_schema=ExtractedQuery,
            temperature=0.0  # Force deterministic output
        ),
    )

    # Validate and parse the returned JSON string into our Python object
    raw_json = response.text
    return ExtractedQuery.model_validate_json(raw_json)