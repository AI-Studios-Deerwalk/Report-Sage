"""
Authentication routes
User authentication endpoints (login, register, password management)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db_session
from crud import user_crud, user_otp_crud
from schemas.user import (
    UserCreate, 
    UserLogin, 
    UserPasswordChange,
    UserResponse,
    EmailVerificationRequest,
    PasswordResetRequest,
    PasswordReset
)
from .dependencies import (
    get_current_active_user, 
    create_token_response,
    get_current_user
)
from models.user import User
from utils.email_service import email_service

router = APIRouter()


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Register a new user and send email verification OTP
    
    - **email**: Valid email address (must be unique)
    - **password**: Strong password (min 8 chars, uppercase, lowercase, digit)
    - **fname**: First name
    - **lname**: Last name
    - **phone_number**: Optional phone number
    """
    try:
        # Create user
        user = await user_crud.create(session, user_data)
        
        # Create email verification OTP
        otp = await user_otp_crud.create_otp(
            session=session,
            user_id=user.uid,
            for_purpose="verification",
            expires_in_minutes=10,
            otp_length=6
        )
        
        # Send OTP email
        try:
            email_sent = email_service.send_otp_email(
                recipient_email=user.email,
                recipient_name=user.fname,
                otp_code=otp.otp_code
            )
        except Exception as email_error:
            # Log the error but don't fail registration
            print(f"⚠️ Email sending failed: {email_error}")
            print(f"📧 OTP Code for {user.email}: {otp.otp_code}")
            email_sent = False
        
        # Create token response
        token_response = create_token_response(user)
        
        return {
            **token_response,
            "user_id": user.uid,
            "email_sent": email_sent,
            "otp_expires_in": 600,  # 10 minutes in seconds
            "message": "User registered successfully. Please verify your email."
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=dict)
async def login_user(
    login_data: UserLogin,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Login with email and password
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns JWT access token and user information
    """
    # Authenticate user
    user = await user_crud.authenticate(session, login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token response
    token_response = create_token_response(user)
    
    return {
        **token_response,
        "message": "Login successful"
    }


@router.post("/change-password", response_model=dict)
async def change_password(
    password_data: UserPasswordChange,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Change user password
    
    - **current_password**: Current password for verification
    - **new_password**: New strong password
    
    Requires authentication
    """
    try:
        success = await user_crud.change_password(session, current_user.uid, password_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        return {"message": "Password changed successfully"}
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/verify-email", response_model=dict)
async def verify_email(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Verify user email address
    
    This is a simplified version - in production you'd send an email with a token
    For now, it just marks the email as verified
    
    Requires authentication
    """
    success = await user_crud.verify_email(session, current_user.uid)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email verification failed"
        )
    
    return {"message": "Email verified successfully"}


@router.post("/request-email-verification", response_model=dict)
async def request_email_verification(
    request_data: EmailVerificationRequest,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Request email verification
    
    - **email**: Email address to verify
    
    In production, this would send a verification email
    For now, it just confirms the email exists
    """
    user = await user_crud.get_by_email(session, request_data.email)
    
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a verification link has been sent"}
    
    if user.is_email_verified:
        return {"message": "Email is already verified"}
    
    # In production: send verification email here
    return {"message": "Verification email sent (simulated)"}


@router.post("/request-password-reset", response_model=dict)
async def request_password_reset(
    request_data: PasswordResetRequest,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Request password reset
    
    - **email**: Email address for password reset
    
    Sends OTP to registered email for password reset verification
    """
    user = await user_crud.get_by_email(session, request_data.email)
    
    if not user:
        # Don't reveal if email exists or not for security
        return {
            "message": "If the email exists, an OTP has been sent to the registered email",
            "user_id": None,
            "email_sent": False
        }
    
    try:
        # Create OTP for password reset
        otp = await user_otp_crud.create_otp(
            session,
            user_id=user.uid,
            for_purpose="forgot_password",
            expires_in_minutes=2,
            otp_length=6
        )
        
        # Send OTP email
        email_sent = email_service.send_otp_email(
            recipient_email=user.email,
            recipient_name=f"{user.fname} {user.lname}",
            otp_code=otp.otp_code
        )
        
        await session.commit()
        
        return {
            "message": "OTP sent to registered email",
            "user_id": user.uid,
            "email_sent": email_sent,
            "otp_expires_in": 120
        }
        
    except Exception as e:
        await session.rollback()
        return {
            "message": "If the email exists, an OTP has been sent to the registered email",
            "user_id": None,
            "email_sent": False
        }


@router.post("/reset-password", response_model=dict)
async def reset_password(
    password_data: PasswordReset,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Reset password with OTP verification
    
    - **email**: User's email
    - **new_password**: New password
    - **otp_code**: OTP code from email
    
    Requires valid OTP to reset password
    """
    # Get user by email
    user = await user_crud.get_by_email(session, password_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify OTP for password reset
    is_valid, otp_obj = await user_otp_crud.verify_otp(
        session, 
        user.uid, 
        password_data.otp_code, 
        "forgot_password"
    )
    if not is_valid:
        if otp_obj is None:
            detail = "No valid OTP found"
        else:
            attempts_left = max(0, 5 - otp_obj.attempts)
            detail = f"Invalid OTP. {attempts_left} attempts remaining."
        
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )
    
    # Reset password
    success = await user_crud.reset_password(session, password_data.email, password_data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )
    
    await session.commit()
    return {"message": "Password reset successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information
    
    Returns the authenticated user's profile information
    Requires authentication
    """
    return current_user


@router.post("/verify-otp", response_model=dict)
async def verify_otp(
    user_id: int = Body(...),
    otp_code: str = Body(...),
    for_purpose: str = Body("verification"),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Verify OTP code for email verification
    
    - **user_id**: User ID (returned from registration)
    - **otp_code**: 6-digit OTP code from email
    """
    try:
        # Verify OTP for email verification
        is_valid, otp_obj = await user_otp_crud.verify_otp(
            session, 
            user_id, 
            otp_code, 
            for_purpose
        )
        
        if not is_valid:
            if otp_obj is None:
                detail = "No valid OTP found"
            else:
                attempts_left = max(0, 5 - otp_obj.attempts)
                detail = f"Invalid OTP. {attempts_left} attempts remaining."
            
            await session.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detail
            )
        
        # Mark email as verified
        await user_crud.verify_email(session, user_id)
        await session.commit()
        
        return {
            "message": "Email verified successfully",
            "verified": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Verification failed"
        )


@router.post("/resend-otp", response_model=dict)
async def resend_otp(
    user_id: int = Body(...),
    for_purpose: str = Body("verification"),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Resend OTP code to user's email
    
    - **user_id**: User ID to resend OTP to
    - **for_purpose**: Purpose of the OTP (verification or forgot_password)
    """
    try:
        # Get user
        user = await user_crud.get_by_id(session, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create new OTP
        otp = await user_otp_crud.resend_otp(session, user_id, for_purpose)
        if not otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to generate OTP"
            )
        
        # Send email
        email_sent = email_service.send_otp_email(
            recipient_email=user.email,
            recipient_name=f"{user.fname} {user.lname}",
            otp_code=otp.otp_code
        )
        
        await session.commit()
        
        return {
            "message": "OTP resent successfully",
            "email_sent": email_sent,
            "otp_expires_in": 120
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resend OTP"
        )


@router.post("/logout", response_model=dict)
async def logout_user():
    """
    Logout user
    
    Since we're using JWT tokens, logout is handled client-side
    by deleting the token. This endpoint is for consistency.
    """
    return {"message": "Logged out successfully"}


@router.get("/check-email/{email}", response_model=dict)
async def check_email_availability(
    email: str,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Check if email is available for registration
    
    - **email**: Email address to check
    """
    user = await user_crud.get_by_email(session, email)
    
    return {
        "email": email,
        "available": user is None,
        "message": "Email is available" if user is None else "Email is already taken"
    }
