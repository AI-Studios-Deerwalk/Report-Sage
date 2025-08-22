"""
API Routes module
FastAPI routes for all endpoints
"""

from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router

# Create main API router
api_router = APIRouter(prefix="/api/v1")

# Include all route modules
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])

__all__ = ["api_router"]
