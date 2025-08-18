"""
User model for the Report Rage application
"""

from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum

Base = declarative_base()


class UserRole(enum.Enum):
    """User role enumeration"""
    STUDENT = "student"
    TEACHER = "teacher"


class User(Base):
    """User model for authentication and profile management"""
    
    __tablename__ = "users"
    
    # Primary key
    uid = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        index=True
    )
    
    # Basic info
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # Will store hashed password
    name = Column(String(255), nullable=False)
    
    # Academic info
    college_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    
    # Verification
    is_email_verified = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    def __repr__(self):
        return f"<User(uid={self.uid}, email='{self.email}', name='{self.name}', role='{self.role.value}')>"
    
    def to_dict(self):
        """Convert user object to dictionary for JSON serialization"""
        return {
            "uid": str(self.uid),
            "email": self.email,
            "name": self.name,
            "college_name": self.college_name,
            "role": self.role.value,
            "is_email_verified": self.is_email_verified,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "is_active": self.is_active
        }
    
    def to_public_dict(self):
        """Convert user object to dictionary without sensitive information"""
        return {
            "uid": str(self.uid),
            "name": self.name,
            "college_name": self.college_name,
            "role": self.role.value,
            "is_email_verified": self.is_email_verified,
            "created_at": self.created_at.isoformat()
        }
