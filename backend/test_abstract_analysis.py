#!/usr/bin/env python3
"""
Test script for abstract analysis functionality
"""

import asyncio
from prompt import prompt_manager
from prompt.result_formatter import ResultFormatter

# Sample abstract text for testing
SAMPLE_ABSTRACT = """
This research addresses the growing need for efficient document analysis systems in academic institutions. 
The study proposes a novel approach using artificial intelligence to automatically extract and analyze 
abstracts from research papers. We implemented a machine learning model trained on a dataset of 10,000 
academic abstracts and evaluated its performance using standard metrics. Our results show that the system 
achieves 85% accuracy in abstract extraction and provides comprehensive analysis of research components. 
The findings demonstrate significant improvements over existing manual review processes, reducing analysis 
time by 70% while maintaining high quality standards. This work contributes to the field of automated 
academic document processing and has practical applications in research institutions worldwide.
"""

async def test_abstract_analysis():
    """Test the abstract analysis functionality"""
    print("Testing Abstract Analysis System")
    print("=" * 50)
    
    # Test 1: Extract abstract from sample text
    print("\n1. Testing abstract extraction...")
    abstract = prompt_manager.extract_abstract_from_pdf_content(SAMPLE_ABSTRACT)
    print(f"Extracted abstract length: {len(abstract)} characters")
    print(f"Abstract preview: {abstract[:200]}...")
    
    # Test 2: Generate analysis prompt
    print("\n2. Testing prompt generation...")
    analysis_prompt = prompt_manager.get_abstract_analysis_prompt(abstract)
    print(f"Generated prompt length: {len(analysis_prompt)} characters")
    print(f"Prompt preview: {analysis_prompt[:300]}...")
    
    # Test 3: Simulate analysis result parsing
    print("\n3. Testing result parsing...")
    
    # Simulate AI response
    simulated_response = """
**Motivation / Problem Statement**: PRESENT
- The abstract clearly explains the research problem and its importance
- Addresses the gap in efficient document analysis systems
- Context and significance are well stated

**Methods / Procedure / Approach**: PRESENT
- Describes the AI/ML approach clearly
- Mentions dataset size and evaluation metrics
- Methodology is appropriate and well-described

**Results / Findings / Product**: PRESENT
- Clearly presents key findings (85% accuracy, 70% time reduction)
- Results are specific and measurable
- Outcomes are well quantified

**Conclusion / Implications**: PARTIALLY PRESENT
- Explains broader significance and applications
- Mentions contributions to the field
- Could be more detailed about future directions

**Overall Evaluation**:
- Strong abstract with clear structure
- Good balance of technical detail and accessibility
- Minor improvements needed in conclusion section
"""
    
    # Parse the simulated response
    formatter = ResultFormatter()
    parsed_results = formatter.parse_abstract_analysis_result(simulated_response)
    summary = formatter.create_abstract_analysis_summary(parsed_results)
    
    print("Parsed Results:")
    for section, data in parsed_results.items():
        if section != "overall_evaluation":
            print(f"  {section}: {data['status']}")
        else:
            print(f"  {section}: {data[:100]}...")
    
    print(f"\nSummary:")
    print(f"  Score: {summary['summary']['score']}%")
    print(f"  Quality: {summary['summary']['quality']}")
    print(f"  Present: {summary['summary']['present']}")
    print(f"  Partially Present: {summary['summary']['partially_present']}")
    print(f"  Missing: {summary['summary']['missing']}")
    
    print("\n✅ All tests completed successfully!")

if __name__ == "__main__":
    asyncio.run(test_abstract_analysis())

