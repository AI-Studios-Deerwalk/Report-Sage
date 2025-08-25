"""
CRUD operations module
Database operations for all models
"""

from crud.user import user_crud
from crud.user_otp import user_otp_crud
from crud.admin import admin_crud
from crud.faq import faq_crud
from crud.issue import issue_crud

__all__ = ["user_crud", "user_otp_crud", "admin_crud"," faq_crud","issue_curd"]
