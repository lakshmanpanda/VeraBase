from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import chat

# Initialize the FastAPI application
app = FastAPI(
    title="VeraBase NL2SQL API",
    description="Enterprise Semantic Layer and Deterministic SQL Generator",
    version="1.0.0"
)

# Configure CORS so our future React/Next.js frontend can talk to this backend safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register our routes
app.include_router(chat.router, prefix="/api/chat", tags=["Query Generation"])

@app.get("/")
async def health_check():
    return {"status": "online", "system": "VeraBase Engine"}