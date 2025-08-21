"""
Pydantic schemas for User model validation and serialization
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator


class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr = Field(..., description="User's email address")
    fname: str = Field(..., min_length=1, max_length=128, description="User's first name")
    lname: str = Field(..., min_length=1, max_length=128, description="User's last name")
    phone_number: Optional[str] = Field(None, max_length=20, description="User's phone number")


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, max_length=128, description="User's password (min 8 characters)")
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    fname: Optional[str] = Field(None, min_length=1, max_length=128)
    lname: Optional[str] = Field(None, min_length=1, max_length=128)
    phone_number: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response (public information)"""
    uid: str = Field(..., description="User's unique identifier")
    is_email_verified: bool = Field(..., description="Whether email is verified")
    created_at: datetime = Field(..., description="When the user was created")
    is_active: bool = Field(..., description="Whether the user account is active")
    
    class Config:
        from_attributes = True


class UserResponsePrivate(UserResponse):
    """Schema for user response with private information (for the user themselves)"""
    updated_at: datetime = Field(..., description="When the user was last updated")
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class UserPasswordChange(BaseModel):
    """Schema for changing user password"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    @validator('new_password')
    def validate_new_password(cls, v):
        """Validate new password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class EmailVerificationRequest(BaseModel):
    """Schema for requesting email verification"""
    email: EmailStr = Field(..., description="Email address to verify")


class EmailVerificationConfirm(BaseModel):
    """Schema for confirming email verification"""
    token: str = Field(..., description="Email verification token")


class PasswordResetRequest(BaseModel):
    """Schema for requesting password reset"""
    email: EmailStr = Field(..., description="Email address for password reset")


class PasswordReset(BaseModel):
    """Schema for resetting password with OTP"""
    email: EmailStr = Field(..., description="Email address for password reset")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    otp_code: str = Field(..., description="OTP code for verification")
    
    @validator('new_password')
    def validate_new_password(cls, v):
        """Validate new password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v
