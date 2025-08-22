"""
API Routes module
FastAPI routes for all endpoints
"""

from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router

# For admin routes
from .admin import router as admin_router

#For FAQs routes
from .faq import router as faq_router

# Create main API router
api_router = APIRouter(prefix="/api/v1")

# Include all route modules
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
api_router.include_router(faq_router, prefix="/faqs", tags=["FAQs"])

__all__ = ["api_router"]
