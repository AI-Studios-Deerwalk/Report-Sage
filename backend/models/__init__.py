"""
Database models module
SQLAlchemy ORM models for database tables
"""

# Import models here
from models.user import User
from models.user_otp import UserOTP
from models.archive import Archive
from models.admin import Admin
from models.faq import FAQ
from models.issue import Issue
from models.config import Config
from models.document_rules import DocumentRule

__all__ = ["User", "UserOTP", "Archive", "Admin", "FAQ", "Issue", "Config", "DocumentRule"]
