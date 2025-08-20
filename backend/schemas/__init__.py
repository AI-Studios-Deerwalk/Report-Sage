"""
Pydantic schemas module
Request and response models for API endpoints
"""

# Import schemas here
from .user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserResponsePrivate,
    UserLogin,
    UserPasswordChange,
    EmailVerificationRequest,
    EmailVerificationConfirm,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from .user_otp import (
    UserOTPBase,
    UserOTPCreate,
    UserOTPUpdate,
    UserOTPResponse,
    UserOTPVerify,
    UserOTPRequest,
    UserOTPResend,
    UserOTPStatus,
)

__all__ = [
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserResponsePrivate",
    "UserLogin",
    "UserPasswordChange",
    "EmailVerificationRequest",
    "EmailVerificationConfirm",
    "PasswordResetRequest",
    "PasswordResetConfirm",
    "UserOTPBase",
    "UserOTPCreate",
    "UserOTPUpdate",
    "UserOTPResponse",
    "UserOTPVerify",
    "UserOTPRequest",
    "UserOTPResend",
    "UserOTPStatus",
]
