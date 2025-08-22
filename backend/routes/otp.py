"""
OTP routes
OTP generation, verification, and management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db_session
from crud import user_crud, user_otp_crud
from schemas.user_otp import (
    UserOTPRequest,
    UserOTPVerify, 
    UserOTPResend,
    UserOTPStatus,
    UserOTPResponse
)
from schemas.user import UserResponse
from utils.email_service import email_service
from models.user import User
from .dependencies import get_current_user

router = APIRouter()


@router.post("/send", response_model=dict, status_code=status.HTTP_201_CREATED)
async def send_otp(
    otp_request: UserOTPRequest,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Send OTP to user's email
    
    - **user_id**: User ID to send OTP to
    - **purpose**: Purpose of OTP (default: "verification")
    """
    try:
        # Get user details
        user = await user_crud.get_by_id(session, otp_request.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Invalidate any existing OTPs for this user
        await user_otp_crud.invalidate_user_otps(session, otp_request.user_id)
        
        # Create new OTP
        otp = await user_otp_crud.create_otp(
            session, 
            user_id=otp_request.user_id,
            expires_in_minutes=10,  # OTP expires in 10 minutes
            otp_length=6  # 6-digit OTP
        )
        
        # Send OTP email
        email_sent = await email_service.send_otp_email(
            recipient_email=user.email,
            recipient_name=f"{user.fname} {user.lname}",
            otp_code=otp.otp_code
        )
        
        if not email_sent:
            # If email fails, still return success but note it in response
            await session.commit()
            return {
                "message": "OTP generated successfully",
                "email_sent": False,
                "note": "Email service not configured. Check logs for OTP code.",
                "expires_in": 600  # 10 minutes in seconds
            }
        
        await session.commit()
        
        return {
            "message": "OTP sent successfully to your email",
            "email_sent": True,
            "expires_in": 600  # 10 minutes in seconds
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP"
        )


@router.post("/verify", response_model=dict)
async def verify_otp(
    otp_verify: UserOTPVerify,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Verify OTP code
    
    - **user_id**: User ID
    - **otp_code**: OTP code to verify
    """
    try:
        # Verify OTP
        is_valid, otp_obj = await user_otp_crud.verify_otp(
            session, 
            otp_verify.user_id, 
            otp_verify.otp_code
        )
        
        if not is_valid:
            if otp_obj is None:
                detail = "No valid OTP found for this user"
            else:
                detail = f"Invalid OTP code. {max(0, 5 - otp_obj.attempts)} attempts remaining."
            
            await session.commit()  # Save the attempt count
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detail
            )
        
        # Mark user email as verified if this was for email verification
        user = await user_crud.get_by_id(session, otp_verify.user_id)
        if user and not user.is_email_verified:
            await user_crud.verify_email(session, otp_verify.user_id)
            
            # Send welcome email
            await email_service.send_welcome_email(
                recipient_email=user.email,
                recipient_name=f"{user.fname} {user.lname}"
            )
        
        await session.commit()
        
        return {
            "message": "OTP verified successfully",
            "verified": True,
            "email_verified": True if user and not user.is_email_verified else False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify OTP"
        )


@router.post("/resend", response_model=dict)
async def resend_otp(
    resend_request: UserOTPResend,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Resend OTP to user's email
    
    - **user_id**: User ID to resend OTP to
    """
    try:
        # Get user details
        user = await user_crud.get_by_id(session, resend_request.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create new OTP (this will invalidate old ones)
        otp = await user_otp_crud.resend_otp(
            session, 
            user_id=resend_request.user_id,
            expires_in_minutes=10
        )
        
        if not otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to generate new OTP"
            )
        
        # Send OTP email
        email_sent = await email_service.send_otp_email(
            recipient_email=user.email,
            recipient_name=f"{user.fname} {user.lname}",
            otp_code=otp.otp_code
        )
        
        await session.commit()
        
        return {
            "message": "OTP resent successfully" if email_sent else "OTP generated successfully",
            "email_sent": email_sent,
            "expires_in": 600  # 10 minutes in seconds
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resend OTP"
        )


@router.get("/status/{user_id}", response_model=UserOTPStatus)
async def get_otp_status(
    user_id: int,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get OTP status for a user
    
    - **user_id**: User ID to check OTP status for
    """
    try:
        # Verify user exists
        user = await user_crud.get_by_id(session, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get OTP status
        status_info = await user_otp_crud.get_otp_status(session, user_id)
        
        return UserOTPStatus(
            user_id=user_id,
            has_valid_otp=status_info["has_valid_otp"],
            expires_in=status_info["expires_in"],
            attempts_remaining=status_info["attempts_remaining"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get OTP status"
        )


@router.delete("/cleanup", response_model=dict)
async def cleanup_expired_otps(
    session: AsyncSession = Depends(get_db_session)
):
    """
    Cleanup expired and used OTPs
    
    This endpoint can be called periodically to clean up the database
    """
    try:
        count = await user_otp_crud.cleanup_expired_otps(session)
        await session.commit()
        
        return {
            "message": f"Cleaned up {count} expired/used OTPs",
            "cleaned_count": count
        }
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup OTPs"
        )


@router.get("/user/{user_id}/history", response_model=list[UserOTPResponse])
async def get_user_otp_history(
    user_id: int,
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get OTP history for a user (for admins or the user themselves)
    
    - **user_id**: User ID to get OTP history for
    - **skip**: Number of records to skip
    - **limit**: Maximum number of records to return
    """
    # Check if user is accessing their own history or is an admin
    if current_user.uid != user_id:
        # In a real app, you'd check for admin role here
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own OTP history"
        )
    
    try:
        otps = await user_otp_crud.get_all_otps_by_user(
            session, 
            user_id, 
            skip=skip, 
            limit=limit
        )
        
        return [UserOTPResponse.from_orm(otp) for otp in otps]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get OTP history"
        )
