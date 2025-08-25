"""
dependencies_admin.py - Dependencies for Admin authentication and authorization
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import db_manager
from crud.admin import admin_crud
from schemas.admin import AdminResponse  # use correct schema
from utils.password import verify_password
import os
from typing import AsyncGenerator

# OAuth2 scheme for admins
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/admin/login")

# Secret & Algorithm (load from env variables in production)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Provide DB session for dependencies"""
    async with db_manager.get_async_session() as session:
        yield session


async def get_current_admin(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_db),
):
    """
    Extract and validate current admin from JWT.
    Returns the **DB admin model**.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id: str = payload.get("sub")
        if admin_id is None:
            raise credentials_exception
        
        # 🔥 Cast to int (since DB uses integer PK)
        admin_id = int(admin_id)

    except JWTError:
        raise credentials_exception

    admin = await admin_crud.get_by_id(session, admin_id)
    if admin is None:
        raise credentials_exception

    return admin  # this is DB model, not schema


async def get_current_active_admin(
    current_admin=Depends(get_current_admin),
):
    """
    Ensure admin is active (not blocked).
    Returns the DB model directly.
    """
    if getattr(current_admin, "is_blocked", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is blocked",
        )

    # Return the DB model directly
    return current_admin
