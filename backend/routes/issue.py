from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import os
import shutil
from datetime import datetime
from .dependencies import get_current_user
from .dependencies_admin import get_current_active_admin, get_db
from crud.issue import issue_crud
from schemas.issue import IssueCreate, IssueResponse, IssueUpdateStatus

from models.user import User
from models.admin import Admin
from models.issue import Issue

router = APIRouter()


MAX_IMAGE_SIZE_MB = 2
UPLOADS_DIR = "uploads/issues"

# Ensure uploads directory exists
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Handle CORS preflight request for addIssue
@router.options("/addIssue")
async def add_issue_options():
    """Handle CORS preflight request for addIssue endpoint"""
    from fastapi.responses import Response
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Max-Age"] = "86400"
    return response

# Authenticated user creates an issue
@router.post("/addIssue", response_model=dict)
async def add_issue(
    title: str = Form(...),
    description: str = Form(...),
    image: UploadFile = File(None),
    db: AsyncSession = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    try:
        # Validate title and description
        if not title.strip() or not description.strip():
            raise HTTPException(status_code=400, detail="Title and description are required")

        # Handle image upload if provided
        image_path = None
        if image:
            # Validate file type
            if not image.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="File must be an image")
            
            # Validate file size (2MB limit)
            if image.size > MAX_IMAGE_SIZE_MB * 1024 * 1024:
                raise HTTPException(status_code=400, detail=f"Image size must be less than {MAX_IMAGE_SIZE_MB}MB")
            
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_extension = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
            filename = f"issue_{user.uid}_{timestamp}{file_extension}"
            file_path = os.path.join(UPLOADS_DIR, filename)
            
            # Save image to file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            
            image_path = file_path
            print(f"Image saved to: {image_path}")

        # Check if user exists 
        result = await db.execute(select(User).where(User.uid == user.uid))
        user_exists = result.scalar_one_or_none()
        if not user_exists:
            raise HTTPException(status_code=404, detail="User not found")

        # Create issue data
        issue_data = IssueCreate(
            title=title.strip(),
            description=description.strip(),
            image=image_path  # Store file path instead of base64
        )

        result = await issue_crud.add_issue(db, issue_data, user.uid)
        
        # Log successful creation
        import logging
        logging.info(f"Issue created successfully: {result.issue_id} for user {user.uid}")
        
        # Return a simple dict instead of the complex model
        return {
            "message": "Issue created successfully",
            "issue_id": str(result.issue_id),
            "title": result.title,
            "description": result.description,
            "status": result.status,
            "created_at": result.created_at.isoformat(),
            "uid": result.uid,
            "image_path": result.image
        }
    except Exception as e:
        # Log the error for debugging
        import logging
        logging.error(f"Error in add_issue: {str(e)}")
        raise

# Authenticated user gets their own issues
@router.get("/getUserIssues", response_model=list[IssueResponse])
async def get_user_issues(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await issue_crud.get_user_issues(db, user.uid)

# Admin: get all issues
@router.get("/getAll", response_model=list[IssueResponse])
async def list_issues(db: AsyncSession = Depends(get_db), admin=Depends(get_current_active_admin)):
    
    return await issue_crud.get_all_issues(db)

# Admin: get issue by ID
@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: UUID, db: AsyncSession = Depends(get_db), admin=Depends(get_current_active_admin)):
    issue = await issue_crud.get_issue_by_id(db, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

# Admin: update issue status
@router.patch("/updateStatus/{issue_id}", response_model=IssueResponse)
async def change_issue_status(issue_id: UUID, status_update: IssueUpdateStatus, db: AsyncSession = Depends(get_db), admin=Depends(get_current_active_admin)):
    try:
        updated_issue = await issue_crud.update_issue_status(db, issue_id, status_update)
        if not updated_issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        return updated_issue
    except Exception as e:
        import logging
        logging.error(f"Error updating issue status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update issue status: {str(e)}")

# Admin: mark issue as read when viewed
@router.patch("/markAsRead/{issue_id}", response_model=IssueResponse)
async def mark_issue_as_read(issue_id: UUID, db: AsyncSession = Depends(get_db), admin=Depends(get_current_active_admin)):
    try:
        updated_issue = await issue_crud.mark_issue_as_read(db, issue_id)
        if not updated_issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        return updated_issue
    except Exception as e:
        import logging
        logging.error(f"Error marking issue as read: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to mark issue as read: {str(e)}")

# Admin: get unread issue count
@router.get("/unread/count")
async def get_unread_count(db: AsyncSession = Depends(get_db), admin=Depends(get_current_active_admin)):
    """Get count of unread issues for admin dashboard"""
    try:
        unread_count = await issue_crud.get_unread_count(db)
        return {"unread_count": unread_count}
    except Exception as e:
        import logging
        logging.error(f"Error getting unread count: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get unread count: {str(e)}")

# User deletes their own issue
@router.delete("/delete/{issue_id}")
async def delete_user_issue(issue_id: UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        success = await issue_crud.delete_issue(db, issue_id, user.uid)
        if not success:
            raise HTTPException(status_code=404, detail="Issue not found or you don't have permission to delete it")
        
        return {"message": "Issue deleted successfully"}
    except Exception as e:
        import logging
        logging.error(f"Error in delete_user_issue: {str(e)}")
        raise

# Test endpoint to verify basic functionality
@router.post("/test", response_model=dict)
async def test_issue_creation(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Test endpoint to verify basic issue creation works"""
    try:
        # Create a simple test issue
        test_issue = IssueCreate(title="Test Issue", description="Test Description")
        result = await issue_crud.add_issue(db, test_issue, user.uid)
        
        # Return a simple dict instead of the complex model
        return {
            "message": "Test issue created successfully",
            "issue_id": str(result.issue_id),
            "title": result.title,
            "status": result.status
        }
    except Exception as e:
        import logging
        logging.error(f"Error in test_issue_creation: {str(e)}")
        raise
