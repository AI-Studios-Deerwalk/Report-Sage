"""
User management routes
User profile and admin management endpoints
"""

from typing import List, Optional
import uuid
import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db_session
from crud import user_crud
from schemas.user import UserResponse, UserUpdate, UserResponsePrivate
from models.user import User
from .dependencies import (
    get_current_active_user,
    get_verified_user
)

router = APIRouter()


@router.get("/profile", response_model=UserResponsePrivate)
async def get_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's detailed profile
    
    Returns detailed profile information for the authenticated user
    Requires authentication
    """
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Update current user's profile
    
    - **name**: Updated full name (optional)
    - **college_name**: Updated college name (optional)
    - **role**: Updated role (optional)
    
    Requires authentication
    """
    updated_user = await user_crud.update(session, current_user.uid, user_update)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user


@router.post("/profile/upload", response_model=dict)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Upload profile picture for current user
    
    - **file**: Image file (JPEG, PNG, GIF)
    
    Requires authentication
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, and GIF images are allowed."
        )
    
    # Validate file size (5MB limit)
    max_size = 5 * 1024 * 1024  # 5MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB."
        )
    
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads/profile_images"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{timestamp}_{current_user.uid}.{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Generate URL path
    profile_url = f"/uploads/profile_images/{filename}"
    
    # Update user profile with new image URL
    user_update = UserUpdate(profile_url=profile_url)
    updated_user = await user_crud.update(session, current_user.uid, user_update)
    
    if not updated_user:
        # Clean up uploaded file if database update fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile picture"
        )
    
    return {
        "message": "Profile picture uploaded successfully",
        "profile_url": profile_url
    }


@router.delete("/profile/picture", response_model=dict)
async def delete_profile_picture(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Delete current user's profile picture
    
    Requires authentication
    """
    if not current_user.profile_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No profile picture found"
        )
    
    # Remove file from filesystem
    file_path = current_user.profile_url.lstrip('/')
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass  # Continue even if file deletion fails
    
    # Update user profile to remove image URL
    user_update = UserUpdate(profile_url=None)
    updated_user = await user_crud.update(session, current_user.uid, user_update)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove profile picture"
        )
    
    return {"message": "Profile picture deleted successfully"}


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of users to return"),
    # role parameter removed as part of migration
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in name, email, or college"),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get list of users (Teachers only)
    
    - **skip**: Number of users to skip (pagination)
    - **limit**: Maximum number of users to return
    - **role**: Filter by role (student/teacher)
    - **is_active**: Filter by active status
    - **search**: Search in name, email, or college name
    
    Requires teacher authentication
    """
    users = await user_crud.get_all(
        session,
        skip=skip,
        limit=limit,
        is_active=is_active,
        search=search
    )
    
    return users


@router.get("/count", response_model=dict)
async def get_user_count(
    # role parameter removed as part of migration
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get user count with filtering (Teachers only)
    
    - **role**: Filter by role (student/teacher)
    - **is_active**: Filter by active status
    
    Requires teacher authentication
    """
    count = await user_crud.count_users(session, is_active=is_active)
    
    return {
        "total_users": count,
        "filters": {
            "is_active": is_active
        }
    }


@router.get("/college/{college_name}", response_model=List[UserResponse])
async def get_users_by_college(
    college_name: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get users by college name (Teachers only)
    
    - **college_name**: Name of the college
    - **skip**: Number of users to skip
    - **limit**: Maximum number of users to return
    
    Requires teacher authentication
    """
    users = await user_crud.get_users_by_college(
        session, 
        college_name, 
        skip=skip, 
        limit=limit
    )
    
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get user by ID (Teachers only)
    
    - **user_id**: UUID of the user
    
    Requires teacher authentication
    """
    user = await user_crud.get_by_id(session, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_by_id(
    user_id: uuid.UUID,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Update user by ID (Teachers only)
    
    - **user_id**: UUID of the user to update
    - **user_update**: Fields to update
    
    Requires teacher authentication
    """
    updated_user = await user_crud.update(session, user_id, user_update)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user


@router.delete("/{user_id}", response_model=dict)
async def deactivate_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Deactivate user (soft delete) (Teachers only)
    
    - **user_id**: UUID of the user to deactivate
    
    This sets the user's is_active flag to False
    Requires teacher authentication
    """
    success = await user_crud.delete(session, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deactivated successfully"}


@router.delete("/{user_id}/permanent", response_model=dict)
async def delete_user_permanently(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Permanently delete user (Teachers only)
    
    - **user_id**: UUID of the user to delete permanently
    
    This permanently removes the user from the database
    Requires teacher authentication
    """
    success = await user_crud.hard_delete(session, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deleted permanently"}


@router.post("/{user_id}/verify-email", response_model=dict)
async def verify_user_email(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Verify user's email (Teachers only)
    
    - **user_id**: UUID of the user
    
    Marks the user's email as verified
    Requires teacher authentication
    """
    success = await user_crud.verify_email(session, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User email verified successfully"}


@router.get("/my/students", response_model=List[UserResponse])
async def get_my_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Search students"),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get students from the same college as the teacher
    
    - **skip**: Number of students to skip
    - **limit**: Maximum number of students to return
    - **search**: Search in student names or emails
    
    Requires teacher authentication
    """
    # Get all active users (role filtering removed as part of migration)
    students = await user_crud.get_all(
        session,
        skip=skip,
        limit=limit,
        is_active=True,
        search=search
    )
    
    # College filtering removed as part of migration
    college_students = students
    
    return college_students


@router.get("/stats/dashboard", response_model=dict)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get dashboard statistics (Teachers only)
    
    Returns various statistics about users in the system
    Requires teacher authentication
    """
    # Get counts
    total_users = await user_crud.count_users(session)
    active_users = await user_crud.count_users(session, is_active=True)
    
    # College-specific stats removed as part of migration
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users
    }
