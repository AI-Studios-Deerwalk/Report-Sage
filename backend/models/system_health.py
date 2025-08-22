"""
System Health model for tracking system metrics and health status
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Float, Text, Boolean
from sqlalchemy.orm import relationship

from models.base import Base


class SystemHealth(Base):
    """System Health model for tracking system metrics and health status"""
    
    __tablename__ = "system_health"
    
    # Primary key
    id = Column(
        Integer, 
        primary_key=True, 
        autoincrement=True,
        index=True
    )
    
    # System metrics
    cpu_usage = Column(Float, nullable=True)  # CPU usage percentage
    memory_usage = Column(Float, nullable=True)  # Memory usage percentage
    disk_usage = Column(Float, nullable=True)  # Disk usage percentage
    active_connections = Column(Integer, nullable=True)  # Number of active database connections
    
    # Application metrics
    total_users = Column(Integer, nullable=True)  # Total registered users
    active_users_24h = Column(Integer, nullable=True)  # Users active in last 24 hours
    total_uploads = Column(Integer, nullable=True)  # Total file uploads
    total_analyses = Column(Integer, nullable=True)  # Total analyses performed
    
    # Status
    is_healthy = Column(Boolean, default=True, nullable=False)  # Overall system health
    status_message = Column(Text, nullable=True)  # Status description
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<SystemHealth(id={self.id}, is_healthy={self.is_healthy}, created_at='{self.created_at}')>"
    
    def to_dict(self):
        """Convert system health object to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "cpu_usage": self.cpu_usage,
            "memory_usage": self.memory_usage,
            "disk_usage": self.disk_usage,
            "active_connections": self.active_connections,
            "total_users": self.total_users,
            "active_users_24h": self.active_users_24h,
            "total_uploads": self.total_uploads,
            "total_analyses": self.total_analyses,
            "is_healthy": self.is_healthy,
            "status_message": self.status_message,
            "created_at": self.created_at.isoformat()
        }
