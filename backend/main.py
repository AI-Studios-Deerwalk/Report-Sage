from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
import asyncio
import re
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from utils.pdf_reader import extract_text_with_pages, PDFReader
from utils.ollama_client import ask_ollama_fast, OllamaClient
from prompt import prompt_manager, result_formatter
from database import init_database, check_database_health
from routes import api_router

# Load environment variables
load_dotenv()

# Configuration from environment variables
ANALYSIS_TIMEOUT_SECONDS = int(os.getenv("ANALYSIS_TIMEOUT_SECONDS", 60))
TEMPERATURE = float(os.getenv("TEMPERATURE", 0.1))
# No worker limits - process everything simultaneously
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
# Ensure localhost origins are always included
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001"
]
# Merge environment origins with defaults, removing duplicates
CORS_ORIGINS = list(set(CORS_ORIGINS + DEFAULT_CORS_ORIGINS))
TEMP_DIR = os.getenv("TEMP_DIR", "temp")

app = FastAPI()

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s")

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        # Initialize the database manager and ensure connection
        from database.connection import db_manager
        db_manager.initialize()
        
        # Test the database connection
        await db_manager.check_connection()
        
        logging.info("Database connection initialized and tested successfully")
        logging.info("Note: Use 'alembic upgrade head' to apply database migrations")
    except Exception as e:
        logging.error(f"Failed to initialize database: {e}")
        logging.warning("Server will continue without database connection - some features may not work")
        # Continue without database for now
        # Don't let database errors crash the server

# Comment out database initialization temporarily to test server startup
# @app.on_event("startup")
# async def startup_event():
#     """Initialize database on startup"""
#     try:
#         # Just initialize the database manager, tables should be created via migrations
#         from database.connection import db_manager
#         db_manager.initialize()
#         logging.info("Database connection initialized successfully")
#         logging.info("Note: Use 'alembic upgrade head' to apply database migrations")
#     except Exception as e:
#         logging.error(f"Failed to initialize database: {e}")
#         logging.warning("Server will continue without database connection - some features may not work")
#         # Continue without database for now
#         # Don't let database errors crash the server

# Add CORS middleware BEFORE including routes
logging.info(f"Configuring CORS with origins: {CORS_ORIGINS}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # Allow frontend origins from env
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # Allow all methods including OPTIONS
    allow_headers=["*"],  # Allow all headers including Authorization, Content-Type, etc.
    expose_headers=["*"],  # Expose all headers
    max_age=86400,  # Cache preflight response for 24 hours
    allow_origin_regex=None,  # No regex patterns
)

# Global CORS handler for any requests not caught by middleware
@app.middleware("http")
async def cors_handler(request, call_next):
    """Global CORS handler to ensure all responses have proper CORS headers"""
    response = await call_next(request)
    
    # Add CORS headers if they're not already present
    if "Access-Control-Allow-Origin" not in response.headers:
        origin = request.headers.get("origin")
        if origin in CORS_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response

# Add a simple test endpoint to verify CORS is working
@app.get("/test-cors")
async def test_cors():
    """Test endpoint to verify CORS is working"""
    return {"message": "CORS is working!", "timestamp": datetime.now().isoformat()}

