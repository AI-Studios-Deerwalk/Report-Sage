# 3-Phase Error Categorization System

## Overview

The TU Report Analyzer now categorizes errors into 3 distinct phases to help users prioritize their fixes and understand the severity of each issue.

## Phase Breakdown

### 🚨 Phase 1: Structure Errors (Critical)
**Priority: HIGH - Fix First**

These are critical formatting and structural issues that must be addressed immediately:

- **Page numbering issues** (incorrect sequence, wrong format)
- **Font violations** (not Times New Roman 12pt)
- **Margin and spacing problems** (incorrect margins, line spacing not 1.5)
- **Missing section titles** in table of contents
- **Wrong positioning** of elements (figures, tables, sections)
- **Flow problems** (sections in wrong order)
- **Alignment issues** (text not properly aligned)
- **Citation format errors** (not IEEE standard)
- **Page size violations** (not A4)

**Examples:**
- "Missing section title 'Introduction' in the table of contents"
- "Incorrect page numbering (should be 4, not 3)"
- "Flow problem; the abstract is placed after the table of contents"

### ⚠️ Phase 2: Grammar & Spelling Errors
**Priority: MEDIUM - Fix Second**

These are language-related issues that affect readability and professionalism:

- **Grammar mistakes** in sentences
- **Spelling errors** in words
- **Punctuation issues**
- **Poor sentence structure**
- **Grammatical inconsistencies**

**Examples:**
- "Grammar mistake in the sentence 'I have thoroughly reviewed and acknowledged...'"
- "Spelling error: 'recieve' should be 'receive'"
- "Poor sentence structure in paragraph 3"

### 💡 Phase 3: Content Enhancement Suggestions
**Priority: LOW - Consider for Improvement**

These are suggestions to improve content quality and presentation:

- **Content improvement ideas**
- **Formatting suggestions** (bullet points, better organization)
- **Additional information recommendations**
- **Better phrasing suggestions**
- **Enhancement opportunities**

**Examples:**
- "Consider adding a section on future work or potential applications"
- "Use bullet points to list the contents of each table"
- "Use a more formal greeting in the acknowledgement section"

## Implementation Details

### Backend Changes

1. **New Error Categorizer** (`backend/utils/error_categorizer.py`):
   - Uses regex patterns to identify error types
   - Categorizes errors into 3 phases
   - Provides summary statistics

2. **Enhanced Analysis** (`backend/main.py`):
   - Modified prompt to identify different error categories
   - Integrated categorization into analysis pipeline
   - Returns categorized results with phase summaries

### Frontend Changes

1. **Updated Display** (`frontend/components/ResultDisplay.js`):
   - Shows phase breakdown summary
   - Color-coded sections for each phase
   - Clear visual hierarchy

## Usage

### For Users

1. **Upload PDF** and run analysis
2. **Review Phase Summary** to see issue distribution
3. **Address Phase 1 issues first** (critical structure problems)
4. **Fix Phase 2 grammar/spelling errors**
5. **Consider Phase 3 suggestions** for content improvement

### For Developers

```python
from backend.utils.error_categorizer import ErrorCategorizer

# Categorize a single error
phase, description = ErrorCategorizer.categorize_error(error_text, page_number)

# Categorize multiple errors
categorized = ErrorCategorizer.categorize_all_errors(error_list)

# Get phase summary
summary = ErrorCategorizer.get_phase_summary(categorized)
```

## Benefits

1. **Prioritized Fixing**: Users know which issues to address first
2. **Clear Understanding**: Each phase has a specific purpose and priority
3. **Better Organization**: Errors are grouped logically
4. **Improved UX**: Visual distinction between critical and enhancement issues
5. **Actionable Feedback**: Clear guidance on what needs immediate attention

## Future Enhancements

- Add severity levels within each phase
- Include fix suggestions for each error type
- Add progress tracking for each phase
- Implement phase-specific export options
