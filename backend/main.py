from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from utils.pdf_reader import extract_text_with_pages
from utils.ollama_client import ask_ollama_fast
from utils.rules_loader import load_rules
from utils.error_categorizer import ErrorCategorizer

# Configuration
ANALYSIS_TIMEOUT_SECONDS = 60  # Reduced from 300 to 60 seconds
MAX_TOKENS_PER_PAGE = 128
TEMPERATURE = 0.1
DEFAULT_MAX_PAGES = 10  # Default number of pages to analyze
MAX_WORKERS = 3  # Number of parallel workers for analysis

app = FastAPI()

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Global executor for parallel processing
executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

@app.get("/")
async def root():
    return {"message": "TU Report Analyzer Backend is running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "config": {
            "timeout_seconds": ANALYSIS_TIMEOUT_SECONDS,
            "max_tokens": MAX_TOKENS_PER_PAGE,
            "temperature": TEMPERATURE,
            "model": "llama3.2:3b",
            "max_workers": MAX_WORKERS
        }
    }

def analyze_single_page(page_data, rules):
    """Analyze a single page - optimized for parallel processing"""
    page = page_data['page']
    text = page_data['text']
    
    # Enhanced prompt to identify different types of violations
    prompt = f"""Analyze this page for TU format violations and categorize them:

Page {page} content:
{text[:600]}...

Check for violations in these categories:

1. STRUCTURE ERRORS (Critical):
   - Page numbering issues
   - Font not Times New Roman 12pt
   - Incorrect margins or spacing
   - Missing section titles in table of contents
   - Wrong positioning of elements
   - Flow problems (wrong order of sections)

2. GRAMMAR/SPELLING ERRORS:
   - Grammar mistakes
   - Spelling errors
   - Punctuation issues
   - Poor sentence structure

3. CONTENT ENHANCEMENT SUGGESTIONS:
   - Ways to improve content
   - Suggestions for better formatting
   - Ideas for adding more details
   - Recommendations for enhancement

For each violation found, specify the category and provide a clear description.
If no violations found, respond: No TU format violations detected on this page."""
    /
    try:
        ai_response = ask_ollama_fast(
            prompt, 
            max_tokens=MAX_TOKENS_PER_PAGE, 
            temperature=TEMPERATURE, 
            timeout_seconds=ANALYSIS_TIMEOUT_SECONDS
        )
        return {"page": page, "analysis": ai_response, "success": True}
    except Exception as e:
        logging.error(f"Error analyzing page {page}: {str(e)}")
        return {"page": page, "analysis": f"Error: {str(e)}", "success": False}

