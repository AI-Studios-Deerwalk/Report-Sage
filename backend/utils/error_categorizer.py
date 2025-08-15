import re
from typing import Dict, List, Tuple

class ErrorCategorizer:
    """Categorizes TU format violations into 3 phases"""
    
    # Phase 1: Structure Errors (Critical formatting issues)
    STRUCTURE_ERRORS = [
        r'missing.*section.*title',
        r'incorrect.*page.*numbering',
        r'page.*numbering.*should.*be',
        r'flow.*problem',
        r'alignment.*problem',
        r'not.*aligned.*properly',
        r'wrong.*position',
        r'incorrect.*order',
        r'missing.*table.*of.*contents',
        r'font.*should.*be.*times.*new.*roman',
        r'margin.*should.*be',
        r'spacing.*should.*be.*1\.5',
        r'line.*spacing.*incorrect',
        r'heading.*format.*incorrect',
        r'figure.*caption.*position',
        r'table.*caption.*position',
        r'page.*size.*should.*be.*A4',
        r'citation.*format.*incorrect',
        r'reference.*format.*incorrect'
    ]
    
    # Phase 2: Grammar and Spelling Errors
    GRAMMAR_SPELLING_ERRORS = [
        r'grammar.*mistake',
        r'grammatical.*error',
        r'spelling.*error',
        r'spelling.*mistake',
        r'grammar.*error',
        r'incorrect.*grammar',
        r'poor.*grammar',
        r'grammatical.*issue',
        r'spelling.*issue',
        r'typo',
        r'misspelled',
        r'grammar.*should.*be',
        r'sentence.*structure',
        r'punctuation.*error',
        r'punctuation.*mistake'
    ]
    
    # Phase 3: Content Enhancement Suggestions
    CONTENT_ENHANCEMENT = [
        r'consider.*adding',
        r'you.*could.*write',
        r'you.*can.*write',
        r'use.*more.*formal',
        r'use.*bullet.*points',
        r'add.*more.*details',
        r'expand.*this.*section',
        r'include.*more.*information',
        r'provide.*more.*context',
        r'elaborate.*on',
        r'enhance.*the.*content',
        r'improve.*the.*description',
        r'add.*examples',
        r'include.*diagrams',
        r'add.*figures',
        r'consider.*including',
        r'suggestion.*to.*improve',
        r'idea.*for.*enhancement',
        r'recommendation.*for.*better',
        r'could.*be.*improved.*by'
    ]
    
    @classmethod
    def categorize_error(cls, error_text: str, page: int) -> Tuple[str, str]:
        """
        Categorize an error into one of the 3 phases
        
        Returns:
            Tuple[str, str]: (phase, category_description)
        """
        error_lower = error_text.lower()
        
        # Check for Phase 1: Structure Errors
        for pattern in cls.STRUCTURE_ERRORS:
            if re.search(pattern, error_lower):
                return "structure", "Critical structure and formatting issues that need immediate attention"
        
        # Check for Phase 2: Grammar and Spelling Errors
        for pattern in cls.GRAMMAR_SPELLING_ERRORS:
            if re.search(pattern, error_lower):
                return "grammar", "Grammar and spelling errors that need correction"
        
        # Check for Phase 3: Content Enhancement
        for pattern in cls.CONTENT_ENHANCEMENT:
            if re.search(pattern, error_lower):
                return "enhancement", "Content improvement suggestions for better quality"
        
        # Default to structure error if no specific pattern matches
        return "structure", "Critical structure and formatting issues that need immediate attention"
    
    @classmethod
    def categorize_all_errors(cls, errors: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Categorize all errors into the 3 phases
        
        Args:
            errors: List of error dictionaries with 'text' and 'page' keys
            
        Returns:
            Dict with categorized errors
        """
        categorized = {
            "structure": [],
            "grammar": [],
            "enhancement": []
        }
        
        for error in errors:
            phase, description = cls.categorize_error(error['text'], error['page'])
            categorized[phase].append({
                'text': error['text'],
                'page': error['page'],
                'phase': phase,
                'description': description
            })
        
        return categorized
    
    @classmethod
    def get_phase_summary(cls, categorized_errors: Dict[str, List[Dict]]) -> Dict[str, Dict]:
        """
        Generate summary statistics for each phase
        
        Returns:
            Dict with phase summaries
        """
        summary = {}
        
        for phase, errors in categorized_errors.items():
            if phase == "structure":
                icon = "🚨"
                color = "#dc3545"
                title = "Structure Errors"
            elif phase == "grammar":
                icon = "⚠️"
                color = "#ffc107"
                title = "Grammar & Spelling Errors"
            else:  # enhancement
                icon = "💡"
                color = "#17a2b8"
                title = "Content Enhancement Suggestions"
            
            summary[phase] = {
                'count': len(errors),
                'icon': icon,
                'color': color,
                'title': title,
                'description': errors[0]['description'] if errors else ""
            }
        
        return summary
