"""
Database models module
SQLAlchemy ORM models for database tables
"""

# Import models here
from .user import User
from .user_otp import UserOTP
from .admin import Admin
from .faq import FAQ

__all__ = ["User", "UserOTP", "Admin","FAQ"]
