from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from database.connection import get_db_session
from schemas.config import ConfigCreate, ConfigUpdate, ConfigResponse
from crud.config import config_crud
from routes.dependencies_admin import get_current_admin
from utils.email_service import email_service

router = APIRouter(prefix="/admin/config", tags=["Admin Config"])

@router.get("/email", response_model=ConfigResponse, dependencies=[Depends(get_current_admin)])
async def get_email_config(db: AsyncSession = Depends(get_db_session)):
    """Get current email configuration"""
    config = await config_crud.get_email_config(db)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email configuration not found"
        )
    return config

@router.post("/email", response_model=ConfigResponse, dependencies=[Depends(get_current_admin)])
async def create_email_config(
    config_data: ConfigCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """Create new email configuration"""
    try:
        config = await config_crud.create(db, config_data)
        # Refresh email service configuration
        await email_service.refresh_config_from_db(db)
        return config
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create email configuration: {str(e)}"
        )

@router.put("/email", response_model=ConfigResponse, dependencies=[Depends(get_current_admin)])
async def update_email_config(
    config_data: ConfigUpdate,
    db: AsyncSession = Depends(get_db_session)
):
    """Update email configuration"""
    existing_config = await config_crud.get_email_config(db)
    if not existing_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email configuration not found"
        )
    
    try:
        updated_config = await config_crud.update(db, existing_config.id, config_data)
        # Refresh email service configuration
        await email_service.refresh_config_from_db(db)
        return updated_config
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update email configuration: {str(e)}"
        )

@router.post("/email/upsert", response_model=ConfigResponse, dependencies=[Depends(get_current_admin)])
async def upsert_email_config(
    config_data: ConfigCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """Create or update email configuration"""
    try:
        config = await config_crud.upsert_email_config(db, config_data)
        # Refresh email service configuration
        await email_service.refresh_config_from_db(db)
        return config
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upsert email configuration: {str(e)}"
        )

@router.get("/all", response_model=List[ConfigResponse], dependencies=[Depends(get_current_admin)])
async def get_all_configs(db: AsyncSession = Depends(get_db_session)):
    """Get all configurations"""
    configs = await config_crud.get_all(db)
    return configs

@router.delete("/{config_id}", dependencies=[Depends(get_current_admin)])
async def delete_config(config_id: str, db: AsyncSession = Depends(get_db_session)):
    """Delete configuration by ID"""
    success = await config_crud.delete(db, config_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )
    return {"message": "Configuration deleted successfully"}

@router.post("/email/refresh", dependencies=[Depends(get_current_admin)])
async def refresh_email_service_config(db: AsyncSession = Depends(get_db_session)):
    """Manually refresh email service configuration from database"""
    try:
        success = await email_service.refresh_config_from_db(db)
        if success:
            return {"message": "Email service configuration refreshed successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No email configuration found in database"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh email service configuration: {str(e)}"
        )

@router.get("/email/status", dependencies=[Depends(get_current_admin)])
async def get_email_service_status():
    """Get current email service configuration status"""
    try:
        is_valid = email_service._validate_config()
        return {
            "is_configured": is_valid,
            "smtp_server": email_service.smtp_server,
            "smtp_port": email_service.smtp_port,
            "smtp_username": email_service.smtp_username,
            "from_email": email_service.from_email,
            "from_name": email_service.from_name,
            "has_password": bool(email_service.smtp_password)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get email service status: {str(e)}"
        )
