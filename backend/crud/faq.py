"""
FAQ CRUD Operations
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, cast, Integer
from models.faq import FAQ
from schemas.faq import FAQCreate, FAQUpdate, FAQResponse
from utils.pagination import PaginationParams, PaginatedResult

class FAQCRUD:
    """FAQ CRUD operations"""

    async def create_faq(self, session: AsyncSession, faq_data: FAQCreate) -> FAQ:
        new_faq = FAQ(
            question=faq_data.question,
            answer=faq_data.answer,
            priority=faq_data.priority,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(new_faq)
        await session.flush()
        return new_faq
    
    async def create_faqs_bulk(self, session: AsyncSession, faqs_data: List[FAQCreate]) -> List[FAQ]:
        new_faqs = [
            FAQ(
                question=faq.question,
                answer=faq.answer,
                priority=faq.priority,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            for faq in faqs_data
        ]
        session.add_all(new_faqs)
        await session.flush()
        return new_faqs

    async def get_faq_by_id(self, session: AsyncSession, faq_fid: int) -> Optional[FAQ]:
        result = await session.execute(select(FAQ).where(FAQ.fid == faq_fid))
        return result.scalar_one_or_none()

    async def update_faq(self, session: AsyncSession, faq_fid: int, faq_data: FAQUpdate) -> Optional[FAQ]:
        faq = await self.get_faq_by_id(session, faq_fid)
        if not faq:
            return None
        if faq_data.question is not None:
            faq.question = faq_data.question
        if faq_data.answer is not None:
            faq.answer = faq_data.answer
        if faq_data.priority is not None:
            faq.priority = faq_data.priority
        faq.updated_at = datetime.utcnow()
        await session.flush()
        return faq

    async def delete_faq(self, session: AsyncSession, faq_fid: int) -> bool:
        faq = await self.get_faq_by_id(session, faq_fid)
        if not faq:
            return False
        await session.delete(faq)
        await session.flush()
        return True

    async def list_faqs(
        self,
        session: AsyncSession,
        pagination: PaginationParams,
        only_active: bool = False,
        sort_by_priority: bool = True
    ) -> PaginatedResult[FAQResponse]:
        query = select(FAQ)
        # Note: FAQ model doesn't have is_active field, so we ignore the only_active parameter
        # TODO: Add is_active field to FAQ model if needed
        
        # Add priority sorting if requested
        if sort_by_priority:
            # Sort by priority (null values last), then by creation date
            # Use a safer approach for priority sorting
            query = query.order_by(
                FAQ.priority.is_(None),  # Null values last
                FAQ.priority.asc(),      # String-based priority (works for numeric strings)
                FAQ.created_at.desc()    # Newer items first for same priority
            )
        else:
            # Default sorting by creation date (newest first)
            query = query.order_by(FAQ.created_at.desc())
        
        total_result = await session.execute(query)
        total_count = (await session.execute(select(func.count()).select_from(query.subquery()))).scalar()

        query = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size)
        result = await session.execute(query)
        faqs = result.scalars().all()

        return PaginatedResult(
            items=faqs,
            total=total_count,
            page=pagination.page,
            page_size=pagination.page_size
        )
    
# Global instance
faq_crud = FAQCRUD()