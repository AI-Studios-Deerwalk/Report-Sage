"""
Admin model for the Report Sage application
"""

from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from models.base import Base

class Admin(Base):
    """Admin model for authentication and system management"""

    __tablename__ = "admins"

    # Primary key
    aid = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        index=True
    )

    # Credentials
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # hashed password

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<Admin(aid={self.aid}, email='{self.email}')>"
