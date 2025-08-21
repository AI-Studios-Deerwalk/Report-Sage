"""
Admin management routes
Admin authentication and user management endpoints
"""

from typing import List, Optional
from datetime import datetime, timedelta
from jose import jwt
from fastapi import APIRouter, Depends, HTTPException, status, Query, Security
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.connection import get_db_session
from crud.admin import admin_crud
from schemas.admin import AdminLogin, AdminResponse, AdminLoginResponse
from schemas.user import UserResponse
from models.admin import Admin
from .dependencies_admin import get_current_active_admin 
from utils.password import hash_password
import os

router = APIRouter()


@router.post("/seed", response_model=AdminResponse)
async def seed_admin(session: AsyncSession = Depends(get_db_session)):
    # Check if admin already exists
    result = await session.execute(select(Admin).where(Admin.email == "swornima.shrestha04@gmail.com"))
    existing_admin = result.scalars().first()

    if existing_admin:
        return AdminResponse(
            aid=existing_admin.aid,
            email=existing_admin.email,
            is_active=existing_admin.is_active
        )
    
    # Create a new admin if not exists
    hashed_pw = hash_password("Swornima123")
    new_admin = Admin(email="swornima.shrestha04@gmail.com", password=hashed_pw, is_active=True)
    session.add(new_admin)
    await session.commit()
    await session.refresh(new_admin)
    return AdminResponse(
        aid=new_admin.aid,
        email=new_admin.email,
        is_active=new_admin.is_active,
        created_at=new_admin.created_at
    )


# ---------- Authentication ----------

ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour expiry

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(
    login_data: AdminLogin,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Admin login with email and password.
    Returns admin profile if credentials are valid.
    """
    admin = await admin_crud.authenticate(session, login_data)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        # Generate JWT
    access_token = create_access_token(data={"sub": str(admin.aid)})

    return AdminLoginResponse(
        access_token=access_token,
        admin=AdminResponse(
            aid=admin.aid,
            email=admin.email,
            is_active=admin.is_active,
            created_at=admin.created_at
        )
    )
   


# ---------- User Management (Admin only) ----------

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of users to return"),
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    List all users (Admin only)
    """
    users = await admin_crud.list_users(session, skip=skip, limit=limit)
    return users


@router.get("/users/count", response_model=dict)
async def count_users(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Count users with optional active filter (Admin only)
    """
    total = await admin_crud.count_users(session, is_active=is_active)
    return {"total_users": total, "filters": {"is_active": is_active}}


@router.post("/users/block/{user_id}", response_model=dict)
async def block_user(
    user_id: int,
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Block (deactivate) a user (Admin only)
    """
    success = await admin_crud.block_user(session, user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User blocked successfully"}


@router.post("/users/unblock/{user_id}", response_model=dict)
async def unblock_user(
    user_id: int,
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Unblock (reactivate) a user (Admin only)
    """
    success = await admin_crud.unblock_user(session, user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User unblocked successfully"}


@router.delete("/users/delete/{user_id}", response_model=dict)
async def delete_user_permanently(
    user_id: int,
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Permanently delete a user (Admin only)
    """
    success = await admin_crud.delete_user_permanently(session, user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User deleted permanently"}
