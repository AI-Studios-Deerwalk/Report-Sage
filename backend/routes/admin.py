"""
Admin management routes
Admin authentication and user management endpoints
Enhanced with email functionality
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from jose import jwt
from fastapi import APIRouter, Depends, HTTPException, status, Query, Security, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.connection import get_db_session
from crud.admin import admin_crud
from schemas.admin import AdminLogin, AdminResponse, AdminLoginResponse, AdminCreate
from schemas.user import UserResponse
from models.admin import Admin
from .dependencies_admin import get_current_active_admin 
from utils.password import hash_password
from utils.email_service import send_email
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
        is_active=existing_admin.is_active,
        is_superadmin=existing_admin.is_superadmin,
        created_at=existing_admin.created_at
    )
    
    # Create a new admin if not exists
    hashed_pw = hash_password("Swornima123")
    new_admin = Admin(email="swornima.shrestha04@gmail.com", password=hashed_pw, is_active=True, is_superadmin=True)
    session.add(new_admin)
    await session.commit()
    await session.refresh(new_admin)
    return AdminResponse(
        aid=new_admin.aid,
        email=new_admin.email,
        is_active=new_admin.is_active,
        is_superadmin=new_admin.is_superadmin,
        created_at=new_admin.created_at
    )


@router.post("/create", response_model=AdminResponse)
async def create_admin(
    admin_data: AdminCreate,
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Create a new admin (Super Admin only)
    """
    # Check if current admin is super admin
    if not current_admin.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can create new admin accounts"
        )
    
    # Check if email already exists
    result = await session.execute(select(Admin).where(Admin.email == admin_data.email))
    existing_admin = result.scalars().first()
    
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin with this email already exists"
        )
    
    # Create new admin with hashed password
    hashed_password = hash_password(admin_data.password)
    new_admin = Admin(
        email=admin_data.email,
        password=hashed_password,
        is_active=True,
        is_superadmin=(admin_data.role == "super_admin")  # Set based on role
    )
    
    session.add(new_admin)
    await session.commit()
    await session.refresh(new_admin)
    
    return AdminResponse(
        aid=new_admin.aid,
        email=new_admin.email,
        is_active=new_admin.is_active,
        is_superadmin=new_admin.is_superadmin,
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
    request: Request,
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
            is_superadmin=admin.is_superadmin,
            created_at=admin.created_at
        )
    )


@router.get("/list", response_model=List[AdminResponse])
async def list_admins(
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    List all admin accounts (Super Admin only)
    """
    # Check if current admin is super admin
    if not current_admin.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can view admin list"
        )
    
    # Get all admins
    result = await session.execute(select(Admin).order_by(Admin.created_at.desc()))
    admins = result.scalars().all()
    
    return [
        AdminResponse(
            aid=admin.aid,
            email=admin.email,
            is_active=admin.is_active,
            is_superadmin=admin.is_superadmin,
            created_at=admin.created_at
        )
        for admin in admins
    ]


@router.delete("/{admin_id}", response_model=dict)
async def delete_admin(
    admin_id: int,
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Delete an admin account (Super Admin only)
    """
    # Check if current admin is super admin
    if not current_admin.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can delete admin accounts"
        )
    
    # Prevent self-deletion
    if admin_id == current_admin.aid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Get the admin to delete
    result = await session.execute(select(Admin).where(Admin.aid == admin_id))
    admin_to_delete = result.scalars().first()
    
    if not admin_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin account not found"
        )
    
    # Prevent deletion of super admins
    if admin_to_delete.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete super admin accounts"
        )
    
    # Delete the admin
    await session.delete(admin_to_delete)
    await session.commit()
    
    return {"message": "Admin account deleted successfully"}


