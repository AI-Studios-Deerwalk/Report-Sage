"""
User model for the Report Rage application
"""

from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class User(Base):
    """User model for authentication and profile management"""
    
    __tablename__ = "users"
    
    # Primary key
    uid = Column(
        Integer, 
        primary_key=True, 
        autoincrement=True,
        index=True
    )
    
    # Basic info
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # Will store hashed password
    fname = Column(String(128), nullable=False)  # First name
    lname = Column(String(128), nullable=False)  # Last name
    phone_number = Column(String(20), nullable=True)  # Phone number
    
    # Academic info removed
    
    # Verification
    is_email_verified = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    otps = relationship("UserOTP", back_populates="user")
    
    def __repr__(self):
        return f"<User(uid={self.uid}, email='{self.email}', name='{self.fname} {self.lname}')>"
    
    def to_dict(self):
        """Convert user object to dictionary for JSON serialization"""
        return {
            "uid": self.uid,
            "email": self.email,
            "fname": self.fname,
            "lname": self.lname,
            "phone_number": self.phone_number,
            "is_email_verified": self.is_email_verified,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "is_active": self.is_active
        }
    
    def to_public_dict(self):
        """Convert user object to dictionary without sensitive information"""
        return {
            "uid": self.uid,
            "fname": self.fname,
            "lname": self.lname,
            "phone_number": self.phone_number,
            "is_email_verified": self.is_email_verified,
            "created_at": self.created_at.isoformat()
        }
