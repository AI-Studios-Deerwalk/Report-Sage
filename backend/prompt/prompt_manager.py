"""
Prompt Manager Module
Handles loading and formatting AI prompt templates
"""

import os
import logging


class PromptManager:
    """Manages AI prompt templates and formatting"""
    
    def __init__(self):
        self.prompt_dir = os.path.dirname(os.path.abspath(__file__))
        # Load base prompts once
        self.abstract_analysis_prompt = self.load_template("abstract_analysis_prompt")
        self.feedback_instructions = self.load_template("feedback_instructions")
    
    def load_template(self, template_name):
        """Load a prompt template from file"""
        try:
            template_path = os.path.join(self.prompt_dir, f"{template_name}.txt")
            with open(template_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logging.error(f"Failed to load template {template_name}: {str(e)}")
            return None
    
    def get_abstract_analysis_prompt(self, abstract_text: str) -> str:
        """Get formatted abstract analysis prompt"""
        if not self.abstract_analysis_prompt:
            logging.error("Failed to load abstract analysis prompt template")
            return None
        
        return f"""{self.abstract_analysis_prompt}

## ABSTRACT TO ANALYZE:

{abstract_text}

Please analyze this abstract according to the criteria above and provide structured feedback."""
    
    def extract_abstract_from_pdf_content(self, pdf_content: str) -> str:
        """Extract abstract from PDF content"""
        if not pdf_content:
            return ""
        
        # Common patterns for finding abstracts
        abstract_patterns = [
            r"ABSTRACT\s*\n(.*?)(?=\n\n|\n[A-Z]|$)",
            r"Abstract\s*\n(.*?)(?=\n\n|\n[A-Z]|$)",
            r"abstract\s*\n(.*?)(?=\n\n|\n[A-Z]|$)",
            r"ABSTRACT\s*[:\-]?\s*(.*?)(?=\n\n|\n[A-Z]|$)",
            r"Abstract\s*[:\-]?\s*(.*?)(?=\n\n|\n[A-Z]|$)",
        ]
        
        import re
        
        for pattern in abstract_patterns:
            match = re.search(pattern, pdf_content, re.DOTALL | re.IGNORECASE)
            if match:
                abstract = match.group(1).strip()
                # Clean up the abstract
                abstract = re.sub(r'\n+', ' ', abstract)  # Replace multiple newlines with spaces
                abstract = re.sub(r'\s+', ' ', abstract)  # Replace multiple spaces with single space
                return abstract
        
        # If no abstract found, return first few paragraphs
        paragraphs = pdf_content.split('\n\n')
        if paragraphs:
            return paragraphs[0][:1000]  # Return first paragraph or first 1000 characters
        
        return pdf_content[:1000]  # Fallback to first 1000 characters


# Global instance for easy access
prompt_manager = PromptManager()
