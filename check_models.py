import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("🔍 Querying your API Key for available models...")

# Simply loop through and print the names of the fast Gemini models
for model in client.models.list():
    if "gemini" in model.name and "flash" in model.name:
        print(f"✅ Available: {model.name}")