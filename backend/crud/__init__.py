"""
CRUD operations module
Database operations for all models
"""

from .user import user_crud
from .user_otp import user_otp_crud
from .admin import admin_crud
from .faq import faq_crud

__all__ = ["user_crud", "user_otp_crud", "admin_crud"," faq_crud"]
