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
        # Extract key formatting rules for analysis
        self.analysis_rules = self._extract_analysis_rules()
    
    def load_template(self, template_name):
        """Load a prompt template from file"""
        try:
            template_path = os.path.join(self.prompt_dir, f"{template_name}.txt")
            with open(template_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logging.error(f"Failed to load template {template_name}: {str(e)}")
            return None
    
    def _extract_analysis_rules(self):
        """Extract key formatting rules from TU rules for AI analysis"""
        if not self.tu_rules:
            return "- No formatting rules loaded"
        
        # Parse rules directly from tu_formatting_rules.txt content
        rules = []
        lines = self.tu_rules.split('\n')
        
        # Track if we're in a formatting standards section
        in_formatting_section = False
        
        for line in lines:
            line = line.strip()
            
            # Check for formatting standards sections
            if 'FORMATTING STANDARDS' in line or 'Page Setup' in line or 'Typography' in line or \
               'Page Numbering' in line or 'Heading Hierarchy' in line or 'Tables and Figures' in line or \
               'Table of Contents' in line or 'CITATION AND REFERENCING' in line or 'IEEE Citation' in line:
                in_formatting_section = True
                continue
                
            # Stop at quality standards or other non-formatting sections  
            if 'CONTENT QUALITY' in line or 'QUALITY ASSURANCE' in line or 'SUBMISSION' in line:
                in_formatting_section = False
                continue
            
            # Extract rules only from formatting sections
            if in_formatting_section and line.startswith('- '):
                # Clean up markdown formatting and extract meaningful rules
                clean_line = line.replace('**', '').replace(':', ' -')
                
                # Filter for actual formatting rules (avoid structure/content items)
                formatting_keywords = self.get_structure_keywords()
                
                if any(keyword in clean_line.lower() for keyword in formatting_keywords):
                    rules.append(clean_line)
        
        # If no rules extracted, fall back to feedback instructions
        if not rules and self.feedback_instructions:
            return self._extract_from_feedback_instructions()
            
        return "\n".join(rules) if rules else "- No formatting rules extracted"
    
    def _extract_from_feedback_instructions(self):
        """Extract key points from feedback instructions as fallback"""
        rules = []
        lines = self.feedback_instructions.split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith('   - ') and ('violation' in line.lower() or 'format' in line.lower()):
                # Clean up and format as rule
                clean_line = line.replace('   - ', '- ').replace('violations', 'requirements')
                rules.append(clean_line)
        
        return "\n".join(rules) if rules else "- No rules extracted from feedback instructions"
    
    def get_structure_keywords(self):
        """Extract structure/formatting keywords dynamically from feedback_instructions.txt"""
        if not self.feedback_instructions:
            return []
        
        keywords = []
        lines = self.feedback_instructions.split('\n')
        for line in lines:
            line = line.strip()
            # Extract words from error category descriptions
            if 'structure problems' in line.lower() or 'format violations' in line.lower():
                # Extract actual keywords mentioned in the line
                words = line.lower().replace('-', ' ').replace('(', ' ').replace(')', ' ').split()
                keywords.extend([word for word in words if len(word) > 3 and word.isalpha()])
        return list(set(keywords))  # Remove duplicates
    
    def get_grammar_keywords(self):
        """Extract grammar keywords dynamically from feedback_instructions.txt"""
        if not self.feedback_instructions:
            return []
            
        keywords = []
        lines = self.feedback_instructions.split('\n')
        for line in lines:
            line = line.strip()
            if 'grammar' in line.lower() or 'spelling' in line.lower() or 'warning' in line.lower():
                words = line.lower().replace('-', ' ').replace('(', ' ').replace(')', ' ').split()
                keywords.extend([word for word in words if len(word) > 3 and word.isalpha()])
        return list(set(keywords))
    
    def get_error_keywords(self):
        """Extract error keywords dynamically from feedback_instructions.txt"""
        if not self.feedback_instructions:
            return []
            
        keywords = []
        lines = self.feedback_instructions.split('\n')
        for line in lines:
            line = line.strip()
            if '[ERROR]' in line or 'critical issues' in line.lower() or 'must fix' in line.lower():
                words = line.lower().replace('-', ' ').replace('(', ' ').replace(')', ' ').split()
                keywords.extend([word for word in words if len(word) > 3 and word.isalpha()])
        return list(set(keywords))
    
    def get_warning_keywords(self):
        """Extract warning keywords dynamically from feedback_instructions.txt"""
        if not self.feedback_instructions:
            return []
            
        keywords = []
        lines = self.feedback_instructions.split('\n')
        for line in lines:
            line = line.strip()
            if '[WARNING]' in line or 'important issues' in line.lower() or 'should fix' in line.lower():
                words = line.lower().replace('-', ' ').replace('(', ' ').replace(')', ' ').split()
                keywords.extend([word for word in words if len(word) > 3 and word.isalpha()])
        return list(set(keywords))
    
    def get_suggestion_keywords(self):
        """Extract suggestion keywords dynamically from feedback_instructions.txt"""
        if not self.feedback_instructions:
            return []
            
        keywords = []
        lines = self.feedback_instructions.split('\n')
        for line in lines:
            line = line.strip()
            if '[SUGGESTION]' in line or 'enhancement ideas' in line.lower() or 'optional' in line.lower():
                words = line.lower().replace('-', ' ').replace('(', ' ').replace(')', ' ').split()
                keywords.extend([word for word in words if len(word) > 3 and word.isalpha()])
        return list(set(keywords))
    
    def get_no_violations_phrase(self):
        """Extract no violations phrase from feedback_instructions.txt"""
        if not self.feedback_instructions:
            return "No violations detected"
        
        lines = self.feedback_instructions.split('\n')
        for line in lines:
            if 'no violations found' in line.lower() and 'respond:' in line.lower():
                # Extract the phrase after "respond:"
                if '"' in line:
                    start = line.find('"') + 1
                    end = line.rfind('"')
                    if start > 0 and end > start:
                        return line[start:end]
        return "No violations detected"
    
    def get_violation_indicators(self):
        """Extract violation indicators from feedback_instructions.txt"""
        if not self.feedback_instructions:
            return []
        
        indicators = []
        lines = self.feedback_instructions.split('\n')
        for line in lines:
            # Extract words from error and warning descriptions
            if any(category in line.lower() for category in ['error', 'warning', 'suggestion']):
                words = line.lower().replace('-', ' ').replace('(', ' ').replace(')', ' ').split()
                indicators.extend([word for word in words if len(word) > 3 and word.isalpha()])
        return list(set(indicators))
    
    def get_single_page_analysis_prompt(self, page, text):
        """Get formatted single page analysis prompt using feedback_instructions.txt"""
        if not self.tu_rules or not self.feedback_instructions:
            logging.error("Failed to load base prompt templates")
            return None
        
        # Use feedback instructions content directly
        return f"""You are a TU format analyzer. Analyze page {page} for format violations.

{self.feedback_instructions}

PAGE {page} CONTENT:
{text[:800]}{"..." if len(text) > 800 else ""}

ANALYZE AGAINST THESE RULES:
{self.analysis_rules}"""
    
    def get_batch_analysis_prompt(self, pages):
        """Get formatted batch analysis prompt using feedback_instructions.txt"""
        if not self.tu_rules or not self.feedback_instructions:
            logging.error("Failed to load base prompt templates")
            return None
        
        # Use feedback instructions content directly
        analysis_instruction = f"""You are a TU format analyzer. Analyze {len(pages)} pages and find format violations.

{self.feedback_instructions}

PAGES TO ANALYZE:
"""
        
        # Add page content
        for page_data in pages:
            page_num = page_data['page']
            text = page_data['text'][:500]
            analysis_instruction += f"""
--- PAGE {page_num} ---
{text}{"..." if len(text) > 500 else ""}
"""
        
        analysis_instruction += f"""

ANALYZE AGAINST THESE RULES:
{self.analysis_rules}"""
        
        return analysis_instruction


# Global instance for easy access
prompt_manager = PromptManager()
