"""
Test script to verify analysis persistence in archive table
"""
import asyncio
import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Direct imports to avoid relative import issues
from database.connection import db_manager
from database.config import db_config
from crud.archive import archive as crud_archive
from schemas.archive import ArchiveCreate, AnalysisItem
from prompt.result_formatter import ResultFormatter
from models.user import Base
from models.archive import Archive
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine

async def test_analysis_persistence():
    """Test the complete analysis and persistence flow"""
    
    # Initialize database manually
    try:
        # Initialize the database manager
        db_manager.initialize()
        
        # Create tables
        sync_engine = create_engine(db_config.database_url)
        Base.metadata.create_all(bind=sync_engine)
        print("✅ Database tables created successfully")
        
    except Exception as e:
        print(f"❌ Failed to initialize database: {str(e)}")
        return
    
    # Create a test archive entry
    db = db_manager.get_sync_session()
    
    try:
        # Create a sample archive
        archive_create = ArchiveCreate(
            file_name="test_document.pdf",
            file_path="/path/to/test/document.pdf",
            file_size=1024,
            processing_status="pending"
        )
        
        # Use user_id = 1 for testing (make sure this user exists)
        archive = crud_archive.create_with_user(
            db, obj_in=archive_create, user_id=1
        )
        
        print(f"Created test archive with ID: {archive.id}")
        
        # Test sample analysis content
        sample_analysis = """
        SUGGESTIONS:
        - Consider adding more detailed methodology section
        - Include more recent references in the literature review
        - Improve figure captions with more descriptive text
        
        WARNINGS:
        - Some tables are not properly formatted according to TU guidelines
        - Missing page numbers on some pages
        - Inconsistent citation format detected
        
        ERRORS:
        - Abstract exceeds the maximum word limit of 300 words
        - Required section "Acknowledgments" is missing
        - Bibliography format does not follow TU standard
        """
        
        # Parse the analysis
        formatter = ResultFormatter()
        parsed_results = formatter.parse_analysis_result(sample_analysis)
        
        print(f"Parsed results: {parsed_results}")
        
        # Convert to AnalysisItem objects
        suggestions = []
        for item in parsed_results.get("suggestions", []):
            if isinstance(item, dict):
                suggestions.append(AnalysisItem(
                    type="suggestion",
                    message=item.get("message", ""),
                    severity=item.get("severity", "medium"),
                    category=item.get("category", "general"),
                    page_number=item.get("page_number"),
                    section=item.get("section")
                ))
        
        warnings = []
        for item in parsed_results.get("warnings", []):
            if isinstance(item, dict):
                warnings.append(AnalysisItem(
                    type="warning",
                    message=item.get("message", ""),
                    severity=item.get("severity", "medium"),
                    category=item.get("category", "general"),
                    page_number=item.get("page_number"),
                    section=item.get("section")
                ))
        
        errors = []
        for item in parsed_results.get("errors", []):
            if isinstance(item, dict):
                errors.append(AnalysisItem(
                    type="error",
                    message=item.get("message", ""),
                    severity=item.get("severity", "high"),
                    category=item.get("category", "general"),
                    page_number=item.get("page_number"),
                    section=item.get("section")
                ))
        
        print(f"Created {len(suggestions)} suggestions, {len(warnings)} warnings, {len(errors)} errors")
        
        # Update archive with analysis results
        updated_archive = crud_archive.update_analysis_results(
            db,
            archive_id=archive.id,
            analysis_content=sample_analysis,
            suggestions=suggestions,
            warnings=warnings,
            errors=errors,
            status="completed"
        )
        
        if updated_archive:
            print("✅ Analysis results successfully saved to archive!")
            print(f"Archive ID: {updated_archive.id}")
            print(f"Status: {updated_archive.processing_status}")
            print(f"Suggestions count: {len(updated_archive.suggestions)}")
            print(f"Warnings count: {len(updated_archive.warnings)}")
            print(f"Errors count: {len(updated_archive.errors)}")
            
            # Test retrieval
            retrieved_archive = crud_archive.get_by_user_and_id(
                db, user_id=1, archive_id=archive.id
            )
            
            if retrieved_archive:
                print("✅ Archive successfully retrieved!")
                print(f"Retrieved suggestions: {len(retrieved_archive.suggestions)}")
                print(f"Retrieved warnings: {len(retrieved_archive.warnings)}")
                print(f"Retrieved errors: {len(retrieved_archive.errors)}")
                
                # Print sample items
                if retrieved_archive.suggestions:
                    print(f"Sample suggestion: {retrieved_archive.suggestions[0]}")
                if retrieved_archive.warnings:
                    print(f"Sample warning: {retrieved_archive.warnings[0]}")
                if retrieved_archive.errors:
                    print(f"Sample error: {retrieved_archive.errors[0]}")
            else:
                print("❌ Failed to retrieve archive")
        else:
            print("❌ Failed to save analysis results")
            
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_analysis_persistence())