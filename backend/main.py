"""
AI Interview Coach - FastAPI Backend
Main application entry point with SPA static hosting & universal CORS
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import uvicorn

# Load environment variables from .env file in backend directory or root
backend_env = Path(__file__).parent / ".env"
root_env = Path(__file__).parent.parent / ".env"

if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
elif root_env.exists():
    load_dotenv(dotenv_path=root_env)

# Verify API key is loaded
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("INFO: GEMINI_API_KEY not found in environment. Heuristic AI coach active.")
else:
    print("Gemini API key loaded successfully.")

from routes import interview

app = FastAPI(
    title="AI Interview Coach API",
    description="Backend API and web server for AI-powered interview practice",
    version="1.0.0"
)

# Universal CORS middleware to support local development and any cloud deployment domain
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include backend API routers
app.include_router(interview.router, prefix="/api", tags=["interview"])

@app.get("/api/health")
async def health_check():
    """Health check endpoint for cloud monitoring"""
    return {
        "status": "healthy",
        "gemini_active": bool(os.getenv("GEMINI_API_KEY")),
        "service": "AI Interview Coach"
    }

# Check for production frontend build (SPA)
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    print(f"Mounting production frontend build from: {frontend_dist}")
    
    # Mount assets directory
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve SPA routes with fallback to index.html
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = frontend_dist / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    async def root():
        """Fallback root when frontend is run separately in Vite dev mode"""
        return {
            "message": "AI Interview Coach Backend API is running!",
            "docs": "/docs",
            "health": "/api/health"
        }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting AI Interview Coach server on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=False)