# ---------- Enhanced User Management (Admin only) ----------

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of users to return"),
    search: Optional[str] = Query(None, description="Search term for email, first name, or last name"),
    status_filter: Optional[str] = Query(None, description="Filter by status: active, blocked, inactive, verified, unverified"),
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    List all users with search and filtering (Admin only)
    """
    users = await admin_crud.list_users(session, skip=skip, limit=limit, search=search, status_filter=status_filter)
    return users


@router.get("/users/stats", response_model=Dict[str, Any])
async def get_user_statistics(
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get comprehensive user statistics (Admin only)
    """
    stats = await admin_crud.get_user_stats(session)
    return stats


@router.get("/users/count", response_model=dict)
async def count_users(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_blocked: Optional[bool] = Query(None, description="Filter by blocked status"),
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Count users with optional filters (Admin only)
    """
    total = await admin_crud.count_users(session, is_active=is_active, is_blocked=is_blocked)
    return {"total_users": total, "filters": {"is_active": is_active, "is_blocked": is_blocked}}


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_details(
    user_id: int,
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get detailed user information (Admin only)
    """
    user = await admin_crud.get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


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


@router.post("/users/verify/{user_id}", response_model=dict)
async def verify_user_email(
    user_id: int,
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Manually verify a user's email (Admin only)
    """
    success = await admin_crud.verify_user_email(session, user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return {"message": "User email verified successfully"}


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


# ---------- Email Management ----------

@router.post("/users/{user_id}/send-email")
async def send_user_email(
    user_id: int,
    email_data: dict,
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Send email to a specific user (Admin only)
    """
    user = await admin_crud.get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    try:
        # Send email using the email service
        await send_email(
            to_email=user.email,
            subject=email_data.get("subject", "Message from Admin"),
            body=email_data.get("body", ""),
            html_content=email_data.get("html_content")
        )
        
        return {"message": f"Email sent successfully to {user.email}"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to send email: {str(e)}")


@router.post("/users/bulk-email")
async def send_bulk_email(
    email_data: dict,
    user_ids: List[int] = Query(..., description="List of user IDs to send email to"),
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Send email to multiple users (Admin only)
    """
    users = []
    for user_id in user_ids:
        user = await admin_crud.get_user_by_id(session, user_id)
        if user:
            users.append(user)
    
    if not users:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No valid users found")
    
    success_count = 0
    failed_emails = []
    
    for user in users:
        try:
            await send_email(
                to_email=user.email,
                subject=email_data.get("subject", "Message from Admin"),
                body=email_data.get("body", ""),
                html_content=email_data.get("html_content")
            )
            success_count += 1
        except Exception as e:
            failed_emails.append({"email": user.email, "error": str(e)})
    
    return {
        "message": f"Bulk email completed",
        "success_count": success_count,
        "failed_count": len(failed_emails),
        "failed_emails": failed_emails
    }


# ---------- Archive Statistics ----------

@router.get("/archives/stats")
async def get_archive_statistics(
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get archive statistics for admin dashboard (Admin only)
    """
    try:
        from crud.archive import archive as crud_archive
        
        # Get total count and max ID using async CRUD methods
        try:
            from crud.archive import archive as crud_archive
            
            total_count = await crud_archive.get_total_count_async(session)
            max_id = await crud_archive.get_max_id_async(session)
            
            print(f"Archive stats - Total: {total_count}, Max ID: {max_id}")
        except Exception as db_error:
            print(f"Database error: {str(db_error)}")
            # Fallback to simple count
            try:
                result = await session.execute("SELECT COUNT(*) FROM archives")
                total_count = result.scalar() or 0
                max_id = total_count  # Use count as fallback for max_id
                print(f"Fallback archive stats - Total: {total_count}, Max ID: {max_id}")
            except Exception as fallback_error:
                print(f"Fallback error: {str(fallback_error)}")
                total_count = 0
                max_id = 0
        
        return {
            "total_archives": total_count,
            "max_id": max_id,
            "total_pages_analyzed": max_id,  # This represents total pages analyzed
            "debug_info": {
                "table_name": "archives",
                "query_success": True
            }
        }
    except Exception as e:
        print(f"Error in archive stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to fetch archive statistics: {str(e)}"
        )
