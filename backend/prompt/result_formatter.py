"""
Result Formatter Module
Handles formatting of TU format analysis results and summaries
"""

import logging
import re
from . import prompt_manager


class ResultFormatter:
    """Formats analysis results into user-friendly summaries"""
    
    @staticmethod
    def parse_analysis_result(analysis_text: str) -> dict:
        """
        Parse Ollama analysis result into structured data
        
        Args:
            analysis_text: Raw text output from Ollama
            
        Returns:
            Dict containing structured suggestions, warnings, and errors
        """
        try:
            result = {"suggestions": [], "warnings": [], "errors": []}

            if not analysis_text or not analysis_text.strip():
                return result

            # Normalize newlines and split
            lines = [ln.strip() for ln in analysis_text.splitlines()]

            # Patterns
            header_re = re.compile(r"^(SUGGESTIONS?|WARNINGS?|ERRORS?)\s*:?$", re.IGNORECASE)
            bullet_re = re.compile(r"^(-|\*|•|\d+[.)])\s+(.*)$")
            inline_tag_re = re.compile(r"^\[(ERROR|WARNING|SUGGESTION)\]\s*[:\-]?\s*(.*)$", re.IGNORECASE)
            severity_re = re.compile(r"(?:\(|\[)(low|medium|high)(?:\)|\])", re.IGNORECASE)

            current_section = None

            def push(target: str, text: str):
                if not text:
                    return
                # Try to extract severity tokens like (high) or [medium]
                severity = None
                sev_match = severity_re.search(text)
                if sev_match:
                    severity = sev_match.group(1).lower()
                    # remove the matched token from message
                    text_local = severity_re.sub("", text).strip(" -:•.\t")
                else:
                    text_local = text

                # Default severity: high for errors, medium for warnings, low/medium for suggestions
                if not severity:
                    if target == "errors":
                        severity = "high"
                    elif target == "warnings":
                        severity = "medium"
                    else:
                        severity = "low"

                result[target].append({
                    "message": text_local.strip(),
                    "severity": severity,
                    "category": "general",
                    "page_number": None,
                    "section": None,
                })

            for raw in lines:
                if not raw:
                    continue

                # Inline tag like [ERROR]: something
                m_inline = inline_tag_re.match(raw)
                if m_inline:
                    tag = m_inline.group(1).lower()
                    text = m_inline.group(2).strip()
                    mapping = {"error": "errors", "warning": "warnings", "suggestion": "suggestions"}
                    push(mapping.get(tag, "warnings"), text)
                    continue

                # Section header
                m_hdr = header_re.match(raw)
                if m_hdr:
                    hdr = m_hdr.group(1).upper()
                    if hdr.startswith("SUGGEST"):
                        current_section = "suggestions"
                    elif hdr.startswith("WARN"):
                        current_section = "warnings"
                    elif hdr.startswith("ERROR"):
                        current_section = "errors"
                    else:
                        current_section = None
                    continue

                # Bullet under a current section
                m_bullet = bullet_re.match(raw)
                if m_bullet and current_section:
                    push(current_section, m_bullet.group(2).strip())
                    continue

                # If there's no explicit bullet but we are in a section, treat as a continuation/item
                if current_section:
                    push(current_section, raw)

            return result

        except Exception as e:
            logging.error(f"Error parsing analysis result: {str(e)}")
            return {"suggestions": [], "warnings": [], "errors": []}
    
    @staticmethod
    def create_analysis_summary(successful_results, all_error_messages, categorized_errors, phase_summary):
        """
        Create formatted summary of TU format analysis results
        
        Args:
            successful_results: List of successful page analysis results
            all_error_messages: List of all error messages found
            categorized_errors: Dict of errors categorized by phase
            phase_summary: Summary information by phase
            
        Returns:
            Dict containing formatted summary and analysis data
        """
        try:
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

✅ EXCELLENT! {prompt_manager.prompt_manager.get_no_violations_phrase()}

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
            logging.exception("Analysis summary formatting failed")
            return {"error": f"Summary formatting failed: {str(e)}"}

    @staticmethod
    def format_error_list(errors, max_display=10):
        """Format a list of errors for display"""
        if not errors:
            return "No errors found."
        
        formatted = []
        for i, error in enumerate(errors[:max_display]):
            formatted.append(f"{i+1}. {error}")
        
        if len(errors) > max_display:
            formatted.append(f"... and {len(errors) - max_display} more issues")
        
        return "\n".join(formatted)
    
    @staticmethod
    def format_phase_summary(phase_summary):
        """Format phase summary information"""
        if not phase_summary:
            return "No phase summary available."
        
        formatted = "📋 DETAILED PHASE ANALYSIS:\n\n"
        for phase, details in phase_summary.items():
            formatted += f"🔹 {phase.upper()}:\n"
            if isinstance(details, dict):
                for key, value in details.items():
                    formatted += f"  • {key}: {value}\n"
            else:
                formatted += f"  • {details}\n"
            formatted += "\n"
        
        return formatted


# Global instance for easy access
result_formatter = ResultFormatter()