# Add middleware to log all requests for debugging
@app.middleware("http")
async def log_requests(request, call_next):
    """Log all incoming requests for debugging"""
    logging.info(f"Request: {request.method} {request.url}")
    logging.info(f"Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    logging.info(f"Response: {response.status_code}")
    return response

# Include API routes (includes auth and user routes)
app.include_router(api_router)

# Include document rules routes
from routes.document_rules import router as document_rules_router
app.include_router(document_rules_router)

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Dynamic executor - creates workers based on document size


class ErrorCategorizer:
    """Simple error categorizer for TU format violations"""
    
    @staticmethod
    def categorize_all_errors(errors_with_pages):
        """Categorize errors into structure, grammar, and enhancement phases"""
        categorized = {
            "structure": [],
            "grammar": [],
            "enhancement": []
        }
        
        # Get keywords from centralized prompt manager
        structure_keywords = prompt_manager.get_structure_keywords()
        grammar_keywords = prompt_manager.get_grammar_keywords()
        
        for error in errors_with_pages:
            text_lower = error['text'].lower()
            
            # Categorize based on keywords from prompt manager
            if any(word in text_lower for word in structure_keywords):
                categorized["structure"].append(error)
            elif any(word in text_lower for word in grammar_keywords):
                categorized["grammar"].append(error)
            else:
                categorized["enhancement"].append(error)
        
        return categorized
    
    @staticmethod
    def get_phase_summary(categorized_errors):
        """Get summary of errors by phase"""
        return {
            "phase_1_structure": len(categorized_errors["structure"]),
            "phase_2_grammar": len(categorized_errors["grammar"]),
            "phase_3_enhancement": len(categorized_errors["enhancement"])
        }

@app.get("/")
async def root():
    return {
        "message": "DWIT Academia API - TU Report Analyzer with Authentication",
        "version": "1.0.0",
        "docs": "/docs",
        "api_endpoints": {
            "authentication": "/api/v1/auth",
            "users": "/api/v1/users", 
            "archive": "/api/v1/archive",
            "analysis": "/analyze",
            "batch_analysis": "/analyze-batch"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint to verify server and database status"""
    try:
        from database.connection import db_manager
        
        # Check if database is initialized and responsive
        if not db_manager._initialized:
            return {"status": "initializing", "database": "not ready"}
        
        # Test database connection
        db_healthy = await db_manager.check_connection()
        
        return {
            "status": "healthy" if db_healthy else "degraded",
            "database": "connected" if db_healthy else "disconnected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Single page analysis function removed - now handled through archive upload system

@app.post("/analyze-abstract")
async def analyze_abstract(file: UploadFile = File(...)):
    try:
        if not file.filename:
            return {"error": "No file provided"}
        
        file_path = f"{TEMP_DIR}/{file.filename}"
        os.makedirs(TEMP_DIR, exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
        logging.info(f"Received file '{file.filename}' for abstract analysis")

        # Extract text from PDF
        pdf_reader = PDFReader()
        content = pdf_reader.extract_text(file_path)
        
        if not content.strip():
            return {"error": "Could not extract text from PDF"}
        
        # Extract abstract from PDF content
        abstract = prompt_manager.extract_abstract_from_pdf_content(content)
        
        if not abstract.strip():
            return {"error": "Could not extract abstract from PDF"}
        
        # Analyze abstract with Ollama
        ollama_client = OllamaClient()
        analysis_prompt = prompt_manager.get_abstract_analysis_prompt(abstract)
        analysis_result = await ollama_client.analyze_document(analysis_prompt)
        
        # Parse analysis results
        formatter = ResultFormatter()
        parsed_results = formatter.parse_abstract_analysis_result(analysis_result)
        summary = formatter.create_abstract_analysis_summary(parsed_results)
        
        return {
                        "success": True,
            "abstract": abstract,
            "analysis_results": parsed_results,
            "summary": summary
        }
        
    except Exception as e:
        logging.exception("Abstract analysis failed")
        return {"error": f"Abstract analysis failed: {str(e)}"}

# Abstract analysis endpoint removed - now handled through archive upload system

if __name__ == "__main__":
    import uvicorn
    
    # Fast reload configuration - optimized for speed
    reload_enabled = os.getenv("RELOAD", "true").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=reload_enabled,
        # OPTIMIZED RELOAD SETTINGS FOR SPEED:
        reload_dirs=["backend"] if reload_enabled else None,  # Only watch backend directory
        reload_delay=0.25,  # Faster reload detection (default is 1.0)
        log_level=os.getenv("LOG_LEVEL", "info")
    )
