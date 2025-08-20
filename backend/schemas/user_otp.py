"""
Pydantic schemas for UserOTP model validation and serialization
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator


class UserOTPBase(BaseModel):
    """Base OTP schema with common fields"""
    user_id: int = Field(..., description="User ID associated with this OTP")
    otp_code: str = Field(..., min_length=4, max_length=10, description="OTP code")
    expires_at: datetime = Field(..., description="When the OTP expires")


class UserOTPCreate(UserOTPBase):
    """Schema for creating a new OTP"""
    pass


class UserOTPUpdate(BaseModel):
    """Schema for updating OTP information"""
    is_used: Optional[bool] = Field(None, description="Whether the OTP has been used")
    attempts: Optional[int] = Field(None, ge=0, description="Number of attempts made")


class UserOTPResponse(UserOTPBase):
    """Schema for OTP response (for internal use)"""
    id: int = Field(..., description="OTP unique identifier")
    is_used: bool = Field(..., description="Whether the OTP has been used")
    created_at: datetime = Field(..., description="When the OTP was created")
    attempts: int = Field(..., description="Number of attempts made")
    
    class Config:
        from_attributes = True


class UserOTPVerify(BaseModel):
    """Schema for OTP verification"""
    user_id: int = Field(..., description="User ID")
    otp_code: str = Field(..., min_length=4, max_length=10, description="OTP code to verify")
    
    @validator('otp_code')
    def validate_otp_code(cls, v):
        """Validate OTP code format"""
        if not v.isdigit():
            raise ValueError('OTP code must contain only digits')
        return v


class UserOTPRequest(BaseModel):
    """Schema for requesting an OTP"""
    user_id: int = Field(..., description="User ID to generate OTP for")
    purpose: Optional[str] = Field("verification", description="Purpose of the OTP (e.g., 'verification', 'reset')")


class UserOTPResend(BaseModel):
    """Schema for resending an OTP"""
    user_id: int = Field(..., description="User ID to resend OTP for")


class UserOTPStatus(BaseModel):
    """Schema for OTP status response"""
    user_id: int = Field(..., description="User ID")
    has_valid_otp: bool = Field(..., description="Whether user has a valid OTP")
    expires_in: Optional[int] = Field(None, description="Seconds until OTP expires")
    attempts_remaining: Optional[int] = Field(None, description="Remaining attempts allowed")
    
    class Config:
        from_attributes = True
