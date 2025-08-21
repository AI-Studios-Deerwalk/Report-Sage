"""
Pydantic schemas for Admin model validation and serialization
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator


class AdminBase(BaseModel):
    """Base admin schema with common fields"""
    email: EmailStr = Field(..., description="Admin email address")


class AdminCreate(AdminBase):
    """Schema for creating a new admin (for seeding or future use)"""
    password: str = Field(..., min_length=8, max_length=128, description="Admin password")

    @validator("password")
    def validate_password(cls, v: str) -> str:
        """Validate password strength similar to UserCreate"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class AdminLogin(BaseModel):
    """Schema for admin login"""
    email: EmailStr = Field(..., description="Admin email")
    password: str = Field(..., description="Admin password")


class AdminPasswordChange(BaseModel):
    """Schema for changing admin password (optional helper)"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")

    @validator("new_password")
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class AdminResponse(AdminBase):
    """Schema for returning admin details (safe/public info)"""
    aid: int = Field(..., description="Admin ID")
    is_active: bool = Field(..., description="Active status")
    created_at: datetime = Field(..., description="Creation timestamp")


    class Config:
        from_attributes = True

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminResponse  

    class Config:
        orm_mode = True