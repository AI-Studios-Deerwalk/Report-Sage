"""
Result Formatter Module
Handles formatting of TU format analysis results and summaries
"""

import logging


class ResultFormatter:
    """Formats analysis results into user-friendly summaries"""
    
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
