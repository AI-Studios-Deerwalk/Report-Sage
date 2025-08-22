"""
User Activity model for tracking user actions and history
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

from models.base import Base


class UserActivity(Base):
    """User Activity model for tracking user actions and history"""
    
    __tablename__ = "user_activities"
    
    # Primary key
    id = Column(
        Integer, 
        primary_key=True, 
        autoincrement=True,
        index=True
    )
    
    # Foreign key to user
    user_id = Column(Integer, ForeignKey("users.uid"), nullable=False, index=True)
    
    # Activity details
    action_type = Column(String(100), nullable=False)  # e.g., 'login', 'upload', 'download', 'profile_update'
    action_description = Column(Text, nullable=True)  # Detailed description of the action
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6 address
    user_agent = Column(Text, nullable=True)  # Browser/device information
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", backref="activities")
    
    def __repr__(self):
        return f"<UserActivity(id={self.id}, user_id={self.user_id}, action='{self.action_type}')>"
    
    def to_dict(self):
        """Convert activity object to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "action_type": self.action_type,
            "action_description": self.action_description,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat()
        }
