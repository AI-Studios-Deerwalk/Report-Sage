"""
FAQ management routes
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db_session
from crud.faq import faq_crud
from models.faq import FAQ
from schemas.faq import FAQCreate, FAQUpdate, FAQResponse
from utils.pagination import PaginationParams, PaginatedResult
from .dependencies_admin import get_current_active_admin
from models.admin import Admin

router = APIRouter()

# -------------------- Public / Read Endpoints --------------------

@router.get("/getAll", response_model=PaginatedResult[FAQResponse])
async def list_faqs(
    session: AsyncSession = Depends(get_db_session),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of FAQs per page"),
    only_active: bool = Query(False, description="Filter only active FAQs")
):
    """
    List FAQs with pagination (public)
    """
    pagination = PaginationParams(page=page, page_size=page_size)
    result = await faq_crud.list_faqs(session, pagination, only_active=only_active)
    return result

@router.get("/{fid}", response_model=FAQResponse)
async def get_faq(fid: int, session: AsyncSession = Depends(get_db_session)):
    """
    Get a FAQ by its ID (public)
    """
    faq = await faq_crud.get_faq_by_id(session, fid)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return faq





# -------------------- Admin-only Endpoints --------------------

@router.post("/create", response_model=FAQResponse)
async def create_faq(
    faq_data: FAQCreate,
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Create a new FAQ (Admin only)
    """
    faq = await faq_crud.create_faq(session, faq_data)
    await session.commit()
    await session.refresh(faq)
    return faq


@router.put("/update/{fid}", response_model=FAQResponse)
async def update_faq(
    fid: int,
    faq_data: FAQUpdate,
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Update a FAQ (Admin only)
    """
    faq = await faq_crud.update_faq(session, fid, faq_data)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    await session.commit()
    await session.refresh(faq)
    return faq


@router.delete("/delete/{fid}", response_model=dict)
async def delete_faq(
    fid: int,
    current_admin: Admin = Security(get_current_active_admin),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Delete a FAQ permanently (Admin only)
    """
    deleted = await faq_crud.delete_faq(session, fid)
    if not deleted:
        raise HTTPException(status_code=404, detail="FAQ not found")
    await session.commit()
    return {"message": "FAQ deleted successfully", "fid": fid}
