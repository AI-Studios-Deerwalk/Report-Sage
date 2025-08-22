from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from .dependencies import get_current_user
from .dependencies_admin import get_current_active_admin, get_db
from crud.issue import issue_crud
from schemas.issue import IssueCreate, IssueResponse, IssueUpdateStatus

from models.user import User
from models.admin import Admin
from models.issue import Issue

router = APIRouter()


MAX_IMAGE_SIZE_MB = 2

# Authenticated user creates an issue
@router.post("/addIssue", response_model=IssueResponse)
async def add_issue(issue: IssueCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    #  Image size validation 
    if issue.image:
        image_size = len(issue.image.encode("utf-8")) / (1024 * 1024)
        if image_size > MAX_IMAGE_SIZE_MB:
            raise HTTPException(status_code=400, detail="Image exceeds 2MB limit")

    #  Check if user exists 
    result = await db.execute(select(User).where(User.uid == user.uid))
    user_exists = result.scalar_one_or_none()
    if not user_exists:
        raise HTTPException(status_code=404, detail="User not found")


    return await issue_crud.add_issue(db, issue, user.uid)

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
async def change_issue_status(issue_id: UUID, status: IssueUpdateStatus, db: AsyncSession = Depends(get_db), admin=Depends(get_current_active_admin)):
    updated_issue = await issue_crud.update_issue_status(db, issue_id, status)
    if not updated_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return updated_issue
