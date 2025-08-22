from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from pathlib import Path
import asyncio

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

router = APIRouter(prefix="/archives", tags=["archives"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

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
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
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
    archive = crud_archive.get_by_user_and_id(
        db, user_id=current_user.uid, archive_id=archive_id
    )
    
    if not archive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archive not found"
        )
    
    archive = crud_archive.update(db, db_obj=archive, obj_in=archive_update)
    return archive

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