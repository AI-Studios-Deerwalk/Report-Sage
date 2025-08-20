"""
User OTP model for the Report Rage application
"""

from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class UserOTP(Base):
    """User OTP model for one-time password verification"""
    
    __tablename__ = "user_otps"
    
    # Primary key
    id = Column(
        Integer, 
        primary_key=True, 
        autoincrement=True,
        index=True
    )
    
    # Foreign key to users table
    user_id = Column(
        Integer, 
        ForeignKey("users.uid"), 
        nullable=False, 
        index=True
    )
    
    # OTP details
    otp_code = Column(String(10), nullable=False)  # OTP code (usually 6 digits)
    expires_at = Column(DateTime, nullable=False)  # Expiration timestamp
    is_used = Column(Boolean, default=False, nullable=False)  # Whether OTP has been used
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Security
    attempts = Column(Integer, default=0, nullable=False)  # Number of attempts made
    
    # Relationship
    user = relationship("User", back_populates="otps")
    
    def __repr__(self):
        return f"<UserOTP(id={self.id}, user_id={self.user_id}, otp_code='{self.otp_code}', is_used={self.is_used})>"
    
    def to_dict(self):
        """Convert OTP object to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "otp_code": self.otp_code,
            "expires_at": self.expires_at.isoformat(),
            "is_used": self.is_used,
            "created_at": self.created_at.isoformat(),
            "attempts": self.attempts
        }
    
    def is_expired(self):
        """Check if the OTP has expired"""
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self):
        """Check if the OTP is valid (not used and not expired)"""
        return not self.is_used and not self.is_expired()
    
    def increment_attempts(self):
        """Increment the number of attempts"""
        self.attempts += 1
    
    def mark_as_used(self):
        """Mark the OTP as used"""
        self.is_used = True
