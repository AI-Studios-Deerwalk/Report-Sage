import re
from typing import List, Dict, Any

class PromptManager:
    """Manages prompts and text extraction for document analysis"""
    
    def __init__(self):
        self.structure_keywords = [
            "structure", "format", "layout", "organization", "sections",
            "heading", "subheading", "outline", "framework", "arrangement",
            "order", "sequence", "hierarchy", "flow", "coherence"
        ]
        
        self.grammar_keywords = [
            "grammar", "syntax", "punctuation", "spelling", "tense",
            "agreement", "conjugation", "sentence", "clause", "phrase",
            "verb", "noun", "adjective", "adverb", "preposition",
            "conjunction", "article", "pronoun", "capitalization"
        ]
    
    def get_structure_keywords(self) -> List[str]:
        """Get keywords for structure-related errors"""
        return self.structure_keywords
    
    def get_grammar_keywords(self) -> List[str]:
        """Get keywords for grammar-related errors"""
        return self.grammar_keywords
    
    def extract_abstract_from_pdf_content(self, content: str) -> str:
        """Extract abstract section from PDF content with improved patterns"""
        # Clean the content first
        content = re.sub(r'\s+', ' ', content)  # Normalize whitespace
        content = re.sub(r'\n+', ' ', content)  # Replace newlines with spaces
        
        # Look for common abstract patterns with more comprehensive matching
        abstract_patterns = [
            # Standard abstract patterns
            r'(?i)abstract\s*:?\s*(.*?)(?=\s*(?:introduction|1\.|chapter|section|keywords|key\s+words|acknowledgment|references))',
            r'(?i)abstract\s*:?\s*(.*?)(?=\s*\d+\.)',
            r'(?i)abstract\s*:?\s*(.*?)(?=\s*[A-Z][a-z]+\s*:)',
            r'(?i)abstract\s*:?\s*(.*?)(?=\s*Keywords)',
            r'(?i)abstract\s*:?\s*(.*?)(?=\s*Key\s+Words)',
            
            # Alternative patterns
            r'(?i)summary\s*:?\s*(.*?)(?=\s*(?:introduction|1\.|chapter|section|keywords|key\s+words))',
            r'(?i)executive\s+summary\s*:?\s*(.*?)(?=\s*(?:introduction|1\.|chapter|section))',
            
            # Pattern for abstracts that start immediately after "Abstract"
            r'(?i)abstract\s*:?\s*([^.]+\.[^.]+\.[^.]+\.[^.]+\.[^.]+\..*)',
        ]
        
        for pattern in abstract_patterns:
            match = re.search(pattern, content, re.DOTALL | re.MULTILINE)
            if match:
                abstract = match.group(1).strip()
                # Clean up the abstract
                abstract = re.sub(r'\s+', ' ', abstract)  # Normalize whitespace
                abstract = re.sub(r'\n+', ' ', abstract)  # Replace newlines with spaces
                # Remove common artifacts
                abstract = re.sub(r'^\s*[^\w\s]*\s*', '', abstract)  # Remove leading non-word chars
                abstract = re.sub(r'\s*[^\w\s]*\s*$', '', abstract)  # Remove trailing non-word chars
                
                if len(abstract) > 100:  # Ensure it's substantial (increased threshold)
                    return abstract
        
        # If no pattern matches, try to find text between common markers
        fallback_patterns = [
            r'(?i)(?:abstract|summary)\s*:?\s*(.*?)(?=\s*(?:introduction|1\.|chapter|section))',
            r'(?i)(?:abstract|summary)\s*:?\s*(.*?)(?=\s*\d+\.)',
            r'(?i)(?:abstract|summary)\s*:?\s*(.*?)(?=\s*[A-Z][a-z]+\s*:)',
        ]
        
        for pattern in fallback_patterns:
            match = re.search(pattern, content, re.DOTALL | re.MULTILINE)
            if match:
                abstract = match.group(1).strip()
                abstract = re.sub(r'\s+', ' ', abstract)
                abstract = re.sub(r'\n+', ' ', abstract)
                abstract = re.sub(r'^\s*[^\w\s]*\s*', '', abstract)
                abstract = re.sub(r'\s*[^\w\s]*\s*$', '', abstract)
                if len(abstract) > 100:
                    return abstract
        
        # If still no match, try to find the first substantial paragraph
        paragraphs = re.split(r'\.\s+', content)
        for i, para in enumerate(paragraphs):
            para = para.strip()
            if len(para) > 150 and i < 3:  # Look at first 3 paragraphs
                # Check if it looks like an abstract (contains common abstract words)
                abstract_indicators = ['project', 'study', 'research', 'method', 'result', 'conclusion', 'objective', 'aim', 'purpose']
                if any(word in para.lower() for word in abstract_indicators):
                    return para + '.'
        
        # Last resort: return the first few sentences
        sentences = re.split(r'[.!?]+', content)
        if sentences:
            first_sentences = ' '.join(sentences[:5]).strip()  # Take more sentences
            if len(first_sentences) > 100:
                return first_sentences
        
        return ""
    
    def get_abstract_analysis_prompt(self, abstract: str) -> str:
        """Generate analysis prompt for abstract evaluation"""
        return f"""
You are an expert academic reviewer specializing in technical university report evaluation. Analyze the following abstract to determine if each required section is PRESENT or MISSING, and provide detailed feedback.

EVALUATION CRITERIA - Check if these elements are PRESENT or MISSING:

1. MOTIVATION: Look for clear problem statement, motivation, research gap, or objectives
   - Keywords to look for: "problem", "challenge", "issue", "aim", "objective", "purpose", "motivation", "need", "gap"
   - Must clearly state WHAT problem is being solved and WHY

2. METHODS: Look for research methodology, approach, techniques, or procedures used
   - Keywords to look for: "method", "approach", "technique", "algorithm", "model", "framework", "using", "implemented", "developed", "applied"
   - Must describe HOW the research was conducted

3. RESULTS: Look for findings, outcomes, achievements, or performance metrics
   - Keywords to look for: "result", "finding", "outcome", "achieved", "obtained", "performance", "accuracy", "efficiency", "improvement", "success"
   - Must describe WHAT was accomplished or discovered

4. CONCLUSION: Look for implications, contributions, or future work
   - Keywords to look for: "conclusion", "implication", "contribution", "benefit", "impact", "significance", "future", "recommendation"
   - Must describe the SIGNIFICANCE or IMPACT of the work

ANALYSIS INSTRUCTIONS:
- Read the abstract carefully and thoroughly
- Check if each section contains the required elements
- If elements are present but unclear or incomplete, mark as PRESENT but provide improvement suggestions
- If elements are completely missing, mark as MISSING
- Provide specific feedback about what is present, what is missing, and how to improve
- DO NOT include any overall evaluation or summary - focus only on the four specific sections
- DO NOT mention "Overall" or provide general assessments

RESPONSE FORMAT (use plain text, NOT Markdown):
MOTIVATION: [PRESENT/MISSING] - [Detailed analysis of problem statement, objectives, and motivation. Specify what is present and what is missing]
METHODS: [PRESENT/MISSING] - [Detailed analysis of methodology description. Specify what methods are mentioned and what details are missing]
RESULTS: [PRESENT/MISSING] - [Detailed analysis of findings and outcomes. Specify what results are presented and what is missing]
CONCLUSION: [PRESENT/MISSING] - [Detailed analysis of conclusions and implications. Specify what conclusions are drawn and what is missing]

ABSTRACT TO ANALYZE:
{abstract}

Please provide a thorough and detailed analysis focusing on academic standards and technical report requirements.
"""
