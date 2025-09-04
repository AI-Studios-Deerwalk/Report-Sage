"""
API Routes module
FastAPI routes for all endpoints
"""

from fastapi import APIRouter
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.faq import router as faq_router
from routes.admin import router as admin_router
from routes.archive import router as archive_router
from routes.issue import router as issue_router
from routes.config import router as config_router
from routes.document_rules import router as document_rules_router

# Create main API router
api_router = APIRouter(prefix="/api/v1")

# Include all route modules
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(faq_router, prefix="/faq", tags=["FAQ"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
api_router.include_router(archive_router, prefix="/archive", tags=["Archive"])
api_router.include_router(issue_router, prefix="/issue", tags=["Issues"])
api_router.include_router(config_router, tags=["Admin Config"])
api_router.include_router(document_rules_router, tags=["Document Rules"])

__all__ = ["api_router"]
