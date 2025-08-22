from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import asyncio
import re
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from utils.pdf_reader import extract_text_with_pages
from utils.ollama_client import ask_ollama_fast
from prompt import prompt_manager, result_formatter
from database import init_database, check_database_health
from routes import api_router

# Load environment variables
load_dotenv()

# Configuration from environment variables
ANALYSIS_TIMEOUT_SECONDS = int(os.getenv("ANALYSIS_TIMEOUT_SECONDS", 60))
TEMPERATURE = float(os.getenv("TEMPERATURE", 0.1))
# No worker limits - process everything simultaneously
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
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
        # Continue without database for now

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # Allow frontend origins from env
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Include API routes (includes auth and user routes)
app.include_router(api_router)

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

def analyze_single_page(page_data):
    """Analyze a single page - optimized for parallel processing"""
    page = page_data['page']
    text = page_data['text']
    
    # Get prompt from template
    prompt = prompt_manager.get_single_page_analysis_prompt(page, text)
    try:
        ai_response = ask_ollama_fast(
            prompt,
            temperature=TEMPERATURE, 
            timeout_seconds=ANALYSIS_TIMEOUT_SECONDS
        )
        return {"page": page, "analysis": ai_response, "success": True}
    except Exception as e:
        logging.error(f"Error analyzing page {page}: {str(e)}")
        return {"page": page, "analysis": f"Error: {str(e)}", "success": False}

