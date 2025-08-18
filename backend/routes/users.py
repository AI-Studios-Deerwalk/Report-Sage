"""
User management routes
User profile and admin management endpoints
"""

from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.connection import get_db_session
from ..crud import user_crud
from ..schemas.user import UserResponse, UserUpdate, UserResponsePrivate
from ..models.user import User, UserRole
from .dependencies import (
    get_current_active_user,
    get_verified_user,
    require_teacher
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


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of users to return"),
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in name, email, or college"),
    current_user: User = Depends(require_teacher),
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
        role=role,
        is_active=is_active,
        search=search
    )
    
    return users


@router.get("/count", response_model=dict)
async def get_user_count(
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(require_teacher),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get user count with filtering (Teachers only)
    
    - **role**: Filter by role (student/teacher)
    - **is_active**: Filter by active status
    
    Requires teacher authentication
    """
    count = await user_crud.count_users(session, role=role, is_active=is_active)
    
    return {
        "total_users": count,
        "filters": {
            "role": role.value if role else None,
            "is_active": is_active
        }
    }


@router.get("/college/{college_name}", response_model=List[UserResponse])
async def get_users_by_college(
    college_name: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_teacher),
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
    current_user: User = Depends(require_teacher),
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
    current_user: User = Depends(require_teacher),
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
    current_user: User = Depends(require_teacher),
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
    current_user: User = Depends(require_teacher),
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
    current_user: User = Depends(require_teacher),
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
    current_user: User = Depends(require_teacher),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get students from the same college as the teacher
    
    - **skip**: Number of students to skip
    - **limit**: Maximum number of students to return
    - **search**: Search in student names or emails
    
    Requires teacher authentication
    """
    # Get students from the same college as the teacher
    students = await user_crud.get_all(
        session,
        skip=skip,
        limit=limit,
        role=UserRole.STUDENT,
        is_active=True,
        search=search
    )
    
    # Filter by college (could also be done in the query)
    college_students = [
        student for student in students 
        if student.college_name == current_user.college_name
    ]
    
    return college_students


@router.get("/stats/dashboard", response_model=dict)
async def get_dashboard_stats(
    current_user: User = Depends(require_teacher),
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
    students = await user_crud.count_users(session, role=UserRole.STUDENT)
    teachers = await user_crud.count_users(session, role=UserRole.TEACHER)
    
    # Get college-specific stats
    college_users = await user_crud.get_users_by_college(
        session, 
        current_user.college_name, 
        limit=1000
    )
    college_students = len([u for u in college_users if u.role == UserRole.STUDENT])
    college_teachers = len([u for u in college_users if u.role == UserRole.TEACHER])
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "students": students,
        "teachers": teachers,
        "college_stats": {
            "college_name": current_user.college_name,
            "total_users": len(college_users),
            "students": college_students,
            "teachers": college_teachers
        }
    }
