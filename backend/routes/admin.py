"""
Admin management routes
Admin authentication and user management endpoints
Enhanced with user activity tracking, system health monitoring, and email functionality
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from jose import jwt
from fastapi import APIRouter, Depends, HTTPException, status, Query, Security, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.connection import get_db_session
from crud.admin import admin_crud
from schemas.admin import AdminLogin, AdminResponse, AdminLoginResponse
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
    
    # Log admin login activity
    await admin_crud.log_user_activity(
        session, 
        admin.aid, 
        "admin_login", 
        f"Admin {admin.email} logged in",
        request.client.host if request.client else None,
        request.headers.get("user-agent")
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
    
    # Log the action
    await admin_crud.log_user_activity(
        session, 
        current_admin.aid, 
        "admin_block_user", 
        f"Admin blocked user ID {user_id}"
    )
    
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
    
    # Log the action
    await admin_crud.log_user_activity(
        session, 
        current_admin.aid, 
        "admin_unblock_user", 
        f"Admin unblocked user ID {user_id}"
    )
    
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
    
    # Log the action
    await admin_crud.log_user_activity(
        session, 
        current_admin.aid, 
        "admin_verify_user", 
        f"Admin manually verified user ID {user_id}"
    )
    
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
    
    # Log the action
    await admin_crud.log_user_activity(
        session, 
        current_admin.aid, 
        "admin_delete_user", 
        f"Admin permanently deleted user ID {user_id}"
    )
    
    return {"message": "User deleted permanently"}


# ---------- User Activity Tracking ----------

@router.get("/users/{user_id}/activities")
async def get_user_activities(
    user_id: int,
    limit: int = Query(50, ge=1, le=200, description="Number of activities to return"),
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get user activity history (Admin only)
    """
    activities = await admin_crud.get_user_activities(session, user_id, limit=limit)
    return [activity.to_dict() for activity in activities]


@router.get("/activities/recent")
async def get_recent_activities(
    limit: int = Query(100, ge=1, le=500, description="Number of recent activities to return"),
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get recent activities across all users (Admin only)
    """
    activities = await admin_crud.get_recent_activities(session, limit=limit)
    return [activity.to_dict() for activity in activities]


# ---------- System Health Monitoring ----------

@router.get("/system/health")
async def get_system_health(
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get current system health metrics (Admin only)
    """
    health_data = await admin_crud.get_system_health(session)
    
    # Save health data to database
    await admin_crud.save_system_health(session, health_data)
    
    return health_data


@router.get("/system/health/history")
async def get_health_history(
    hours: int = Query(24, ge=1, le=168, description="Number of hours of history to retrieve"),
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get system health history (Admin only)
    """
    health_history = await admin_crud.get_health_history(session, hours=hours)
    return [health.to_dict() for health in health_history]


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
        
        # Log the action
        await admin_crud.log_user_activity(
            session, 
            current_admin.aid, 
            "admin_send_email", 
            f"Admin sent email to user {user.email}: {email_data.get('subject', 'No subject')}"
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
    
    # Log the action
    await admin_crud.log_user_activity(
        session, 
        current_admin.aid, 
        "admin_bulk_email", 
        f"Admin sent bulk email to {success_count} users, {len(failed_emails)} failed"
    )
    
    return {
        "message": f"Bulk email completed",
        "success_count": success_count,
        "failed_count": len(failed_emails),
        "failed_emails": failed_emails
    }