@app.post("/analyze")
async def analyze_pdf(file: UploadFile = File(...)):
    try:
        if not file.filename:
            return {"error": "No file provided"}
        
        file_path = f"{TEMP_DIR}/{file.filename}"
        os.makedirs(TEMP_DIR, exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
        logging.info(f"Received file '{file.filename}' saved to {file_path}")

        pages = extract_text_with_pages(file_path)
        logging.info(f"Extracted {len(pages)} pages from PDF")
        
        # Parallel processing of pages - ALL PAGES SIMULTANEOUSLY
        logging.info(f"Starting simultaneous analysis of ALL {len(pages)} pages")
        
        # Create dynamic executor with enough workers for all pages
        with ThreadPoolExecutor(max_workers=len(pages)) as dynamic_executor:
            loop = asyncio.get_event_loop()
            tasks = []
            
            for page_data in pages:
                task = loop.run_in_executor(
                    dynamic_executor, 
                    analyze_single_page, 
                    page_data
                )
                tasks.append(task)
            
            # Wait for all tasks to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        all_error_messages = []
        successful_results = []
        errors_with_pages = []
        
        for result in results:
            if isinstance(result, Exception):
                logging.error(f"Task failed with exception: {result}")
                continue
                
            successful_results.append(result)
            
            if result.get("success", False):
                ai_response = result["analysis"]
                page_number = result["page"]
                
                # Check if violations were found using dynamic phrase from feedback instructions
                no_violations_phrase = prompt_manager.get_no_violations_phrase()
                if no_violations_phrase not in ai_response:
                    # Clean up the response to extract only error messages
                    violations = ai_response.strip()
                    
                    # Split by numbered points and clean up
                    lines = violations.split('\n')
                    cleaned_lines = []
                    for line in lines:
                        line = line.strip()
                        if line and not line.startswith('*') and not line.startswith('No other') and not line.startswith('No TU'):
                            # Remove numbering (1., 2., etc.)
                            if line[0].isdigit() and '. ' in line:
                                line = line.split('. ', 1)[1]
                            cleaned_lines.append(line)
                    
                    # Add cleaned violations to the list with page numbers
                    for line in cleaned_lines:
                        if line and len(line) > 10:  # Only add substantial error messages
                            all_error_messages.append(line)
                            errors_with_pages.append({
                                'text': line,
                                'page': page_number
                            })
        
        # Categorize errors into 3 phases
        categorized_errors = ErrorCategorizer.categorize_all_errors(errors_with_pages)
        phase_summary = ErrorCategorizer.get_phase_summary(categorized_errors)
        
        # Create formatted analysis summary
        return result_formatter.create_analysis_summary(
            successful_results, 
            all_error_messages, 
            categorized_errors, 
            phase_summary
        )
    except Exception as e:
        logging.exception("Analysis failed")
        return {"error": f"Analysis failed: {str(e)}"}

@app.post("/analyze-batch")
async def analyze_pdf_batch(file: UploadFile = File(...), max_pages: int = 10):
    """Batch analysis endpoint - processes all pages in a single request for maximum speed"""
    try:
        request_started_at = time.time()
        if not file.filename:
            return {"error": "No file provided"}
        
        file_path = f"{TEMP_DIR}/{file.filename}"
        os.makedirs(TEMP_DIR, exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
        logging.info(f"Received file '{file.filename}' for batch analysis")

        pages = extract_text_with_pages(file_path)
        original_pages_count = len(pages)
        logging.info(f"Extracted {original_pages_count} pages from PDF")
        
        # Limit pages if max_pages is specified
        if max_pages and max_pages > 0:
            pages = pages[:max_pages]
            logging.info(f"Limited analysis from {original_pages_count} to {len(pages)} pages (max_pages={max_pages})")
        else:
            logging.info(f"Analyzing all {len(pages)} pages (no max_pages limit)")

        
        # Get batch prompt from template
        batch_prompt = prompt_manager.get_batch_analysis_prompt(pages)
        
        logging.info(f"Sending batch analysis request for {len(pages)} pages")
        
        # Use the fast Ollama function for batch processing
        ai_response = ask_ollama_fast(
            batch_prompt,
            temperature=TEMPERATURE,
            timeout_seconds=ANALYSIS_TIMEOUT_SECONDS * 2  # Longer timeout for batch
        )
        
        # Parse the batch response with categorization
        categorized_results = {
            "errors": [],
            "warnings": [],
            "suggestions": []
        }
        
        page_results = []
        
        # Debug: Log the AI response
        logging.info(f"AI Response: {ai_response}")
        
        lines = ai_response.split('\n')
        current_page = None
        current_violations = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('Page ') and ':' in line:
                # Save previous page results
                if current_page:
                    page_results.append({
                        "page": current_page,
                        "analysis": f"Page {current_page}: " + ('; '.join(current_violations) if current_violations else prompt_manager.get_no_violations_phrase()),
                        "success": True,
                        "violations": current_violations
                    })
                
                # Start new page
                page_part = line.split(':', 1)[0]
                current_page = page_part.replace('Page ', '').strip()
                current_violations = []
                
                # Check if this page has violations
                if ':' in line and prompt_manager.get_no_violations_phrase() not in line:
                    violation_text = line.split(':', 1)[1].strip()
                    if violation_text:
                        # Extract specific error message
                        if '[ERROR]' in violation_text:
                            error_msg = violation_text.split('[ERROR]')[1].strip()
                            current_violations.append(f"[ERROR] {error_msg}")
                        elif '[WARNING]' in violation_text:
                            warning_msg = violation_text.split('[WARNING]')[1].strip()
                            current_violations.append(f"[WARNING] {warning_msg}")

                        else:
                            current_violations.append(violation_text)
            elif line and current_page and prompt_manager.get_no_violations_phrase() not in line:
                # Check if line contains categorized content
                if '[ERROR]' in line:
                    error_msg = line.split('[ERROR]')[1].strip()
                    current_violations.append(f"[ERROR] {error_msg}")
                elif '[WARNING]' in line:
                    warning_msg = line.split('[WARNING]')[1].strip()
                    current_violations.append(f"[WARNING] {warning_msg}")

                else:
                    current_violations.append(line)
        
        # Add the last page
        if current_page:
            page_results.append({
                "page": current_page,
                "analysis": f"Page {current_page}: " + ('; '.join(current_violations) if current_violations else prompt_manager.get_no_violations_phrase()),
                "success": True,
                "violations": current_violations
            })
        
        # If no pages were parsed, try alternative parsing using page markers
        if not page_results:
            logging.warning("No pages parsed from AI response, trying alternative parsing...")
            
            # Split by page markers (--- PAGE X ---)
            page_sections = re.split(r'---\s*PAGE\s+(\d+)\s*---', ai_response, flags=re.IGNORECASE)
            
            # Process each page section
            for i in range(1, len(page_sections), 2):  # Skip the first empty section, process pairs (page_num, content)
                if i + 1 < len(page_sections):
                    page_num = int(page_sections[i])
                    page_content = page_sections[i + 1].strip()
                    
                    # Skip empty content
                    if not page_content:
                        continue
                    
                    # Extract violations from this page's content
                    violations = []
                    lines = page_content.split('\n')
                    
                    for line in lines:
                        line = line.strip()
                        if not line:
                            continue
                        
                        # Skip introductory text
                        if line.lower().startswith(('here is', 'after analyzing', 'analysis of')):
                            continue
                            
                        # Check for violation markers [ERROR], [WARNING], [SUGGESTION]
                        if any(marker in line.upper() for marker in ['[ERROR]', '[WARNING]', '[SUGGESTION]']):
                            # Keep the original line with marker for proper categorization
                            if len(line) > 10:
                                violations.append(line)
                        
                        # Check for numbered violations (1., 2., etc.)
                        elif re.match(r'^\d+\.\s+', line):
                            clean_violation = re.sub(r'^\d+\.\s+', '', line).strip()
                            if clean_violation and len(clean_violation) > 10:
                                violations.append(clean_violation)
                        
                        # Check for bullet points
                        elif line.startswith('•') or line.startswith('-'):
                            clean_violation = line[1:].strip()
                            if clean_violation and len(clean_violation) > 10:
                                violations.append(clean_violation)
                        
                        # Check for legacy format with prefixes
                        elif any(keyword in line.upper() for keyword in ['ERROR:', 'WARNING:', 'VIOLATION:']):
                            # Clean up the line and extract the violation
                            clean_line = line
                            # Remove prefixes like "ERROR:", "WARNING:", etc.
                            for prefix in ['ERROR:', 'WARNING:', 'VIOLATION:']:
                                clean_line = clean_line.replace(prefix, '').strip()
                            
                            if clean_line and len(clean_line) > 5:  # Only add substantial violations
                                violations.append(clean_line)
                        
                        # Also check for lines that describe issues without explicit prefixes
                        elif any(keyword in line.lower() for keyword in ['missing', 'incorrect', 'wrong', 'should be', 'problem', 'issue', 'mistake', 'format']):
                            if len(line) > 15:  # Only add substantial violations
                                violations.append(line)
                    
                    # Create page result
                    if violations:
                        analysis_text = "\n".join([f"• {v}" for v in violations])
                    else:
                        analysis_text = prompt_manager.get_no_violations_phrase()
                    
                    page_results.append({
                        "page": page_num,
                        "analysis": analysis_text,
                        "success": True,
                        "violations": violations
                    })
            
            # If still no pages parsed, fall back to simple text parsing
            if not page_results:
                logging.warning("No page markers found, trying simple text parsing...")
                # Try to parse any violations from the response
                all_text = ai_response.lower()
                
                # Get violation indicators from feedback instructions
                violation_indicators = prompt_manager.get_violation_indicators()
                
                has_violations = any(indicator in all_text for indicator in violation_indicators)
                
                if has_violations:
                    # Parse individual violations from the response
                    violations = []
                    lines = ai_response.split('\n')
                    
                    for line in lines:
                        line = line.strip()
                        if not line:
                            continue
                            
                        # Skip header/intro lines
                        if line.lower().startswith(('here is', 'after analyzing', 'analysis of', 'page', '---')):
                            continue
                            
                        # Check for violation markers
                        if any(marker in line.upper() for marker in ['[ERROR]', '[WARNING]', '[SUGGESTION]']):
                            # Clean up the violation text
                            clean_violation = line
                            for marker in ['[ERROR]', '[WARNING]', '[SUGGESTION]']:
                                clean_violation = clean_violation.replace(marker, '').strip()
                            
                            if clean_violation and len(clean_violation) > 10:
                                violations.append(line)  # Keep original with marker
                        
                        # Check for numbered violations (1., 2., etc.)
                        elif re.match(r'^\d+\.\s+', line):
                            clean_violation = re.sub(r'^\d+\.\s+', '', line).strip()
                            if clean_violation and len(clean_violation) > 10:
                                violations.append(clean_violation)
                        
                        # Check for bullet points
                        elif line.startswith('•') or line.startswith('-'):
                            clean_violation = line[1:].strip()
                            if clean_violation and len(clean_violation) > 10:
                                violations.append(clean_violation)
                        
                        # Check for lines with violation keywords
                        elif any(keyword in line.lower() for keyword in ['missing', 'incorrect', 'wrong', 'should be', 'problem', 'issue', 'violation', 'error', 'format']):
                            if len(line) > 15:  # Only substantial violations
                                violations.append(line)
                    
                    # If no individual violations found, split by sentences as last resort
                    if not violations:
                        sentences = re.split(r'[.!?]+', ai_response)
                        for sentence in sentences:
                            sentence = sentence.strip()
                            if len(sentence) > 20 and any(keyword in sentence.lower() for keyword in ['missing', 'incorrect', 'wrong', 'should', 'format', 'violation']):
                                violations.append(sentence)
                    
                    analysis_text = "\n".join([f"• {v}" for v in violations]) if violations else ai_response.strip()
                    
                    # Instead of defaulting everything to page 1, distribute violations across available pages
                    # if we have multiple pages but no page markers in violations
                    total_available_pages = len(pages)
                    
                    if total_available_pages > 1 and violations:
                        # Distribute violations across pages
                        violations_per_page = max(1, len(violations) // total_available_pages)
                        
                        for page_idx in range(total_available_pages):
                            start_idx = page_idx * violations_per_page
                            if page_idx == total_available_pages - 1:
                                # Last page gets remaining violations
                                page_violations = violations[start_idx:]
                            else:
                                page_violations = violations[start_idx:start_idx + violations_per_page]
                            
                            if page_violations:
                                page_analysis = "\n".join([f"• {v}" for v in page_violations])
                                page_results.append({
                                    "page": page_idx + 1,
                                    "analysis": page_analysis,
                                    "success": True,
                                    "violations": page_violations
                                })
                                logging.info(f"Distributed {len(page_violations)} violations to page {page_idx + 1}")
                    else:
                        # Single page or no violations - use original logic
                        page_results.append({
                            "page": 1,
                            "analysis": analysis_text,
                            "success": True,
                            "violations": violations
                        })
        
        # Categorize violations from all pages
        for page_result in page_results:
            if page_result.get("violations"):
                for violation in page_result["violations"]:
                    # Extract page number from violation text if it contains "Page X:"
                    page_number = page_result["page"]  # Default page number
                    violation_text = violation
                    
                    # Look for various page number patterns in the violation text
                    page_patterns = [
                        r'Page\s+(\d+):\s*',  # "Page 2: " format
                        r'Page\s+(\d+)\s+',   # "Page 2 " format  
                        r'page\s+(\d+):\s*',  # "page 2: " format
                        r'Page:\s*(\d+)',     # "Page: 2" format
                        r'\[Page\s*(\d+)\]',  # "[Page 2]" format
                    ]
                    
                    page_number_found = False
                    for pattern in page_patterns:
                        page_match = re.search(pattern, violation, re.IGNORECASE)
                        if page_match:
                            page_number = int(page_match.group(1))
                            # Remove the page pattern from the text
                            violation_text = re.sub(pattern, '', violation, flags=re.IGNORECASE).strip()
                            page_number_found = True
                            logging.info(f"Extracted page {page_number} from violation: {violation[:100]}...")
                            break
                    
                    if not page_number_found:
                        logging.warning(f"No page number found in violation: {violation[:100]}...")
                    
                    categorized_violation = {
                        "page": page_number,
                        "text": violation_text,
                        "type": "unknown"
                    }
                    
                    # Precise categorization based on tags first, then keywords
                    violation_lower = violation.lower()
                    
                    # Check for explicit tags first (most reliable)
                    if "[WARNING]" in violation.upper():
                        warning_text = violation.replace("[WARNING]", "").replace("[warning]", "").strip()
                        # Remove page patterns
                        warning_text = re.sub(r'Page\s+\d+:\s*', '', warning_text, flags=re.IGNORECASE).strip()
                        categorized_violation["text"] = warning_text
                        categorized_violation["type"] = "warning"
                        categorized_results["warnings"].append(categorized_violation)
                        logging.info(f"Categorized as WARNING: {warning_text}")
                    elif "[SUGGESTION]" in violation.upper():
                        suggestion_text = violation.replace("[SUGGESTION]", "").replace("[suggestion]", "").strip()
                        # Remove page patterns
                        suggestion_text = re.sub(r'Page\s+\d+:\s*', '', suggestion_text, flags=re.IGNORECASE).strip()
                        categorized_violation["text"] = suggestion_text
                        categorized_violation["type"] = "suggestion"
                        categorized_results["suggestions"].append(categorized_violation)
                        logging.info(f"Categorized as SUGGESTION: {suggestion_text}")
                    elif "[ERROR]" in violation.upper():
                        error_text = violation.replace("[ERROR]", "").replace("[error]", "").strip()
                        # Clean up common prefixes
                        error_text = error_text.replace("Page X:", "").replace("Page X :", "").strip()
                        # Also remove "Page N:" pattern
                        error_text = re.sub(r'Page\s+\d+:\s*', '', error_text, flags=re.IGNORECASE).strip()
                        categorized_violation["text"] = error_text
                        categorized_violation["type"] = "error"
                        categorized_results["errors"].append(categorized_violation)
                    # Check for keyword-based categorization if no explicit tags
                    elif "consider" in violation_lower or "recommend" in violation_lower or "suggestion" in violation_lower:
                        categorized_violation["text"] = violation_text
                        categorized_violation["type"] = "suggestion"
                        categorized_results["suggestions"].append(categorized_violation)
                    elif any(word in violation_lower for word in prompt_manager.get_warning_keywords()):
                        categorized_violation["text"] = violation_text
                        categorized_violation["type"] = "warning"
                        categorized_results["warnings"].append(categorized_violation)
                    elif any(word in violation_lower for word in prompt_manager.get_error_keywords()):
                        categorized_violation["text"] = violation_text
                        categorized_violation["type"] = "error"
                        categorized_results["errors"].append(categorized_violation)
                    else:
                        # Default to error if no category specified but it's clearly a violation
                        if prompt_manager.get_no_violations_phrase().lower() not in violation_lower:
                            categorized_violation["text"] = violation_text
                            categorized_violation["type"] = "error"
                            categorized_results["errors"].append(categorized_violation)
        
        # Count total issues
        total_errors = len(categorized_results["errors"])
        total_warnings = len(categorized_results["warnings"])
        total_suggestions = len(categorized_results["suggestions"])
        total_issues = total_errors + total_warnings + total_suggestions
        
        # Debug logging for categorization
        logging.info(f"Final categorization: {total_errors} errors, {total_warnings} warnings, {total_suggestions} suggestions")
        
        # Create overall summary
        if total_issues > 0:
            overall_summary = f"""TU FORMAT ANALYSIS COMPLETE

📊 SUMMARY:
• Pages Analyzed: {len(page_results)}
• Errors: {total_errors} | Warnings: {total_warnings} | Suggestions: {total_suggestions}

Focus on fixing ERRORS first, then WARNINGS, then consider SUGGESTIONS."""
        else:
            overall_summary = f"""TU FORMAT ANALYSIS COMPLETE

📊 SUMMARY:
• Pages Analyzed: {len(page_results)}
• Status: ✅ No violations detected

Your document follows TU format standards correctly."""
        
        response_ready_at = time.time()
        analysis_time_ms = int((response_ready_at - request_started_at) * 1000)

        return {
            "overall_summary": overall_summary,
            "total_pages_analyzed": len(page_results),
            "pages_extracted": original_pages_count,
            "pages_analyzed": len(pages),
            "analysis_time_ms": analysis_time_ms,
            "analysis_started_at": request_started_at,
            "analysis_ended_at": response_ready_at,
            "total_errors_found": total_issues,
            "results": page_results,
            "categorized_results": categorized_results,
            "mode": "batch"
        }
    except Exception as e:
        logging.exception("Batch analysis failed")
        return {"error": f"Batch analysis failed: {str(e)}"}

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
