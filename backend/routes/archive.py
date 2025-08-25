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
from models.archive import Archive

router = APIRouter(prefix="", tags=["archives"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
print(f"Upload directory created/verified at: {UPLOAD_DIR.absolute()}")

async def process_document_analysis(archive_id: int, file_path: str):
    """Background task to process document analysis"""
    db: Session = db_manager.get_sync_session()
    try:
        # Update status to processing
        crud_archive.update_processing_status(
            db, archive_id=archive_id, status="processing"
        )
        
        # Read PDF content
        pdf_reader = PDFReader()
        content = pdf_reader.extract_text(file_path)
        
        if not content.strip():
            crud_archive.update_processing_status(
                db, archive_id=archive_id, status="failed", 
                error_message="Could not extract text from PDF"
            )
            return
        
        # Analyze with Ollama
        ollama_client = OllamaClient()
        analysis_result = await ollama_client.analyze_document(content)
        
        # Parse analysis results
        formatter = ResultFormatter()
        parsed_results = formatter.parse_analysis_result(analysis_result)
        
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
        
        # Update archive with results
        updated_archive = crud_archive.update_analysis_results(
            db,
            archive_id=archive_id,
            analysis_content=analysis_result,
            suggestions=suggestions,
            warnings=warnings,
            errors=errors,
            status="completed"
        )
        
        if updated_archive:
            print(f"Analysis completed for archive {archive_id}. Found {len(suggestions)} suggestions, {len(warnings)} warnings, {len(errors)} errors.")
        else:
            print(f"Failed to update archive {archive_id} with analysis results.")
        
    except Exception as e:
        print(f"Analysis failed for archive {archive_id}: {str(e)}")
        try:
            crud_archive.update_processing_status(
                db, archive_id=archive_id, status="failed", 
                error_message=str(e)
            )
        except Exception:
            pass
    finally:
        try:
            db.close()
        except Exception:
            pass

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
        
        # Start background analysis
        background_tasks.add_task(
            process_document_analysis, 
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
    
    # Start background analysis
    background_tasks.add_task(
        process_document_analysis, 
        archive.id, 
        archive.file_path
    )
    
    return ArchiveAnalysisResponse(
        archive_id=archive_id,
        status="processing",
        message="Reanalysis started"
    )