"""
Result Formatter Module
Handles formatting of abstract analysis results and summaries
"""

import logging
import re
from . import prompt_manager


class ResultFormatter:
    """Formats analysis results into user-friendly summaries"""
    
    @staticmethod
    def parse_abstract_analysis_result(analysis_text: str) -> dict:
        """
        Parse Ollama abstract analysis result into structured data
        
        Args:
            analysis_text: Raw text output from Ollama
            
        Returns:
            Dict containing structured analysis results
        """
        try:
            result = {
                "motivation": {"status": "unknown", "feedback": ""},
                "methods": {"status": "unknown", "feedback": ""},
                "results": {"status": "unknown", "feedback": ""},
                "conclusion": {"status": "unknown", "feedback": ""},
                "overall_evaluation": ""
            }

            if not analysis_text or not analysis_text.strip():
                return result

            # Normalize newlines and split
            lines = [ln.strip() for ln in analysis_text.splitlines()]

            current_section = None
            current_feedback = []

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # Check for section headers
                if "Motivation / Problem Statement" in line:
                    if current_section and current_feedback:
                        result[current_section]["feedback"] = "\n".join(current_feedback).strip()
                    current_section = "motivation"
                    current_feedback = []
                    # Extract status
                    if "PRESENT" in line:
                        result["motivation"]["status"] = "present"
                    elif "PARTIALLY PRESENT" in line:
                        result["motivation"]["status"] = "partially_present"
                    elif "MISSING" in line:
                        result["motivation"]["status"] = "missing"
                    continue

                elif "Methods / Procedure / Approach" in line:
                    if current_section and current_feedback:
                        result[current_section]["feedback"] = "\n".join(current_feedback).strip()
                    current_section = "methods"
                    current_feedback = []
                    # Extract status
                    if "PRESENT" in line:
                        result["methods"]["status"] = "present"
                    elif "PARTIALLY PRESENT" in line:
                        result["methods"]["status"] = "partially_present"
                    elif "MISSING" in line:
                        result["methods"]["status"] = "missing"
                    continue

                elif "Results / Findings / Product" in line:
                    if current_section and current_feedback:
                        result[current_section]["feedback"] = "\n".join(current_feedback).strip()
                    current_section = "results"
                    current_feedback = []
                    # Extract status
                    if "PRESENT" in line:
                        result["results"]["status"] = "present"
                    elif "PARTIALLY PRESENT" in line:
                        result["results"]["status"] = "partially_present"
                    elif "MISSING" in line:
                        result["results"]["status"] = "missing"
                    continue

                elif "Conclusion / Implications" in line:
                    if current_section and current_feedback:
                        result[current_section]["feedback"] = "\n".join(current_feedback).strip()
                    current_section = "conclusion"
                    current_feedback = []
                    # Extract status
                    if "PRESENT" in line:
                        result["conclusion"]["status"] = "present"
                    elif "PARTIALLY PRESENT" in line:
                        result["conclusion"]["status"] = "partially_present"
                    elif "MISSING" in line:
                        result["conclusion"]["status"] = "missing"
                    continue

                elif "Overall Evaluation" in line:
                    if current_section and current_feedback:
                        result[current_section]["feedback"] = "\n".join(current_feedback).strip()
                    current_section = "overall_evaluation"
                    current_feedback = []
                    continue

                # Add line to current section feedback
                if current_section and line and not line.startswith('-') and not line.startswith('*'):
                    current_feedback.append(line)

            # Handle the last section
            if current_section and current_feedback:
                if current_section == "overall_evaluation":
                    result["overall_evaluation"] = "\n".join(current_feedback).strip()
                else:
                    result[current_section]["feedback"] = "\n".join(current_feedback).strip()

            return result

        except Exception as e:
            logging.error(f"Error parsing abstract analysis result: {str(e)}")
            return {
                "motivation": {"status": "unknown", "feedback": "Error parsing analysis"},
                "methods": {"status": "unknown", "feedback": "Error parsing analysis"},
                "results": {"status": "unknown", "feedback": "Error parsing analysis"},
                "conclusion": {"status": "unknown", "feedback": "Error parsing analysis"},
                "overall_evaluation": "Error parsing analysis results"
            }

    @staticmethod
    def create_abstract_analysis_summary(analysis_result: dict) -> dict:
        """
        Create a formatted summary of abstract analysis results
        
        Args:
            analysis_result: Parsed analysis result from parse_abstract_analysis_result
            
        Returns:
            Dict containing formatted summary
        """
        try:
            # Count statuses
            status_counts = {
                "present": 0,
                "partially_present": 0,
                "missing": 0,
                "unknown": 0
            }
            
            for section in ["motivation", "methods", "results", "conclusion"]:
                status = analysis_result.get(section, {}).get("status", "unknown")
                status_counts[status] += 1

            # Calculate overall score
            total_sections = 4
            score = 0
            if status_counts["present"] > 0:
                score += status_counts["present"] * 100
            if status_counts["partially_present"] > 0:
                score += status_counts["partially_present"] * 50
            score = score / total_sections

            # Determine overall quality
            if score >= 80:
                quality = "Excellent"
            elif score >= 60:
                quality = "Good"
            elif score >= 40:
                quality = "Fair"
            else:
                quality = "Needs Improvement"

            return {
                "summary": {
                    "total_sections": total_sections,
                    "present": status_counts["present"],
                    "partially_present": status_counts["partially_present"],
                    "missing": status_counts["missing"],
                    "score": round(score, 1),
                    "quality": quality
                },
                "detailed_analysis": analysis_result
            }

        except Exception as e:
            logging.error(f"Error creating abstract analysis summary: {str(e)}")
            return {
                "summary": {
                    "total_sections": 4,
                    "present": 0,
                    "partially_present": 0,
                    "missing": 4,
                    "score": 0,
                    "quality": "Error"
                },
                "detailed_analysis": analysis_result
            }


# Global instance for easy access
result_formatter = ResultFormatter()
