from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from pathlib import Path
import asyncio
from sqlalchemy import and_

from database.connection import get_db, db_manager
from routes.dependencies import get_current_user
from models.user import User
from models.archive import Archive
from schemas.archive import (
    ArchiveCreate, 
    ArchiveUpdate, 
    ArchiveResponse, 
    ArchiveListResponse,
    ArchiveAnalysisRequest,
    ArchiveAnalysisResponse,
    AnalysisItem
)
from crud.archive import archive as crud_archive
from utils.pdf_reader import PDFReader
from utils.ollama_client import OllamaClient
from prompt.result_formatter import ResultFormatter
from prompt import prompt_manager
from models.archive import Archive

router = APIRouter(prefix="", tags=["archives"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
print(f"Upload directory created/verified at: {UPLOAD_DIR.absolute()}")

async def process_document_analysis_sequential(archive_id: int, file_path: str):
    """Background task to process document analysis in parallel"""
    print(f"Starting parallel analysis for archive {archive_id}, file: {file_path}")
    db: Session = db_manager.get_sync_session()
    try:
        # Update overall status to processing
        crud_archive.update_processing_status(
            db, archive_id=archive_id, status="processing"
        )
        print(f"Updated processing status to 'processing' for archive {archive_id}")
        
        # Read PDF content
        pdf_reader = PDFReader()
        content = pdf_reader.extract_text(file_path)
        
        if not content.strip():
            crud_archive.update_processing_status(
                db, archive_id=archive_id, status="failed", 
                error_message="Could not extract text from PDF"
            )
            return
        
        # Extract abstract and acknowledgement from PDF content
        abstract = prompt_manager.extract_abstract_from_pdf_content(content)
        acknowledgement = prompt_manager.extract_acknowledgement_from_pdf_content(content)
        
        # Start analyses sequentially - abstract first, then acknowledgement
        await process_abstract_analysis(archive_id, abstract, db)
        await process_acknowledgement_analysis(archive_id, acknowledgement, db)
        
        # Update overall status to completed
        crud_archive.update_processing_status(
            db, archive_id=archive_id, status="completed"
        )
        
    except Exception as e:
        import logging
        logging.error(f"Error processing document analysis: {str(e)}")
        crud_archive.update_processing_status(
            db, archive_id=archive_id, status="failed", 
            error_message=f"Analysis failed: {str(e)}"
        )

async def process_abstract_analysis(archive_id: int, abstract: str, db: Session):
    """Process abstract analysis independently"""
    try:
        print(f"Starting abstract analysis for archive {archive_id}")
        crud_archive.update_abstract_analysis(
            db, archive_id=archive_id, status="processing"
        )
        print(f"Updated abstract status to 'processing' for archive {archive_id}")
        
        if not abstract.strip():
            crud_archive.update_abstract_analysis(
                db, archive_id=archive_id, status="failed", 
                error_message="Could not extract abstract from PDF"
            )
            return
        
        # Analyze abstract with Ollama
        ollama_client = OllamaClient()
        analysis_prompt = prompt_manager.get_abstract_analysis_prompt(abstract)
        print(f"Calling Ollama for abstract analysis...")
        analysis_result = await ollama_client.analyze_document_async(analysis_prompt)
        print(f"Received analysis result from Ollama: {analysis_result[:200]}...")
        
        # Parse abstract analysis results
        formatter = ResultFormatter()
        parsed_results = formatter.parse_abstract_analysis_result(analysis_result)
        summary = formatter.create_abstract_analysis_summary(parsed_results)
        
        # Convert to AnalysisItem objects for abstract
        abstract_items = []
        
        # Add motivation analysis
        motivation = parsed_results.get("motivation", {})
        abstract_items.append(AnalysisItem(
            type="motivation",
            message=f"Status: {motivation.get('status', 'unknown').upper()}\n{motivation.get('feedback', 'No feedback available')}",
            page_number=None
        ))
        
        # Add methods analysis
        methods = parsed_results.get("methods", {})
        abstract_items.append(AnalysisItem(
            type="methods",
            message=f"Status: {methods.get('status', 'unknown').upper()}\n{methods.get('feedback', 'No feedback available')}",
            page_number=None
        ))
        
        # Add results analysis
        results = parsed_results.get("results", {})
        abstract_items.append(AnalysisItem(
            type="results",
            message=f"Status: {results.get('status', 'unknown').upper()}\n{results.get('feedback', 'No feedback available')}",
            page_number=None
        ))
        
        # Add conclusion analysis
        conclusion = parsed_results.get("conclusion", {})
        abstract_items.append(AnalysisItem(
            type="conclusion",
            message=f"Status: {conclusion.get('status', 'unknown').upper()}\n{conclusion.get('feedback', 'No feedback available')}",
            page_number=None
        ))
        
        # Update abstract analysis results
        print(f"Storing abstract results for archive {archive_id}: {len(abstract_items)} items")
        print(f"Abstract items: {[item.model_dump() for item in abstract_items]}")
        crud_archive.update_abstract_analysis(
            db, 
            archive_id=archive_id, 
            status="completed",
            abstract_results=abstract_items,
            abstract_summary=summary
        )
        print(f"Successfully stored abstract results for archive {archive_id}")
        
    except Exception as e:
        import logging
        logging.error(f"Error processing abstract analysis: {str(e)}")
        crud_archive.update_abstract_analysis(
            db, archive_id=archive_id, status="failed", 
            error_message=f"Abstract analysis failed: {str(e)}"
        )

async def process_acknowledgement_analysis(archive_id: int, acknowledgement: str, db: Session):
    """Process acknowledgement analysis independently"""
    try:
        print(f"Starting acknowledgement analysis for archive {archive_id}")
        crud_archive.update_acknowledgement_analysis(
            db, archive_id=archive_id, status="processing"
        )
        print(f"Updated acknowledgement status to 'processing' for archive {archive_id}")
        
        if not acknowledgement.strip():
            # No acknowledgement found, mark as completed with empty results
            crud_archive.update_acknowledgement_analysis(
                db, archive_id=archive_id, status="completed",
                acknowledgement_results=[], acknowledgement_summary={}
            )
            return
        
        # Analyze acknowledgement with Ollama
        ollama_client = OllamaClient()
        acknowledgement_prompt = prompt_manager.get_acknowledgement_analysis_prompt(acknowledgement)
        print(f"Calling Ollama for acknowledgement analysis...")
        acknowledgement_result = await ollama_client.analyze_document_async(acknowledgement_prompt)
        print(f"Received acknowledgement result from Ollama: {acknowledgement_result[:200]}...")
        
        # Parse acknowledgement analysis results
        formatter = ResultFormatter()
        acknowledgement_parsed = formatter.parse_acknowledgement_analysis_result(acknowledgement_result)
        acknowledgement_summary = formatter.create_acknowledgement_analysis_summary(acknowledgement_parsed)
        
        # Convert to AnalysisItem objects for acknowledgement
        acknowledgement_items = []
        
        # Add acknowledgement analysis items
        student_info = acknowledgement_parsed.get("student_info", {})
        acknowledgement_items.append(AnalysisItem(
            type="student_info",
            message=f"Status: {student_info.get('status', 'unknown').upper()}\n{student_info.get('feedback', 'No feedback available')}",
            page_number=None
        ))
        
        gratitude_expression = acknowledgement_parsed.get("gratitude_expression", {})
        acknowledgement_items.append(AnalysisItem(
            type="gratitude_expression",
            message=f"Status: {gratitude_expression.get('status', 'unknown').upper()}\n{gratitude_expression.get('feedback', 'No feedback available')}",
            page_number=None
        ))
        
        mentioned_parties = acknowledgement_parsed.get("mentioned_parties", {})
        acknowledgement_items.append(AnalysisItem(
            type="mentioned_parties",
            message=f"Status: {mentioned_parties.get('status', 'unknown').upper()}\n{mentioned_parties.get('feedback', 'No feedback available')}",
            page_number=None
        ))
        
        contribution_description = acknowledgement_parsed.get("contribution_description", {})
        acknowledgement_items.append(AnalysisItem(
            type="contribution_description",
            message=f"Status: {contribution_description.get('status', 'unknown').upper()}\n{contribution_description.get('feedback', 'No feedback available')}",
            page_number=None
        ))
        
        # Update acknowledgement analysis results
        print(f"Storing acknowledgement results for archive {archive_id}: {len(acknowledgement_items)} items")
        print(f"Acknowledgement items: {[item.model_dump() for item in acknowledgement_items]}")
        crud_archive.update_acknowledgement_analysis(
            db, 
            archive_id=archive_id, 
            status="completed",
            acknowledgement_results=acknowledgement_items,
            acknowledgement_summary=acknowledgement_summary
        )
        print(f"Successfully stored acknowledgement results for archive {archive_id}")
        
    except Exception as e:
        import logging
        logging.error(f"Error processing acknowledgement analysis: {str(e)}")
        crud_archive.update_acknowledgement_analysis(
            db, archive_id=archive_id, status="failed", 
            error_message=f"Acknowledgement analysis failed: {str(e)}"
        )

# Keep the old function for backward compatibility
async def process_document_analysis(archive_id: int, file_path: str):
    """Legacy background task to process document analysis (simultaneous)"""
    # This function is kept for backward compatibility
    # It will be replaced by the sequential version
    await process_document_analysis_sequential(archive_id, file_path)

@router.post("/upload-test", response_model=ArchiveResponse)
async def upload_document_test(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and analyze a document (test endpoint without authentication)"""
    # Use test user for testing
    from models.user import User
    current_user = db.query(User).filter(User.uid == 5).first()
    if not current_user:
        raise HTTPException(status_code=500, detail="Test user not found")
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Save file to uploads directory
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    file_path = upload_dir / f"{current_user.uid}_{file.filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Create archive record
    from schemas.archive import ArchiveCreate
    archive_data = ArchiveCreate(
        file_name=file.filename,
        file_path=str(file_path),
        file_size=len(content),
        processing_status="pending"
    )
    
    archive = crud_archive.create_with_user(db, obj_in=archive_data, user_id=current_user.uid)
    
    # Start background analysis
    background_tasks.add_task(process_document_analysis_sequential, archive.id, str(file_path))
    
    return archive

@router.post("/upload", response_model=ArchiveResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and analyze a document"""
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Create unique filename
    file_path = UPLOAD_DIR / f"{current_user.uid}_{file.filename}"
    
    try:
        # Ensure upload directory exists
        UPLOAD_DIR.mkdir(exist_ok=True)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = os.path.getsize(file_path)
        
        # Create archive record
        archive_create = ArchiveCreate(
            file_name=file.filename,
            file_path=str(file_path),
            file_size=file_size,
            processing_status="pending"
        )
        
        # Create archive record
        archive = crud_archive.create_with_user(
            db, obj_in=archive_create, user_id=current_user.uid
        )
        
        # Start background sequential analysis
        background_tasks.add_task(
            process_document_analysis_sequential, 
            archive.id, 
            str(file_path)
        )
        
        return archive
        
    except Exception as e:
        # Clean up file if creation failed
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass  # Ignore cleanup errors
        
        # Provide more specific error messages
        error_detail = str(e)
        if "No such file or directory" in error_detail:
            error_detail = f"Upload directory not accessible: {UPLOAD_DIR.absolute()}. Please ensure the server has write permissions."
        elif "Permission denied" in error_detail:
            error_detail = f"Permission denied when writing to upload directory: {UPLOAD_DIR.absolute()}"
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {error_detail}"
        )

@router.get("/", response_model=ArchiveListResponse)
def get_archives(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's archives with pagination"""
    archives = crud_archive.get_by_user(
        db, user_id=current_user.uid, skip=skip, limit=limit
    )
    total = crud_archive.count_by_user(db, user_id=current_user.uid)
    
    return ArchiveListResponse(
        archives=archives,
        total=total,
        page=skip // limit + 1,
        size=limit,
        total_pages=(total + limit - 1) // limit
    )

@router.get("/{archive_id}", response_model=ArchiveResponse)
def get_archive(
    archive_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific archive"""
    archive = crud_archive.get_by_user_and_id(
        db, user_id=current_user.uid, archive_id=archive_id
    )
    
    if not archive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archive not found"
        )
    
    return archive

@router.put("/{archive_id}", response_model=ArchiveResponse)
def update_archive(
    archive_id: int,
    archive_update: ArchiveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update archive"""
    try:
        print(f"Updating archive {archive_id} for user {current_user.uid}")
        print(f"Update data: {archive_update.model_dump()}")
        
        archive = crud_archive.get_by_user_and_id(
            db, user_id=current_user.uid, archive_id=archive_id
        )
        
        if not archive:
            print(f"Archive {archive_id} not found for user {current_user.uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Archive not found"
            )
        
        print(f"Found archive: {archive.file_name}")
        
        # Update the archive with the new data
        update_data = archive_update.model_dump(exclude_unset=True)
        print(f"Processing update data: {update_data}")
        
        # Handle file_name update specifically
        if "file_name" in update_data and update_data["file_name"]:
            # Validate file name
            if not update_data["file_name"].strip():
                print("File name is empty")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File name cannot be empty"
                )
            
            new_file_name = update_data["file_name"].strip()
            print(f"Updating file name from '{archive.file_name}' to '{new_file_name}'")
            
            # Check if file name already exists for this user
            existing_archive = db.query(Archive).filter(
                and_(Archive.user_id == current_user.uid, 
                     Archive.file_name == new_file_name,
                     Archive.id != archive_id)
            ).first()
            
            if existing_archive:
                print(f"File name '{new_file_name}' already exists for user {current_user.uid}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A file with this name already exists"
                )
            
            # Update the file name
            archive.file_name = new_file_name
            print(f"File name updated to: {archive.file_name}")
        
        # Handle other fields
        if "analysis_content" in update_data:
            archive.analysis_content = update_data["analysis_content"]
            print(f"Analysis content updated")
        
        if "suggestions" in update_data and update_data["suggestions"] is not None:
            archive.suggestions = crud_archive._normalize_items(update_data["suggestions"]) or []
            print(f"Suggestions updated: {len(archive.suggestions)} items")
        
        if "warnings" in update_data and update_data["warnings"] is not None:
            archive.warnings = crud_archive._normalize_items(update_data["warnings"]) or []
            print(f"Warnings updated: {len(archive.warnings)} items")
        
        if "errors" in update_data and update_data["errors"] is not None:
            archive.errors = crud_archive._normalize_items(update_data["errors"]) or []
            print(f"Errors updated: {len(archive.errors)} items")
        
        if "processing_status" in update_data:
            archive.processing_status = update_data["processing_status"]
            print(f"Processing status updated to: {archive.processing_status}")
        
        if "error_message" in update_data:
            archive.error_message = update_data["error_message"]
            print(f"Error message updated")
        
        # Commit the changes
        print("Committing changes to database...")
        db.commit()
        db.refresh(archive)
        print(f"Archive updated successfully: {archive.file_name}")
        
        return archive
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error updating archive: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.delete("/{archive_id}")
def delete_archive(
    archive_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete archive"""
    archive = crud_archive.get_by_user_and_id(
        db, user_id=current_user.uid, archive_id=archive_id
    )
    
    if not archive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archive not found"
        )
    
    # Delete file if exists
    if archive.file_path and os.path.exists(archive.file_path):
        os.remove(archive.file_path)
    
    crud_archive.remove(db, id=archive_id)
    return {"message": "Archive deleted successfully"}

@router.post("/{archive_id}/reanalyze", response_model=ArchiveAnalysisResponse)
async def reanalyze_archive(
    archive_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reanalyze an existing archive"""
    archive = crud_archive.get_by_user_and_id(
        db, user_id=current_user.uid, archive_id=archive_id
    )
    
    if not archive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archive not found"
        )
    
    if not archive.file_path or not os.path.exists(archive.file_path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Original file not found"
        )
    
    # Start background sequential analysis
    background_tasks.add_task(
        process_document_analysis_sequential, 
        archive.id, 
        archive.file_path
    )
    
    return ArchiveAnalysisResponse(
        archive_id=archive_id,
        status="processing",
        message="Reanalysis started"
    )

@router.get("/{archive_id}/abstract-status")
def get_abstract_status(
    archive_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get abstract analysis status and results"""
    archive = crud_archive.get_by_user_and_id(
        db, user_id=current_user.uid, archive_id=archive_id
    )
    
    if not archive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archive not found"
        )
    
    result = {
        "archive_id": archive_id,
        "abstract_status": archive.abstract_status,
        "abstract_results": archive.abstract_results or [],
        "abstract_summary": archive.abstract_summary or {},
        "abstract_error": archive.abstract_error
    }
    
    # Debug logging
    print(f"Abstract status response for archive {archive_id}:")
    print(f"  Status: {archive.abstract_status}")
    print(f"  Results type: {type(archive.abstract_results)}")
    print(f"  Results: {archive.abstract_results}")
    print(f"  Results length: {len(archive.abstract_results) if archive.abstract_results else 0}")
    
    return result

@router.get("/{archive_id}/acknowledgement-status")
def get_acknowledgement_status(
    archive_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get acknowledgement analysis status and results"""
    archive = crud_archive.get_by_user_and_id(
        db, user_id=current_user.uid, archive_id=archive_id
    )
    
    if not archive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archive not found"
        )
    
    result = {
        "archive_id": archive_id,
        "acknowledgement_status": archive.acknowledgement_status,
        "acknowledgement_results": archive.acknowledgement_results or [],
        "acknowledgement_summary": archive.acknowledgement_summary or {},
        "acknowledgement_error": archive.acknowledgement_error
    }
    
    # Debug logging
    print(f"Acknowledgement status response for archive {archive_id}:")
    print(f"  Status: {archive.acknowledgement_status}")
    print(f"  Results type: {type(archive.acknowledgement_results)}")
    print(f"  Results: {archive.acknowledgement_results}")
    print(f"  Results length: {len(archive.acknowledgement_results) if archive.acknowledgement_results else 0}")
    
    return result

# Test endpoints without authentication
@router.get("/{archive_id}/abstract-status-test")
def get_abstract_status_test(
    archive_id: int,
    db: Session = Depends(get_db)
):
    """Get abstract analysis status and results (test endpoint without authentication)"""
    archive = db.query(Archive).filter(Archive.id == archive_id).first()
    if not archive:
        raise HTTPException(status_code=404, detail="Archive not found")
    
    return {
        "abstract_status": archive.abstract_status,
        "abstract_results": archive.abstract_results or [],
        "abstract_summary": archive.abstract_summary or {},
        "abstract_error": archive.abstract_error
    }

@router.get("/{archive_id}/acknowledgement-status-test")
def get_acknowledgement_status_test(
    archive_id: int,
    db: Session = Depends(get_db)
):
    """Get acknowledgement analysis status and results (test endpoint without authentication)"""
    archive = db.query(Archive).filter(Archive.id == archive_id).first()
    if not archive:
        raise HTTPException(status_code=404, detail="Archive not found")
    
    return {
        "acknowledgement_status": archive.acknowledgement_status,
        "acknowledgement_results": archive.acknowledgement_results or [],
        "acknowledgement_summary": archive.acknowledgement_summary or {},
        "acknowledgement_error": archive.acknowledgement_error
    }