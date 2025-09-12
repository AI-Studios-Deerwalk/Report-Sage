import re
from typing import Dict, Any, List

class ResultFormatter:
    """Formats and parses analysis results from AI responses"""
    
    def parse_abstract_analysis_result(self, analysis_result: str) -> Dict[str, Any]:
        """Parse AI analysis result into structured format"""
        result = {
            "motivation": {"status": "unknown", "feedback": ""},
            "methods": {"status": "unknown", "feedback": ""},
            "results": {"status": "unknown", "feedback": ""},
            "conclusion": {"status": "unknown", "feedback": ""}
        }
        
        # Parse each section
        sections = {
            "motivation": r"MOTIVATION:\s*([A-Z]+)\s*-\s*(.*?)(?=\n[A-Z]+:|$)",
            "methods": r"METHODS:\s*([A-Z]+)\s*-\s*(.*?)(?=\n[A-Z]+:|$)",
            "results": r"RESULTS:\s*([A-Z]+)\s*-\s*(.*?)(?=\n[A-Z]+:|$)",
            "conclusion": r"CONCLUSION:\s*([A-Z]+)\s*-\s*(.*?)(?=\n[A-Z]+:|$)"
        }
        
        for section, pattern in sections.items():
            match = re.search(pattern, analysis_result, re.DOTALL | re.IGNORECASE)
            if match:
                status = match.group(1).strip().upper()
                feedback = match.group(2).strip()
                
                # Clean up feedback to remove overall mentions
                feedback = re.sub(r'\n\nOverall.*$', '', feedback, flags=re.DOTALL | re.IGNORECASE)
                feedback = re.sub(r'\nOverall.*$', '', feedback, flags=re.DOTALL | re.IGNORECASE)
                feedback = feedback.strip()
                
                result[section] = {
                    "status": "present" if status == "PRESENT" else "missing",
                    "feedback": feedback
                }
        
        return result
    
    def create_abstract_analysis_summary(self, parsed_results: Dict[str, Any]) -> Dict[str, Any]:
        """Create summary statistics from parsed results"""
        summary = {
            "total_sections": 4,
            "passed_sections": 0,
            "failed_sections": 0,
            "overall_score": 0.0,
            "recommendations": []
        }
        
        sections = ["motivation", "methods", "results", "conclusion"]
        
        for section in sections:
            if section in parsed_results and isinstance(parsed_results[section], dict):
                status = parsed_results[section].get("status", "unknown")
                if status == "present":
                    summary["passed_sections"] += 1
                elif status == "missing":
                    summary["failed_sections"] += 1
        
        # Calculate overall score
        if summary["total_sections"] > 0:
            summary["overall_score"] = (summary["passed_sections"] / summary["total_sections"]) * 100
        
        # Generate recommendations based on missing sections
        for section in sections:
            if section in parsed_results and isinstance(parsed_results[section], dict):
                status = parsed_results[section].get("status", "unknown")
                if status == "missing":
                    section_name = section.capitalize()
                    summary["recommendations"].append(f"Add {section_name} section based on feedback provided")
        
        return summary
    
    def format_analysis_for_display(self, parsed_results: Dict[str, Any]) -> List[Dict[str, str]]:
        """Format analysis results for frontend display"""
        formatted_results = []
        
        sections = [
            ("motivation", "Motivation & Objectives"),
            ("methods", "Methods & Approach"),
            ("results", "Results & Findings"),
            ("conclusion", "Conclusion & Implications")
        ]
        
        for section_key, section_name in sections:
            if section_key in parsed_results and isinstance(parsed_results[section_key], dict):
                section_data = parsed_results[section_key]
                status = section_data.get("status", "unknown")
                feedback = section_data.get("feedback", "No feedback available")
                
                formatted_results.append({
                    "section": section_name,
                    "status": status.upper(),
                    "feedback": feedback,
                    "icon": "✅" if status == "present" else "❌"
                })
        
        return formatted_results
    
    def parse_acknowledgement_analysis_result(self, analysis_result: str) -> Dict[str, Any]:
        """Parse AI analysis result for acknowledgement into structured format"""
        result = {
            "student_info": {"status": "unknown", "feedback": ""},
            "gratitude_expression": {"status": "unknown", "feedback": ""},
            "mentioned_parties": {"status": "unknown", "feedback": ""},
            "contribution_description": {"status": "unknown", "feedback": ""}
        }
        
        # More flexible regex patterns to handle different AI response formats
        sections = {
            "student_info": [
                r"STUDENT_INFO:\s*([A-Z]+)\s*-\s*(.*?)(?=\n[A-Z_]+:|$)",
                r"STUDENT_INFO:\s*([A-Z]+)\s*(.*?)(?=\n[A-Z_]+:|$)",
                r"STUDENT_INFO[:\s]*([A-Z]+)[\s-]*(.*?)(?=\n[A-Z_]+:|$)"
            ],
            "gratitude_expression": [
                r"GRATITUDE_EXPRESSION:\s*([A-Z]+)\s*-\s*(.*?)(?=\n[A-Z_]+:|$)",
                r"GRATITUDE_EXPRESSION:\s*([A-Z]+)\s*(.*?)(?=\n[A-Z_]+:|$)",
                r"GRATITUDE_EXPRESSION[:\s]*([A-Z]+)[\s-]*(.*?)(?=\n[A-Z_]+:|$)"
            ],
            "mentioned_parties": [
                r"MENTIONED_PARTIES:\s*([A-Z]+)\s*-\s*(.*?)(?=\n[A-Z_]+:|$)",
                r"MENTIONED_PARTIES:\s*([A-Z]+)\s*(.*?)(?=\n[A-Z_]+:|$)",
                r"MENTIONED_PARTIES[:\s]*([A-Z]+)[\s-]*(.*?)(?=\n[A-Z_]+:|$)"
            ],
            "contribution_description": [
                r"CONTRIBUTION_DESCRIPTION:\s*([A-Z]+)\s*-\s*(.*?)(?=\n[A-Z_]+:|$)",
                r"CONTRIBUTION_DESCRIPTION:\s*([A-Z]+)\s*(.*?)(?=\n[A-Z_]+:|$)",
                r"CONTRIBUTION_DESCRIPTION[:\s]*([A-Z]+)[\s-]*(.*?)(?=\n[A-Z_]+:|$)"
            ]
        }
        
        for section, patterns in sections.items():
            matched = False
            for i, pattern in enumerate(patterns):
                match = re.search(pattern, analysis_result, re.DOTALL | re.IGNORECASE)
                if match:
                    status = match.group(1).strip().upper()
                    feedback = match.group(2).strip()
                    
                    # Clean up feedback to remove overall mentions
                    feedback = re.sub(r'\n\nOverall.*$', '', feedback, flags=re.DOTALL | re.IGNORECASE)
                    feedback = re.sub(r'\nOverall.*$', '', feedback, flags=re.DOTALL | re.IGNORECASE)
                    feedback = feedback.strip()
                    
                    # Handle different status formats
                    if status in ["PRESENT", "MISSING"]:
                        result[section] = {
                            "status": "present" if status == "PRESENT" else "missing",
                            "feedback": feedback
                        }
                        matched = True
                    break  # Stop trying other patterns once we find a match
            
        
        return result
    
    def create_acknowledgement_analysis_summary(self, parsed_results: Dict[str, Any]) -> Dict[str, Any]:
        """Create summary statistics from parsed acknowledgement results"""
        summary = {
            "total_sections": 4,
            "passed_sections": 0,
            "failed_sections": 0,
            "overall_score": 0.0,
            "recommendations": []
        }
        
        sections = ["student_info", "gratitude_expression", "mentioned_parties", "contribution_description"]
        
        for section in sections:
            if section in parsed_results and isinstance(parsed_results[section], dict):
                status = parsed_results[section].get("status", "unknown")
                if status == "present":
                    summary["passed_sections"] += 1
                elif status == "missing":
                    summary["failed_sections"] += 1
        
        # Calculate overall score
        if summary["total_sections"] > 0:
            summary["overall_score"] = (summary["passed_sections"] / summary["total_sections"]) * 100
        
        # Generate recommendations based on missing sections
        for section in sections:
            if section in parsed_results and isinstance(parsed_results[section], dict):
                status = parsed_results[section].get("status", "unknown")
                if status == "missing":
                    section_name = section.replace("_", " ").title()
                    summary["recommendations"].append(f"Add {section_name} section based on feedback provided")
        
        return summary
    
    def format_acknowledgement_analysis_for_display(self, parsed_results: Dict[str, Any]) -> List[Dict[str, str]]:
        """Format acknowledgement analysis results for frontend display"""
        formatted_results = []
        
        sections = [
            ("student_info", "Student Information"),
            ("gratitude_expression", "Gratitude Expression"),
            ("mentioned_parties", "Mentioned Parties"),
            ("contribution_description", "Contribution Description")
        ]
        
        for section_key, section_name in sections:
            if section_key in parsed_results and isinstance(parsed_results[section_key], dict):
                section_data = parsed_results[section_key]
                status = section_data.get("status", "unknown")
                feedback = section_data.get("feedback", "No feedback available")
                
                formatted_results.append({
                    "section": section_name,
                    "status": status.upper(),
                    "feedback": feedback,
                    "icon": "✅" if status == "present" else "❌"
                })
        
        return formatted_results