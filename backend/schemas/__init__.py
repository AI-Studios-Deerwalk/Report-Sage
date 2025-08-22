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
    PasswordReset,
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

# For admin schemas
from .admin import *

# For FAQ schemas
from .faq import *

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
    "PasswordReset",
    "UserOTPBase",
    "UserOTPCreate",
    "UserOTPUpdate",
    "UserOTPResponse",
    "UserOTPVerify",
    "UserOTPRequest",
    "UserOTPResend",
    "UserOTPStatus",
]
