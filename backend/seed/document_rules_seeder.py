"""
Document Rules Seeder for TU BScCSIT
Creates predefined document rules based on the TU BScCSIT template structure
"""

import asyncio
import logging
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

import sys
import os

# Add the backend root to the Python path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_root)

from database.connection import db_manager
from models.document_rules import DocumentRule
from schemas.document_rules import DocumentRuleCreate

logger = logging.getLogger(__name__)


class DocumentRulesSeeder:
    """Seeder class for inserting predefined document rules for TU BScCSIT"""

    def __init__(self):
        # TU BScCSIT document rules with chunk_id matching section_id
        self.document_rules: List[DocumentRuleCreate] = [
            # Chapter 0: Front Matter
            DocumentRuleCreate(
                chunk_id="0",
                university="TU",
                degree_program="BScCSIT",
                chapter="0",
                section="0",
                subsection=None,
                title="Chapter 0: Front Matter",
                rules="Front matter includes title page, supervisor's recommendation, student's declaration, letter of approval, acknowledgement, abstract, table of contents, list of figures, list of tables, and list of abbreviations. All must follow TU BScCSIT format exactly.",
                required_elements=[
                    "Title page with project title in BLOCK LETTERS",
                    "Supervisor's recommendation letter",
                    "Student's declaration",
                    "Letter of approval from campus chief",
                    "Acknowledgement section",
                    "Abstract with 4 main parts (motivation, methods, results, conclusion)",
                    "Table of contents (auto-generated)",
                    "List of figures (auto-generated)",
                    "List of tables (auto-generated)",
                    "List of abbreviations (alphabetical order)"
                ],
                quality_criteria=[
                    "All front matter sections must be present",
                    "Abstract must be 150-300 words",
                    "Keywords must be 4-8 words separated by semicolons",
                    "Table of contents must be auto-generated in MS Word",
                    "All declarations must be properly signed and dated"
                ],
                examples=[
                    "Title: 'DEVELOPMENT OF A WEB-BASED STUDENT MANAGEMENT SYSTEM'",
                    "Abstract structure: Motivation → Methods → Results → Conclusion",
                    "Keywords: 'Student Management; Web Application; Database; PHP; MySQL'"
                ],
                common_mistakes=[
                    "Missing supervisor's recommendation",
                    "Abstract too long or too short",
                    "Manual table of contents instead of auto-generated",
                    "Missing student declaration signature",
                    "Incorrect university/degree program names"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="0.1",
                university="TU",
                degree_program="BScCSIT",
                chapter="0",
                section="0.1",
                subsection=None,
                title="0.1 Title Page and Declarations",
                rules="Title page must contain project title in BLOCK LETTERS, university name, degree program, student details, supervisor details, and submission date. All declarations must be properly signed and dated.",
                required_elements=[
                    "Project title in BLOCK LETTERS",
                    "University and degree program names",
                    "Student name and roll number",
                    "Supervisor name and designation",
                    "Submission date",
                    "Student declaration with signature",
                    "Supervisor recommendation with signature"
                ],
                quality_criteria=[
                    "Title in BLOCK LETTERS format",
                    "Complete student and supervisor information",
                    "Proper signatures and dates",
                    "Correct university/degree program names"
                ],
                examples=[
                    "Title: 'DEVELOPMENT OF A WEB-BASED STUDENT MANAGEMENT SYSTEM'",
                    "Declaration: 'I hereby declare that this project work is my own original work...'"
                ],
                common_mistakes=[
                    "Title not in BLOCK LETTERS",
                    "Missing signatures",
                    "Incomplete information",
                    "Wrong university names"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="0.2",
                university="TU",
                degree_program="BScCSIT",
                chapter="0",
                section="0.2",
                subsection=None,
                title="0.2 Abstract and Keywords",
                rules="Abstract must be 150-300 words with four main parts: motivation, methods, results, and conclusion. Keywords should be 4-8 words separated by semicolons.",
                required_elements=[
                    "Abstract with 4 main parts",
                    "Motivation section",
                    "Methods section",
                    "Results section",
                    "Conclusion section",
                    "Keywords (4-8 words)",
                    "Word count (150-300)"
                ],
                quality_criteria=[
                    "Clear four-part structure",
                    "Appropriate word count",
                    "Relevant keywords",
                    "Concise but complete information"
                ],
                examples=[
                    "Motivation: 'Current manual system is inefficient and error-prone'",
                    "Methods: 'Agile development methodology with user-centered design'",
                    "Results: 'System reduces processing time by 85%'",
                    "Keywords: 'Student Management; Web Application; Database; PHP; MySQL'"
                ],
                common_mistakes=[
                    "Abstract too long or too short",
                    "Missing parts of structure",
                    "Too many or too few keywords",
                    "Vague or unclear content"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="0.3",
                university="TU",
                degree_program="BScCSIT",
                chapter="0",
                section="0.3",
                subsection=None,
                title="0.3 Table of Contents and Lists",
                rules="Table of contents must be auto-generated in MS Word. Include list of figures, list of tables, and list of abbreviations in alphabetical order.",
                required_elements=[
                    "Auto-generated table of contents",
                    "List of figures with page numbers",
                    "List of tables with page numbers",
                    "List of abbreviations (alphabetical)",
                    "Proper page numbering"
                ],
                quality_criteria=[
                    "Auto-generated TOC",
                    "Complete lists with page numbers",
                    "Alphabetical abbreviation order",
                    "Accurate page references"
                ],
                examples=[
                    "TOC: Auto-generated with proper heading levels",
                    "Figures: 'Figure 1.1: System Architecture (Page 15)'",
                    "Abbreviations: 'API - Application Programming Interface'"
                ],
                common_mistakes=[
                    "Manual table of contents",
                    "Missing page numbers",
                    "Incomplete lists",
                    "Poor alphabetical ordering"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="0.4",
                university="TU",
                degree_program="BScCSIT",
                chapter="0",
                section="0.4",
                subsection=None,
                title="0.4 Acknowledgements and Approval",
                rules="Acknowledgement section should thank relevant individuals and organizations. Approval letters must be properly formatted and signed by appropriate authorities.",
                required_elements=[
                    "Acknowledgement section",
                    "Thanks to supervisor and committee",
                    "Thanks to family and friends",
                    "Letter of approval from campus chief",
                    "Proper signatures and dates"
                ],
                quality_criteria=[
                    "Sincere acknowledgements",
                    "Complete approval documentation",
                    "Proper authority signatures",
                    "Professional tone"
                ],
                examples=[
                    "Acknowledgement: 'I would like to express my sincere gratitude to my supervisor...'",
                    "Approval: 'This project is approved for submission by Campus Chief'"
                ],
                common_mistakes=[
                    "Generic acknowledgements",
                    "Missing approval letters",
                    "Incomplete signatures",
                    "Unprofessional tone"
                ],
                priority=2,
                created_by="system"
            ),

            # Chapter 1: Introduction
            DocumentRuleCreate(
                chunk_id="1",
                university="TU",
                degree_program="BScCSIT",
                chapter="1",
                section="1",
                subsection=None,
                title="Chapter 1: Introduction",
                rules="Chapter 1 provides an overview of the project, including background, problem statement, objectives, scope, methodology, and report organization.",
                required_elements=[
                    "Introduction and background",
                    "Problem statement",
                    "Objectives (main and specific)",
                    "Scope and limitations",
                    "Development methodology",
                    "Report organization"
                ],
                quality_criteria=[
                    "Clear problem statement with 3 elements (problem, method, purpose)",
                    "Objectives must be specific and measurable",
                    "Scope should be narrow and focused",
                    "Methodology must be clearly explained",
                    "Report organization should outline all chapters"
                ],
                examples=[
                    "Problem: 'Current manual system takes 2 hours vs. automated system takes 5 minutes'",
                    "Objective: 'To develop a web-based system that reduces processing time by 90%'",
                    "Scope: 'Limited to student registration and grade management'"
                ],
                common_mistakes=[
                    "Too broad scope",
                    "Vague objectives",
                    "Missing problem statement",
                    "Incomplete methodology description",
                    "Poor report organization outline"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="1.1",
                university="TU",
                degree_program="BScCSIT",
                chapter="1",
                section="1.1",
                subsection=None,
                title="1.1 Introduction",
                rules="The introduction section gives an overview of the main points and awakens reader's interest. It should be rewritten last to ensure connection with conclusion.",
                required_elements=[
                    "Background for theme choice",
                    "Problem statement discussion",
                    "Project objectives",
                    "Work scope",
                    "Schematic outline of remaining report"
                ],
                quality_criteria=[
                    "Clear background explanation",
                    "Well-defined problem statement",
                    "Specific objectives",
                    "Realistic scope",
                    "Logical report outline"
                ],
                examples=[
                    "Background: 'With increasing student enrollment, manual management becomes inefficient'",
                    "Outline: 'Chapter 2 covers literature review, Chapter 3 covers system analysis...'"
                ],
                common_mistakes=[
                    "Too much technical detail too early",
                    "Missing problem context",
                    "Unclear objectives",
                    "Overly ambitious scope",
                    "Incomplete report outline"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="1.2",
                university="TU",
                degree_program="BScCSIT",
                chapter="1",
                section="1.2",
                subsection=None,
                title="1.2 Problem Statement",
                rules="Problem statement is a short description of issues that need addressing. It should have three elements: the problem itself, method of solving, and purpose/objective.",
                required_elements=[
                    "Clear problem description",
                    "Contextual detail establishing importance",
                    "Method of solving the problem",
                    "Purpose and objective statement"
                ],
                quality_criteria=[
                    "Problem stated clearly with context",
                    "Evidence supporting problem existence",
                    "Solution method clearly stated",
                    "Purpose well-defined"
                ],
                examples=[
                    "Problem: 'Manual grade calculation takes 3 hours per class of 50 students'",
                    "Method: 'Develop automated grade calculation system'",
                    "Purpose: 'Reduce processing time to 10 minutes per class'"
                ],
                common_mistakes=[
                    "Vague problem description",
                    "Missing context",
                    "No solution method",
                    "Unclear purpose",
                    "Problem not well-justified"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="1.3",
                university="TU",
                degree_program="BScCSIT",
                chapter="1",
                section="1.3",
                subsection=None,
                title="1.3 Objectives",
                rules="Objectives are claims of one or two sentences outlining the problem addressed. Can be formulated as main statements with specific sub-statements or as testable hypotheses.",
                required_elements=[
                    "Main objective statement",
                    "Specific sub-objectives",
                    "Measurable outcomes",
                    "Clear problem focus"
                ],
                quality_criteria=[
                    "Objectives are specific and measurable",
                    "Clear relationship to problem",
                    "Realistic and achievable",
                    "Well-structured format"
                ],
                examples=[
                    "Main: 'To develop a web-based student management system'",
                    "Sub: 'To implement user authentication and authorization'",
                    "Sub: 'To create grade calculation and reporting module'"
                ],
                common_mistakes=[
                    "Vague objectives",
                    "Too many objectives",
                    "Unrealistic goals",
                    "Poor structure",
                    "Missing measurability"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="1.4",
                university="TU",
                degree_program="BScCSIT",
                chapter="1",
                section="1.4",
                subsection=None,
                title="1.4 Scope and Limitation",
                rules="Scope defines the study area and amount of information included. Narrower scope allows deeper study and more interesting results.",
                required_elements=[
                    "Study area definition",
                    "Information boundaries",
                    "Limitations clearly stated",
                    "Scope justification"
                ],
                quality_criteria=[
                    "Clear scope boundaries",
                    "Realistic limitations",
                    "Justified scope choices",
                    "Manageable project size"
                ],
                examples=[
                    "Scope: 'Student registration and grade management for computer science department'",
                    "Limitation: 'Only covers undergraduate students, not graduate programs'"
                ],
                common_mistakes=[
                    "Too broad scope",
                    "Unclear boundaries",
                    "Missing limitations",
                    "Overly ambitious goals",
                    "Poor scope justification"
                ],
                priority=2,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="1.5",
                university="TU",
                degree_program="BScCSIT",
                chapter="1",
                section="1.5",
                subsection=None,
                title="1.5 Development Methodology",
                rules="Explain the software development methodology used to develop the project (e.g., Waterfall, Agile, Spiral, etc.).",
                required_elements=[
                    "Methodology name and description",
                    "Development phases",
                    "Process flow",
                    "Methodology justification"
                ],
                quality_criteria=[
                    "Clear methodology explanation",
                    "Appropriate for project type",
                    "Well-defined phases",
                    "Logical process flow"
                ],
                examples=[
                    "Agile methodology with 2-week sprints",
                    "Waterfall: Requirements → Design → Implementation → Testing → Deployment"
                ],
                common_mistakes=[
                    "Unclear methodology",
                    "Inappropriate choice",
                    "Missing phases",
                    "Poor process description",
                    "No justification"
                ],
                priority=2,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="1.6",
                university="TU",
                degree_program="BScCSIT",
                chapter="1",
                section="1.6",
                subsection=None,
                title="1.6 Report Organization",
                rules="The outline gives an overview of the main points and clarifies the report structure. Helps find correct focus for the work.",
                required_elements=[
                    "Chapter overview",
                    "Section descriptions",
                    "Logical flow",
                    "Content focus areas"
                ],
                quality_criteria=[
                    "Clear chapter structure",
                    "Logical content flow",
                    "Appropriate focus",
                    "Complete coverage"
                ],
                examples=[
                    "Chapter 2: Literature Review and Background Study",
                    "Chapter 3: System Analysis and Requirements",
                    "Chapter 4: System Design and Architecture"
                ],
                common_mistakes=[
                    "Unclear structure",
                    "Missing chapters",
                    "Poor flow",
                    "Incomplete coverage",
                    "Unfocused content"
                ],
                priority=2,
                created_by="system"
            ),

            # Chapter 2: Background Study and Literature Review
            DocumentRuleCreate(
                chunk_id="2",
                university="TU",
                degree_program="BScCSIT",
                chapter="2",
                section="2",
                subsection=None,
                title="Chapter 2: Background Study and Literature Review",
                rules="Chapter 2 provides fundamental theories, concepts, and literature review related to the project. Should assess sources and evaluate relevance.",
                required_elements=[
                    "Background study",
                    "Literature review",
                    "Current system analysis",
                    "Current system problems"
                ],
                quality_criteria=[
                    "Comprehensive background coverage",
                    "Critical literature evaluation",
                    "Current system understanding",
                    "Problem identification"
                ],
                examples=[
                    "Background: 'Database management systems and web technologies'",
                    "Literature: 'Analysis of 15 recent papers on student management systems'"
                ],
                common_mistakes=[
                    "Superficial background",
                    "Poor literature analysis",
                    "Missing current systems",
                    "Weak problem identification",
                    "Insufficient sources"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="2.1",
                university="TU",
                degree_program="BScCSIT",
                chapter="2",
                section="2.1",
                subsection=None,
                title="2.1 Background Study",
                rules="Describe fundamental theories, general concepts, and terminologies related to the project. Provide general information and emphasize main study aims.",
                required_elements=[
                    "Fundamental theories",
                    "General concepts",
                    "Key terminologies",
                    "Study aims emphasis"
                ],
                quality_criteria=[
                    "Clear theory explanation",
                    "Relevant concepts",
                    "Well-defined terms",
                    "Focused on project needs"
                ],
                examples=[
                    "Theory: 'Relational database normalization principles'",
                    "Concept: 'Client-server architecture patterns'",
                    "Terminology: 'API, REST, CRUD operations'"
                ],
                common_mistakes=[
                    "Too much theory",
                    "Irrelevant concepts",
                    "Undefined terms",
                    "Unfocused content",
                    "Excessive detail"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="2.2",
                university="TU",
                degree_program="BScCSIT",
                chapter="2",
                section="2.2",
                subsection=None,
                title="2.2 Literature Review",
                rules="Literature review combines summary and synthesis. Assess how sources relate to each other, group by theme/methodology, and critically evaluate research.",
                required_elements=[
                    "Source assessment",
                    "Theme grouping",
                    "Research summary",
                    "Critical evaluation"
                ],
                quality_criteria=[
                    "Comprehensive source coverage",
                    "Logical grouping",
                    "Clear summaries",
                    "Critical analysis"
                ],
                examples=[
                    "Grouped by: 'Web-based systems', 'Database design', 'User interface'",
                    "Evaluation: 'Method A shows 30% better performance than Method B'"
                ],
                common_mistakes=[
                    "Superficial review",
                    "Poor grouping",
                    "No critical analysis",
                    "Insufficient sources",
                    "Weak summaries"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="2.3",
                university="TU",
                degree_program="BScCSIT",
                chapter="2",
                section="2.3",
                subsection=None,
                title="2.3 Current System",
                rules="Unless completely new innovation, mention similar software products and how they inspire your project. Identify what parts you plan to include.",
                required_elements=[
                    "Similar products identification",
                    "Inspiration sources",
                    "Features to include",
                    "System comparison"
                ],
                quality_criteria=[
                    "Relevant product analysis",
                    "Clear inspiration",
                    "Justified feature selection",
                    "Fair comparison"
                ],
                examples=[
                    "Product: 'Student Management System by Company X'",
                    "Inspiration: 'User-friendly interface design'",
                    "Features: 'Grade calculation, attendance tracking'"
                ],
                common_mistakes=[
                    "No current systems",
                    "Poor comparison",
                    "Unclear inspiration",
                    "Missing features",
                    "Biased analysis"
                ],
                priority=2,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="2.4",
                university="TU",
                degree_program="BScCSIT",
                chapter="2",
                section="2.4",
                subsection=None,
                title="2.4 Problems with Current System",
                rules="Identify genuine problems in similar software products that you plan to solve. Provide sufficient and valid reasons with literature/survey support.",
                required_elements=[
                    "Problem identification",
                    "Evidence support",
                    "Solution approach",
                    "Justification"
                ],
                quality_criteria=[
                    "Genuine problems",
                    "Strong evidence",
                    "Clear solutions",
                    "Valid justification"
                ],
                examples=[
                    "Problem: 'Slow response time (>5 seconds)'",
                    "Evidence: 'User survey shows 80% dissatisfaction'",
                    "Solution: 'Implement caching and optimization'"
                ],
                common_mistakes=[
                    "Invented problems",
                    "Weak evidence",
                    "Unclear solutions",
                    "Poor justification",
                    "Subjective complaints"
                ],
                priority=1,
                created_by="system"
            ),

            # Chapter 3: System Analysis
            DocumentRuleCreate(
                chunk_id="3",
                university="TU",
                degree_program="BScCSIT",
                chapter="3",
                section="3",
                subsection=None,
                title="Chapter 3: System Analysis",
                rules="Chapter 3 covers requirement analysis, feasibility analysis, and system analysis using appropriate modeling techniques (structured or object-oriented).",
                required_elements=[
                    "Requirement analysis",
                    "Feasibility analysis",
                    "System analysis models",
                    "Data and process modeling"
                ],
                quality_criteria=[
                    "Complete requirements",
                    "Thorough feasibility",
                    "Appropriate models",
                    "Clear analysis"
                ],
                examples=[
                    "Models: 'ER diagrams, DFDs, Class diagrams'",
                    "Feasibility: 'Technical, operational, economic, schedule'"
                ],
                common_mistakes=[
                    "Incomplete requirements",
                    "Missing feasibility",
                    "Poor models",
                    "Unclear analysis",
                    "Inappropriate approach"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="3.1",
                university="TU",
                degree_program="BScCSIT",
                chapter="3",
                section="3.1",
                subsection=None,
                title="3.1 Requirement Analysis",
                rules="Requirements describe what the system should do, constraints, and performance criteria. Include functional and non-functional requirements.",
                required_elements=[
                    "System services description",
                    "Operation constraints",
                    "Performance criteria",
                    "Requirement elicitation methods"
                ],
                quality_criteria=[
                    "Clear requirements",
                    "Complete coverage",
                    "Measurable criteria",
                    "Valid elicitation"
                ],
                examples=[
                    "Elicitation: 'Interviews, workshops, prototyping'",
                    "Constraints: 'Response time < 3 seconds'"
                ],
                common_mistakes=[
                    "Vague requirements",
                    "Missing constraints",
                    "Unmeasurable criteria",
                    "Poor elicitation",
                    "Incomplete coverage"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="3.1.1",
                university="TU",
                degree_program="BScCSIT",
                chapter="3",
                section="3.1.1",
                subsection="1",
                title="3.1.1 Functional Requirements",
                rules="Functional requirements describe system functionality that can be modeled with use-cases. Usually employ the word 'shall' and need use case diagrams.",
                required_elements=[
                    "System functionality description",
                    "Use case modeling",
                    "User interaction requirements",
                    "Process requirements"
                ],
                quality_criteria=[
                    "Clear functionality",
                    "Complete use cases",
                    "User-focused requirements",
                    "Process clarity"
                ],
                examples=[
                    "Requirement: 'The user shall add new participant'",
                    "Use case: 'User authentication, data entry, report generation'"
                ],
                common_mistakes=[
                    "Unclear functionality",
                    "Missing use cases",
                    "Poor user focus",
                    "Incomplete processes",
                    "No modeling"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="3.1.2",
                university="TU",
                degree_program="BScCSIT",
                chapter="3",
                section="3.1.2",
                subsection="2",
                title="3.1.2 Non-Functional Requirements",
                rules="Non-functional requirements describe system properties like performance, usability, security, reliability, and scalability. Usually employ the word 'must'.",
                required_elements=[
                    "Performance requirements",
                    "Usability requirements",
                    "Security requirements",
                    "Reliability requirements"
                ],
                quality_criteria=[
                    "Measurable performance",
                    "Clear usability",
                    "Strong security",
                    "High reliability"
                ],
                examples=[
                    "Performance: 'Response time must be under 3 seconds'",
                    "Security: 'User authentication must be encrypted'",
                    "Reliability: 'System must be 99.9% available'"
                ],
                common_mistakes=[
                    "Unmeasurable requirements",
                    "Vague usability",
                    "Weak security",
                    "Poor reliability",
                    "Missing criteria"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="3.2",
                university="TU",
                degree_program="BScCSIT",
                chapter="3",
                section="3.2",
                subsection=None,
                title="3.2 Feasibility Analysis",
                rules="Feasibility analysis covers technical, operational, economic, and schedule feasibility to determine if the project is viable.",
                required_elements=[
                    "Technical feasibility",
                    "Operational feasibility",
                    "Economic feasibility",
                    "Schedule feasibility"
                ],
                quality_criteria=[
                    "Thorough analysis",
                    "Realistic assessment",
                    "Clear conclusions",
                    "Justified decisions"
                ],
                examples=[
                    "Technical: 'Available technology stack supports requirements'",
                    "Economic: 'Development cost: $5000, Annual savings: $2000'"
                ],
                common_mistakes=[
                    "Superficial analysis",
                    "Unrealistic assessment",
                    "Unclear conclusions",
                    "Poor justification",
                    "Missing feasibility types"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="3.3",
                university="TU",
                degree_program="BScCSIT",
                chapter="3",
                section="3.3",
                subsection=None,
                title="3.3 Analysis",
                rules="System analysis uses appropriate modeling techniques. Structured approach uses ER diagrams and DFDs. Object-oriented approach uses class, object, state, sequence, and activity diagrams.",
                required_elements=[
                    "Analysis approach selection",
                    "Appropriate models",
                    "Data modeling",
                    "Process modeling"
                ],
                quality_criteria=[
                    "Clear approach",
                    "Complete models",
                    "Accurate representation",
                    "Logical flow"
                ],
                examples=[
                    "Structured: 'ER diagrams for data, DFDs for processes'",
                    "OO: 'Class diagrams, sequence diagrams, state diagrams'"
                ],
                common_mistakes=[
                    "Unclear approach",
                    "Incomplete models",
                    "Poor representation",
                    "Logical errors",
                    "Missing modeling"
                ],
                priority=1,
                created_by="system"
            ),

            # Chapter 4: System Design
            DocumentRuleCreate(
                chunk_id="4",
                university="TU",
                degree_program="BScCSIT",
                chapter="4",
                section="4",
                subsection=None,
                title="Chapter 4: System Design",
                rules="Chapter 4 covers system design using the chosen approach (structured or object-oriented) and includes algorithm details.",
                required_elements=[
                    "System design approach",
                    "Design models",
                    "Algorithm details",
                    "Implementation planning"
                ],
                quality_criteria=[
                    "Clear design approach",
                    "Complete models",
                    "Detailed algorithms",
                    "Practical implementation"
                ],
                examples=[
                    "Design: 'Database schema, UI mockups, component diagrams'",
                    "Algorithms: 'Sorting, searching, data processing'"
                ],
                common_mistakes=[
                    "Unclear design",
                    "Incomplete models",
                    "Missing algorithms",
                    "Unrealistic implementation",
                    "Poor planning"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="4.1",
                university="TU",
                degree_program="BScCSIT",
                chapter="4",
                section="4.1",
                subsection=None,
                title="4.1 Design",
                rules="System design follows the analysis approach. Structured approach includes database design, forms/reports, and interface design. Object-oriented approach refines class, object, state, sequence, and activity diagrams.",
                required_elements=[
                    "Design approach consistency",
                    "Model refinement",
                    "Component design",
                    "Interface design"
                ],
                quality_criteria=[
                    "Consistent approach",
                    "Refined models",
                    "Complete components",
                    "User-friendly interfaces"
                ],
                examples=[
                    "Structured: 'Normalized database tables, form layouts'",
                    "OO: 'Refined class diagrams, component diagrams'"
                ],
                common_mistakes=[
                    "Inconsistent approach",
                    "Unrefined models",
                    "Incomplete components",
                    "Poor interfaces",
                    "Missing design elements"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="4.2",
                university="TU",
                degree_program="BScCSIT",
                chapter="4",
                section="4.2",
                subsection=None,
                title="4.2 Algorithm Details",
                rules="Write down the algorithms implemented during the project work. Include pseudocode, flowcharts, or detailed descriptions.",
                required_elements=[
                    "Algorithm descriptions",
                    "Implementation details",
                    "Performance analysis",
                    "Complexity analysis"
                ],
                quality_criteria=[
                    "Clear algorithms",
                    "Complete implementation",
                    "Performance metrics",
                    "Complexity understanding"
                ],
                examples=[
                    "Algorithm: 'Bubble sort for small datasets, Quick sort for large datasets'",
                    "Complexity: 'Time: O(n²), Space: O(1)'"
                ],
                common_mistakes=[
                    "Unclear algorithms",
                    "Missing implementation",
                    "No performance data",
                    "Poor complexity analysis",
                    "Incomplete descriptions"
                ],
                priority=2,
                created_by="system"
            ),

            # Chapter 5: Implementation and Testing
            DocumentRuleCreate(
                chunk_id="5",
                university="TU",
                degree_program="BScCSIT",
                chapter="5",
                section="5",
                subsection=None,
                title="Chapter 5: Implementation and Testing",
                rules="Chapter 5 covers system implementation, tools used, testing procedures, and result analysis.",
                required_elements=[
                    "Implementation details",
                    "Tools and technologies",
                    "Testing procedures",
                    "Result analysis"
                ],
                quality_criteria=[
                    "Complete implementation",
                    "Appropriate tools",
                    "Thorough testing",
                    "Clear results"
                ],
                examples=[
                    "Tools: 'Visual Studio Code, MySQL, React'",
                    "Testing: 'Unit tests, integration tests, user acceptance tests'"
                ],
                common_mistakes=[
                    "Incomplete implementation",
                    "Inappropriate tools",
                    "Poor testing",
                    "Unclear results",
                    "Missing analysis"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="5.1",
                university="TU",
                degree_program="BScCSIT",
                chapter="5",
                section="5.1",
                subsection=None,
                title="5.1 Implementation",
                rules="Implementation describes the system at code level, including critical code pieces, implementation problems, and solutions. Focus on important, innovative, or problematic code.",
                required_elements=[
                    "Critical code description",
                    "Implementation problems",
                    "Solution approaches",
                    "Code quality"
                ],
                quality_criteria=[
                    "Clear code description",
                    "Problem identification",
                    "Effective solutions",
                    "Good code quality"
                ],
                examples=[
                    "Critical code: 'Database connection pooling implementation'",
                    "Problems: 'Memory leaks in image processing module'",
                    "Solutions: 'Implemented garbage collection and memory management'"
                ],
                common_mistakes=[
                    "Too much code",
                    "Missing problems",
                    "Poor solutions",
                    "Low code quality",
                    "Incomplete description"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="5.1.1",
                university="TU",
                degree_program="BScCSIT",
                chapter="5",
                section="5.1.1",
                subsection="1",
                title="5.1.1 Tools Used",
                rules="Document all tools and technologies used for system specification, design, development, and testing.",
                required_elements=[
                    "CASE tools",
                    "Programming languages",
                    "Database platforms",
                    "Development environments"
                ],
                quality_criteria=[
                    "Complete tool list",
                    "Appropriate choices",
                    "Version information",
                    "Justified selection"
                ],
                examples=[
                    "CASE: 'Lucidchart for diagrams, Draw.io for mockups'",
                    "Language: 'Python 3.9, JavaScript ES6'",
                    "Database: 'PostgreSQL 13, MongoDB 5.0'"
                ],
                common_mistakes=[
                    "Incomplete tool list",
                    "Missing versions",
                    "Poor choices",
                    "No justification",
                    "Outdated tools"
                ],
                priority=2,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="5.1.2",
                university="TU",
                degree_program="BScCSIT",
                chapter="5",
                section="5.1.2",
                subsection="2",
                title="5.1.2 Implementation Details of Modules",
                rules="Describe the implementation of classes, procedures, functions, methods, and algorithms. Focus on key modules and their functionality.",
                required_elements=[
                    "Module descriptions",
                    "Class implementations",
                    "Function details",
                    "Algorithm implementations"
                ],
                quality_criteria=[
                    "Clear module descriptions",
                    "Complete implementations",
                    "Logical structure",
                    "Good documentation"
                ],
                examples=[
                    "Module: 'User authentication module with JWT tokens'",
                    "Class: 'DatabaseManager class for connection pooling'",
                    "Function: 'validateEmail() for email format checking'"
                ],
                common_mistakes=[
                    "Unclear descriptions",
                    "Incomplete implementations",
                    "Poor structure",
                    "Missing documentation",
                    "Irrelevant details"
                ],
                priority=2,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="5.2",
                university="TU",
                degree_program="BScCSIT",
                chapter="5",
                section="5.2",
                subsection=None,
                title="5.2 Testing",
                rules="Testing section covers unit testing, system testing, and result analysis. Include test cases in tabular form and demonstrate system functionality.",
                required_elements=[
                    "Unit testing",
                    "System testing",
                    "Test case documentation",
                    "Result analysis"
                ],
                quality_criteria=[
                    "Comprehensive testing",
                    "Clear test cases",
                    "Documented results",
                    "Thorough analysis"
                ],
                examples=[
                    "Unit tests: 'User authentication, data validation, calculation functions'",
                    "System tests: 'End-to-end workflows, performance testing, security testing'"
                ],
                common_mistakes=[
                    "Incomplete testing",
                    "Poor test cases",
                    "Missing results",
                    "Weak analysis",
                    "No documentation"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="5.3",
                university="TU",
                degree_program="BScCSIT",
                chapter="5",
                section="5.3",
                subsection=None,
                title="5.3 Result Analysis",
                rules="Result analysis demonstrates how the system works as intended. Include test summaries, confidence levels, and critical evaluation of results.",
                required_elements=[
                    "System demonstration",
                    "Test result summaries",
                    "Confidence levels",
                    "Critical evaluation"
                ],
                quality_criteria=[
                    "Clear demonstration",
                    "Complete results",
                    "Realistic confidence",
                    "Honest evaluation"
                ],
                examples=[
                    "Results: 'System processes 1000 records in 2.3 seconds'",
                    "Confidence: 'High confidence in core functionality, medium in edge cases'",
                    "Evaluation: 'Good performance, needs improvement in error handling'"
                ],
                common_mistakes=[
                    "Poor demonstration",
                    "Incomplete results",
                    "Unrealistic confidence",
                    "Biased evaluation",
                    "Missing analysis"
                ],
                priority=1,
                created_by="system"
            ),

            # Chapter 6: Conclusion and Future Recommendation
            DocumentRuleCreate(
                chunk_id="6",
                university="TU",
                degree_program="BScCSIT",
                chapter="6",
                section="6",
                subsection=None,
                title="Chapter 6: Conclusion and Future Recommendation",
                rules="Chapter 6 provides a strong conclusion summarizing main points and future recommendations for improvement.",
                required_elements=[
                    "Main idea restatement",
                    "Sub-points summary",
                    "Final impression",
                    "Future recommendations"
                ],
                quality_criteria=[
                    "Strong conclusion",
                    "Clear summary",
                    "Interesting final impression",
                    "Practical recommendations"
                ],
                examples=[
                    "Restatement: 'The system successfully reduces processing time by 85%'",
                    "Summary: 'Requirements met, performance achieved, user satisfaction high'",
                    "Recommendation: 'Implement machine learning for predictive analytics'"
                ],
                common_mistakes=[
                    "Weak conclusion",
                    "Poor summary",
                    "Boring ending",
                    "Unrealistic recommendations",
                    "Missing future work"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="6.1",
                university="TU",
                degree_program="BScCSIT",
                chapter="6",
                section="6.1",
                subsection=None,
                title="6.1 Conclusion",
                rules="Conclusion restates the main idea and thesis, summarizes sub-points, and leaves an interesting final impression. No new ideas should be introduced.",
                required_elements=[
                    "Main idea restatement",
                    "Thesis restatement",
                    "Sub-points synthesis",
                    "Final impression"
                ],
                quality_criteria=[
                    "Clear restatement",
                    "Strong synthesis",
                    "Interesting ending",
                    "No new ideas"
                ],
                examples=[
                    "Restatement: 'This project successfully addresses the identified problem'",
                    "Synthesis: 'Combining user research, technical implementation, and testing'",
                    "Final: 'The system demonstrates practical value for educational institutions'"
                ],
                common_mistakes=[
                    "Unclear restatement",
                    "Weak synthesis",
                    "Boring ending",
                    "New ideas introduced",
                    "Poor structure"
                ],
                priority=1,
                created_by="system"
            ),

            DocumentRuleCreate(
                chunk_id="6.2",
                university="TU",
                degree_program="BScCSIT",
                chapter="6",
                section="6.2",
                subsection=None,
                title="6.2 Future Recommendation",
                rules="Address limitations and suggest how they might be overcome in future work. Provide practical and achievable recommendations.",
                required_elements=[
                    "Limitation identification",
                    "Overcoming strategies",
                    "Future work suggestions",
                    "Practical recommendations"
                ],
                quality_criteria=[
                    "Clear limitations",
                    "Realistic strategies",
                    "Practical suggestions",
                    "Achievable goals"
                ],
                examples=[
                    "Limitation: 'Current system supports only 1000 concurrent users'",
                    "Strategy: 'Implement load balancing and horizontal scaling'",
                    "Future: 'Add mobile app support and cloud deployment'"
                ],
                common_mistakes=[
                    "Missing limitations",
                    "Unrealistic strategies",
                    "Impractical suggestions",
                    "Unachievable goals",
                    "Poor planning"
                ],
                priority=2,
                created_by="system"
            ),

            # Chapter 7: References
            DocumentRuleCreate(
                chunk_id="7",
                university="TU",
                degree_program="BScCSIT",
                chapter="7",
                section="7",
                subsection=None,
                title="Chapter 7: References",
                rules="Follow IEEE referencing format with numbered references in square brackets. Include all sources used in the project.",
                required_elements=[
                    "IEEE format compliance",
                    "Numbered references",
                    "Complete source information",
                    "Proper citation format"
                ],
                quality_criteria=[
                    "Correct IEEE format",
                    "Complete references",
                    "Proper numbering",
                    "Accurate citations"
                ],
                examples=[
                    "Book: '[1] B. Klaus and P. Horn, Robot Vision. Cambridge, MA: MIT Press, 1986.'",
                    "Journal: '[4] J. U. Duncombe, \"Infrared navigation - Part I: An assessment of feasibility,\" IEEE Trans. Electron. Devices, vol. ED-11, pp. 34-39, Jan. 1959.'"
                ],
                common_mistakes=[
                    "Wrong format",
                    "Incomplete references",
                    "Poor numbering",
                    "Inaccurate citations",
                    "Missing sources"
                ],
                priority=1,
                created_by="system"
            ),

            # Chapter 8: Appendices
            DocumentRuleCreate(
                chunk_id="8",
                university="TU",
                degree_program="BScCSIT",
                chapter="8",
                section="8",
                subsection=None,
                title="Chapter 8: Appendices",
                rules="Appendices are optional and can include additional information that supports the main content but is not essential for understanding.",
                required_elements=[
                    "Relevant additional information",
                    "Supporting documentation",
                    "Technical details",
                    "Supplementary materials"
                ],
                quality_criteria=[
                    "Relevant content",
                    "Supporting value",
                    "Clear presentation",
                    "Proper organization"
                ],
                examples=[
                    "Appendix A: 'Database schema diagrams'",
                    "Appendix B: 'User interface mockups'",
                    "Appendix C: 'Test data samples'"
                ],
                common_mistakes=[
                    "Irrelevant content",
                    "No supporting value",
                    "Poor presentation",
                    "Disorganized structure",
                    "Essential information misplaced"
                ],
                priority=3,
                created_by="system"
            )
        ]

    async def seed_document_rules(self, session: AsyncSession) -> Dict[str, List[str]]:
        """
        Seed document rules in the database while checking for duplicates.

        Returns:
            Dictionary with 'created' and 'skipped' lists (based on chunk_id)
        """
        result = {
            "created": [],
            "skipped": []
        }

        for rule_data in self.document_rules:
            try:
                # Check if rule already exists
                query = await session.execute(
                    select(DocumentRule).where(DocumentRule.chunk_id == rule_data.chunk_id)
                )
                existing = query.scalar_one_or_none()
                if existing:
                    logger.info(f"Document rule already exists: {rule_data.chunk_id}, skipping")
                    result["skipped"].append(rule_data.chunk_id)
                    continue

                # Create new document rule
                rule = DocumentRule(
                    chunk_id=rule_data.chunk_id,
                    university=rule_data.university,
                    degree_program=rule_data.degree_program,
                    chapter=rule_data.chapter,
                    section=rule_data.section,
                    subsection=rule_data.subsection,
                    title=rule_data.title,
                    rules=rule_data.rules,
                    required_elements=rule_data.required_elements,
                    quality_criteria=rule_data.quality_criteria,
                    examples=rule_data.examples,
                    common_mistakes=rule_data.common_mistakes,
                    priority=rule_data.priority,
                    created_by=rule_data.created_by
                )
                session.add(rule)
                await session.flush()
                result["created"].append(rule.chunk_id)
                logger.info(f"Created document rule: {rule.chunk_id}")

            except Exception as e:
                logger.error(f"Failed to create document rule '{rule_data.chunk_id}': {e}")
                logger.error(f"Error details: {type(e).__name__}: {str(e)}")
                result["skipped"].append(rule_data.chunk_id)
                continue

        return result

    async def run(self) -> bool:
        """Run the document rules seeding process"""
        try:
            db_manager.initialize()
            
            # Check database connection first
            if not await db_manager.check_connection():
                logger.error("Database connection failed")
                return False
                
            async with db_manager.get_async_session() as session:
                result = await self.seed_document_rules(session)
                await session.commit()
                
                logger.info(f"Document rules seeding completed. Created: {len(result['created'])}, Skipped: {len(result['skipped'])}")
                return True

        except Exception as e:
            logger.error(f"Document rules seeding failed: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            return False

    def print_document_rules_info(self):
        """Print information about the document rules to be seeded"""
        print(f"\n📚 Document Rules Seeder for TU BScCSIT")
        print(f"   Total rules to seed: {len(self.document_rules)}")
        print(f"   University: TU (Tribhuvan University)")
        print(f"   Degree Program: BScCSIT (Bachelor of Science in Computer Science and Information Technology)")
        print(f"   Chapters covered: 0 (Front Matter), 1-6, 7 (References), 8 (Appendices)")
        print(f"   Chunk IDs match section IDs (e.g., 0.1, 0.2, 1.1, 1.2, 3.1.1)")
        print(f"   Priority levels: 1 (Critical), 2 (Important), 3 (Recommended)")


# Create instance for easy import
document_rules_seeder = DocumentRulesSeeder()
