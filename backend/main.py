from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import asyncio
import re
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from utils.pdf_reader import extract_text_with_pages
from utils.ollama_client import ask_ollama_fast
from prompt import prompt_manager, result_formatter

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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # Allow frontend origins from env
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

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
        
        for error in errors_with_pages:
            text_lower = error['text'].lower()
            
            # Categorize based on keywords
            if any(word in text_lower for word in ['structure', 'format', 'alignment', 'citation', 'numbering', 'margin', 'font']):
                categorized["structure"].append(error)
            elif any(word in text_lower for word in ['grammar', 'spelling', 'language', 'tense', 'punctuation']):
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
    return {"message": "TU Report Analyzer Backend is running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "config": {
            "timeout_seconds": ANALYSIS_TIMEOUT_SECONDS,
            "temperature": TEMPERATURE,
            "model": os.getenv("OLLAMA_MODEL", "llama3.2:3b"),
            "max_workers": "unlimited (dynamic)"
        }
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
                
                # Check if violations were found and extract them
                if "No TU format violations detected" not in ai_response:
                    # Clean up the response to extract only error messages
                    violations = ai_response.strip()
                    
                    # Remove common introductory phrases
                    phrases_to_remove = [
                        f"After analyzing page {result['page']}",
                        f"After analyzing the content of page {result['page']}",
                        f"After analyzing the provided content for Page {result['page']}",
                        "I have identified the following violations of TU format standards:",
                        "I found the following violations of TU format standards:",
                        "the following TU format standard violations were found:",
                        "Violations found:",
                        "No other violations were detected on this page.",
                        "No other violations of TU format standards were detected on this page.",
                        "No TU format violations detected on this page."
                    ]
                    
                    for phrase in phrases_to_remove:
                        violations = violations.replace(phrase, "")
                    
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
async def analyze_pdf_batch(file: UploadFile = File(...)):
    """Batch analysis endpoint - processes all pages in a single request for maximum speed"""
    try:
        if not file.filename:
            return {"error": "No file provided"}
        
        file_path = f"{TEMP_DIR}/{file.filename}"
        os.makedirs(TEMP_DIR, exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
        logging.info(f"Received file '{file.filename}' for batch analysis")

        pages = extract_text_with_pages(file_path)
        logging.info(f"Extracted {len(pages)} pages from PDF")

        
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
            "warnings": []
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
                        "analysis": f"Page {current_page}: " + ('; '.join(current_violations) if current_violations else "No TU format violations detected."),
                        "success": True,
                        "violations": current_violations
                    })
                
                # Start new page
                page_part = line.split(':', 1)[0]
                current_page = page_part.replace('Page ', '').strip()
                current_violations = []
                
                # Check if this page has violations
                if ':' in line and 'No TU format violations detected' not in line:
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
            elif line and current_page and 'No TU format violations detected' not in line:
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
                "analysis": f"Page {current_page}: " + ('; '.join(current_violations) if current_violations else "No TU format violations detected."),
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
                            
                        # Check if it's a violation line (contains ERROR or WARNING)
                        if any(keyword in line.upper() for keyword in ['ERROR:', 'WARNING:', 'VIOLATION']):
                            # Clean up the line and extract the violation
                            clean_line = line
                            # Remove prefixes like "ERROR:", "WARNING:", etc.
                            for prefix in ['ERROR:', 'WARNING:', 'VIOLATION:']:
                                clean_line = clean_line.replace(prefix, '').strip()
                            
                            if clean_line and len(clean_line) > 5:  # Only add substantial violations
                                violations.append(clean_line)
                        
                        # Also check for lines that describe issues without explicit prefixes
                        elif any(keyword in line.lower() for keyword in ['missing', 'incorrect', 'wrong', 'should be', 'problem', 'issue', 'mistake', 'error']):
                            if len(line) > 10:  # Only add substantial violations
                                violations.append(line)
                    
                    # Create page result
                    if violations:
                        analysis_text = "\n".join([f"• {v}" for v in violations])
                    else:
                        analysis_text = "No TU format violations detected on this page."
                    
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
                
                # Look for common violation indicators
                violation_indicators = [
                    "error", "violation", "problem", "issue", "incorrect", "wrong", "missing",
                    "warning", "suggestion", "improvement", "idea", "recommendation"
                ]
                
                has_violations = any(indicator in all_text for indicator in violation_indicators)
                
                if has_violations:
                    # Create a single page result with cleaned up response
                    clean_text = ai_response.strip()
                    # Remove common introductory phrases
                    intro_phrases = [
                        "Here is the analysis of each page for TU format violations:",
                        "After analyzing",
                        "The analysis shows"
                    ]
                    for phrase in intro_phrases:
                        clean_text = clean_text.replace(phrase, "").strip()
                    
                    page_results.append({
                        "page": 1,
                        "analysis": clean_text,
                        "success": True,
                        "violations": [clean_text]
                    })
        
        # Categorize violations from all pages
        for page_result in page_results:
            if page_result.get("violations"):
                for violation in page_result["violations"]:
                    categorized_violation = {
                        "page": page_result["page"],
                        "text": violation,
                        "type": "unknown"
                    }
                    
                    # More flexible categorization
                    violation_lower = violation.lower()
                    
                    if "[ERROR]" in violation or any(word in violation_lower for word in ["error", "violation", "problem", "incorrect", "wrong", "missing", "structure", "citation", "alignment", "page numbering", "font", "margin"]):
                        if "[ERROR]" in violation:
                            # Extract just the error message after [ERROR]
                            error_text = violation.replace("[ERROR]", "").strip()
                            # Clean up common prefixes
                            error_text = error_text.replace("Page X:", "").replace("Page X :", "").strip()
                            categorized_violation["text"] = error_text
                        else:
                            # For violations without [ERROR] prefix, try to extract the specific issue
                            error_text = violation.strip()
                            # Remove common prefixes and clean up
                            error_text = error_text.replace("Page X:", "").replace("Page X :", "").strip()
                            categorized_violation["text"] = error_text
                        categorized_violation["type"] = "error"
                        categorized_results["errors"].append(categorized_violation)
                    elif "[WARNING]" in violation or any(word in violation_lower for word in ["warning", "grammar", "flow", "formatting", "inconsistent"]):
                        if "[WARNING]" in violation:
                            categorized_violation["text"] = violation.replace("[WARNING]", "").strip()
                        else:
                            categorized_violation["text"] = violation.strip()
                        categorized_violation["type"] = "warning"
                        categorized_results["warnings"].append(categorized_violation)

                    else:
                        # Default to error if no category specified but it's clearly a violation
                        if "no tu format violations detected" not in violation_lower:
                            categorized_violation["type"] = "error"
                            categorized_results["errors"].append(categorized_violation)
        
        # Count total issues
        total_errors = len(categorized_results["errors"])
        total_warnings = len(categorized_results["warnings"])
        total_issues = total_errors + total_warnings
        
        # Create overall summary
        if total_issues > 0:
            overall_summary = f"""TU FORMAT ANALYSIS COMPLETE

📊 SUMMARY:
• Pages Analyzed: {len(page_results)}
• Errors: {total_errors} | Warnings: {total_warnings}

Focus on fixing ERRORS first, then address WARNINGS."""
        else:
            overall_summary = f"""TU FORMAT ANALYSIS COMPLETE

📊 SUMMARY:
• Pages Analyzed: {len(page_results)}
• Status: ✅ No violations detected

Your document follows TU format standards correctly."""
        
        return {
            "overall_summary": overall_summary,
            "total_pages_analyzed": len(page_results),
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
