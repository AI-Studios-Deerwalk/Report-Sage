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
        self.tu_rules = self.load_template("tu_formatting_rules")
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
    
    def get_single_page_analysis_prompt(self, page, text):
        """Get formatted single page analysis prompt"""
        if not self.tu_rules or not self.feedback_instructions:
            logging.error("Failed to load base prompt templates")
            return None
        
        # Create specific analysis instruction
        analysis_instruction = f"""TASK: Analyze Page {page} for TU format violations.

PAGE {page} CONTENT:
{text[:600]}{"..." if len(text) > 600 else ""}

INSTRUCTIONS:
1. Review the content against TU formatting rules
2. Identify any violations or issues
3. Provide feedback using the specified categories
4. Be specific and helpful in your feedback

"""
        
        # Combine all parts
        full_prompt = f"""{analysis_instruction}

{self.tu_rules}

{self.feedback_instructions}"""
        
        return full_prompt
    
    def get_batch_analysis_prompt(self, pages):
        """Get formatted batch analysis prompt"""
        if not self.tu_rules or not self.feedback_instructions:
            logging.error("Failed to load base prompt templates")
            return None
        
        # Create batch analysis instruction
        analysis_instruction = f"""TASK: Analyze {len(pages)} pages for TU format violations.

PAGES TO ANALYZE:
"""
        
        # Add page content
        for page_data in pages:
            page_num = page_data['page']
            text = page_data['text'][:400]  # Shorter text per page for batch processing
            analysis_instruction += f"""
--- PAGE {page_num} ---
{text}{"..." if len(text) > 400 else ""}
"""
        
        analysis_instruction += f"""

INSTRUCTIONS:
1. Review each page against TU formatting rules
2. Identify violations and issues for each page
3. Provide feedback using the specified categories
4. Format response as: "Page X: [CATEGORY] Description"

"""
        
        # Combine all parts
        full_prompt = f"""{analysis_instruction}

{self.tu_rules}

{self.feedback_instructions}"""
        
        return full_prompt


# Global instance for easy access
prompt_manager = PromptManager()