@app.post("/analyze")
async def analyze_pdf(file: UploadFile = File(...), max_pages: int | None = DEFAULT_MAX_PAGES):
    try:
        if not file.filename:
            return {"error": "No file provided"}
        
        file_path = f"temp/{file.filename}"
        os.makedirs("temp", exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
        logging.info(f"Received file '{file.filename}' saved to {file_path}")

        pages = extract_text_with_pages(file_path)
        logging.info(f"Extracted {len(pages)} pages from PDF")
        if max_pages is not None and isinstance(max_pages, int) and max_pages > 0:
            pages = pages[:max_pages]
            logging.info(f"Limiting analysis to first {len(pages)} pages due to max_pages={max_pages}")
        
        rules = load_rules()

        # Parallel processing of pages
        logging.info(f"Starting parallel analysis of {len(pages)} pages with {MAX_WORKERS} workers")
        
        # Create tasks for parallel execution
        loop = asyncio.get_event_loop()
        tasks = []
        
        for page_data in pages:
            task = loop.run_in_executor(
                executor, 
                analyze_single_page, 
                page_data, 
                rules
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
        
        # Create overall summary with the new format
        if all_error_messages:
            # Count errors by phase
            structure_count = len(categorized_errors["structure"])
            grammar_count = len(categorized_errors["grammar"])
            enhancement_count = len(categorized_errors["enhancement"])
            
            overall_summary = f"""TU FORMAT ANALYSIS COMPLETE

📊 SUMMARY:
• Total Pages Analyzed: {len(successful_results)}
• Total Issues Found: {len(all_error_messages)}

🔍 PHASE BREAKDOWN:
• Phase 1 (Structure): {structure_count} critical issues
• Phase 2 (Grammar): {grammar_count} language issues  
• Phase 3 (Enhancement): {enhancement_count} improvement suggestions

💡 RECOMMENDATIONS:
• Address Phase 1 issues first (critical structure problems)
• Fix Phase 2 grammar and spelling errors
• Consider Phase 3 suggestions for content improvement"""
        else:
            overall_summary = f"""TU FORMAT ANALYSIS COMPLETE

📊 SUMMARY:
• Total Pages Analyzed: {len(successful_results)}
• Total Issues Found: 0
• Compliance Rate: 100%

✅ EXCELLENT! No TU format violations detected.

Your document appears to follow TU format standards correctly."""
        
        return {
            "overall_summary": overall_summary,
            "total_pages_analyzed": len(successful_results),
            "total_errors_found": len(all_error_messages),
            "categorized_results": categorized_errors,
            "phase_summary": phase_summary,
            "results": successful_results
        }
    except Exception as e:
        logging.exception("Analysis failed")
        return {"error": f"Analysis failed: {str(e)}"}

@app.post("/analyze-batch")
async def analyze_pdf_batch(file: UploadFile = File(...), max_pages: int | None = DEFAULT_MAX_PAGES):
    """Batch analysis endpoint - processes all pages in a single request for maximum speed"""
    try:
        if not file.filename:
            return {"error": "No file provided"}
        
        file_path = f"temp/{file.filename}"
        os.makedirs("temp", exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
        logging.info(f"Received file '{file.filename}' for batch analysis")

        pages = extract_text_with_pages(file_path)
        logging.info(f"Extracted {len(pages)} pages from PDF")
        if max_pages is not None and isinstance(max_pages, int) and max_pages > 0:
            pages = pages[:max_pages]
            logging.info(f"Limiting analysis to first {len(pages)} pages due to max_pages={max_pages}")
        
        # Create a single batch prompt for all pages with categorization
        batch_prompt = """Analyze the following pages for TU format violations and provide focused feedback in FOUR categories:

ERROR (Critical issues - use [ERROR] prefix):
- Structure problems (missing sections, wrong order)
- Citation format issues (not IEEE style)
- Alignment problems
- Page numbering issues
- Font/size violations
- Margin violations

WARNING (Important issues - use [WARNING] prefix):
- Grammar mistakes
- Flow problems
- Inconsistent formatting

SUGGESTION (Improvements - use [SUGGESTION] prefix):
- How to improve writing, organization, clarity
- Better ways to present information
- Style improvements

IDEA (Future possibilities - use [IDEA] prefix):
- Related projects you could work on
- Extensions of current work
- Potential applications

IMPORTANT: Provide ONLY the most important feedback:
- List ALL ERRORS found (critical issues)
- List ALL WARNINGS found (grammar/flow issues)
- Provide ONLY 3-5 SUGGESTIONS total (how to improve)
- Provide ONLY 3-5 IDEAS total (future projects)

Format: Page X: [CATEGORY] Description
If no violations: Page X: No TU format violations detected.

Pages to analyze:
"""
        
        for page_data in pages:
            page_num = page_data['page']
            text = page_data['text'][:400]  # Shorter text per page for batch processing
            batch_prompt += f"--- PAGE {page_num} ---\n{text}\n\n"
        
        batch_prompt += "Check each page for: page numbering, margins, font (Times New Roman 12pt), spacing (1.5), headings format, citations (IEEE), grammar, flow, and structure.\n\nProvide ONLY the most critical feedback:\n- ALL ERRORS (structure, citations, formatting issues)\n- ALL WARNINGS (grammar, flow issues)\n- ONLY 3-5 SUGGESTIONS total (how to improve)\n- ONLY 3-5 IDEAS total (future projects)\n\nBe concise and focus on the most important issues.\n\nIMPORTANT: Each error/warning/suggestion/idea should be ONE SHORT SENTENCE only."
        
        logging.info(f"Sending batch analysis request for {len(pages)} pages")
        
        # Use the fast Ollama function for batch processing
        ai_response = ask_ollama_fast(
            batch_prompt,
            max_tokens=len(pages) * 80,  # More tokens for categorized response
            temperature=TEMPERATURE,
            timeout_seconds=ANALYSIS_TIMEOUT_SECONDS * 2  # Longer timeout for batch
        )
        
        # Parse the batch response with categorization
        categorized_results = {
            "errors": [],
            "warnings": [],
            "suggestions": [],
            "ideas": []
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
                        elif '[SUGGESTION]' in violation_text:
                            suggestion_msg = violation_text.split('[SUGGESTION]')[1].strip()
                            current_violations.append(f"[SUGGESTION] {suggestion_msg}")
                        elif '[IDEA]' in violation_text:
                            idea_msg = violation_text.split('[IDEA]')[1].strip()
                            current_violations.append(f"[IDEA] {idea_msg}")
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
                elif '[SUGGESTION]' in line:
                    suggestion_msg = line.split('[SUGGESTION]')[1].strip()
                    current_violations.append(f"[SUGGESTION] {suggestion_msg}")
                elif '[IDEA]' in line:
                    idea_msg = line.split('[IDEA]')[1].strip()
                    current_violations.append(f"[IDEA] {idea_msg}")
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
        
        # If no pages were parsed, try alternative parsing
        if not page_results:
            logging.warning("No pages parsed from AI response, trying alternative parsing...")
            # Try to parse any violations from the response
            all_text = ai_response.lower()
            
            # Look for common violation indicators
            violation_indicators = [
                "error", "violation", "problem", "issue", "incorrect", "wrong", "missing",
                "warning", "suggestion", "improvement", "idea", "recommendation"
            ]
            
            has_violations = any(indicator in all_text for indicator in violation_indicators)
            
            if has_violations:
                # Create a single page result with the full response
                page_results.append({
                    "page": 1,
                    "analysis": f"Page 1: {ai_response}",
                    "success": True,
                    "violations": [ai_response]
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
                    elif "[SUGGESTION]" in violation or any(word in violation_lower for word in ["suggestion", "improvement", "better", "alternative", "consider", "could", "should", "recommend"]):
                        if "[SUGGESTION]" in violation:
                            categorized_violation["text"] = violation.replace("[SUGGESTION]", "").strip()
                        else:
                            categorized_violation["text"] = violation.strip()
                        categorized_violation["type"] = "suggestion"
                        categorized_results["suggestions"].append(categorized_violation)
                    elif "[IDEA]" in violation or any(word in violation_lower for word in ["idea", "future", "related", "extension", "similar project", "could work on", "potential", "further"]):
                        if "[IDEA]" in violation:
                            categorized_violation["text"] = violation.replace("[IDEA]", "").strip()
                        else:
                            categorized_violation["text"] = violation.strip()
                        categorized_violation["type"] = "idea"
                        categorized_results["ideas"].append(categorized_violation)
                    else:
                        # Default to error if no category specified but it's clearly a violation
                        if "no tu format violations detected" not in violation_lower:
                            categorized_violation["type"] = "error"
                            categorized_results["errors"].append(categorized_violation)
        
        # Limit suggestions and ideas to 3-5 total each
        if len(categorized_results["suggestions"]) > 5:
            categorized_results["suggestions"] = categorized_results["suggestions"][:5]
        
        if len(categorized_results["ideas"]) > 5:
            categorized_results["ideas"] = categorized_results["ideas"][:5]
        
        # Generate fallback suggestions and ideas if none were provided (limited to 3-5 total)
        if not categorized_results["suggestions"] and page_results:
            generic_suggestions = [
                "Consider adding more detailed explanations to improve clarity",
                "Review the formatting consistency throughout this section", 
                "Add more specific examples to strengthen your arguments",
                "Consider reorganizing content for better flow",
                "Add transitional phrases to improve readability"
            ]
            
            for i, suggestion in enumerate(generic_suggestions[:3]):  # Limit to 3 suggestions
                categorized_results["suggestions"].append({
                    "page": "general",
                    "text": suggestion,
                    "type": "suggestion"
                })
        
        if not categorized_results["ideas"] and page_results:
            generic_ideas = [
                "This topic could be extended to include related research areas",
                "Consider developing this into a larger research project", 
                "This work could be applied to similar problems in other domains",
                "Future work could explore advanced implementations",
                "This research could be extended to include comparative studies"
            ]
            
            for i, idea in enumerate(generic_ideas[:3]):  # Limit to 3 ideas
                categorized_results["ideas"].append({
                    "page": "general",
                    "text": idea,
                    "type": "idea"
                })
        
        # Count total issues
        total_errors = len(categorized_results["errors"])
        total_warnings = len(categorized_results["warnings"])
        total_suggestions = len(categorized_results["suggestions"])
        total_ideas = len(categorized_results["ideas"])
        total_issues = total_errors + total_warnings + total_suggestions + total_ideas
        
        # Create overall summary
        if total_issues > 0:
            overall_summary = f"""TU FORMAT ANALYSIS COMPLETE

📊 SUMMARY:
• Pages Analyzed: {len(page_results)}
• Errors: {total_errors} | Warnings: {total_warnings} | Suggestions: {total_suggestions} | Ideas: {total_ideas}

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
