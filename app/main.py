from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import chat, auth, metadata # <--- ADD METADATA IMPORT

# Initialize the FastAPI application
app = FastAPI(
    title="VeraBase NL2SQL API",
    description="Enterprise Semantic Layer and Deterministic SQL Generator",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register our routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["Query Generation"])
app.include_router(metadata.router, prefix="/api/metadata", tags=["Metadata Management"]) # <--- ADD METADATA ROUTE

@app.get("/")
async def health_check():
    return {"status": "online", "system": "VeraBase Engine"}