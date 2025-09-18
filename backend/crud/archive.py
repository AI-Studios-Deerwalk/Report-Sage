from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, desc
from typing import List, Optional, Any, Dict

from models.archive import Archive
from schemas.archive import ArchiveCreate, ArchiveUpdate, AnalysisItem
from crud.base import CRUDBase


class CRUDArchive(CRUDBase[Archive, ArchiveCreate, ArchiveUpdate]):
    @staticmethod
    def _normalize_items(items: Optional[List[Any]]) -> Optional[List[Dict[str, Any]]]:
        if items is None:
            return None
        out: List[Dict[str, Any]] = []
        for i in items:
            if isinstance(i, AnalysisItem):
                out.append(i.model_dump())
            elif isinstance(i, dict):
                out.append(i)
        return out

    def create_with_user(self, db: Session, *, obj_in: ArchiveCreate, user_id: int) -> Archive:
        data = obj_in.model_dump()
        data["user_id"] = user_id
        data["analysis_results"] = self._normalize_items(data.get("analysis_results")) or []
        db_obj = Archive(**data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_user(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[Archive]:
        return (
            db.query(Archive)
            .filter(Archive.user_id == user_id)
            .order_by(desc(Archive.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_user_and_id(self, db: Session, *, user_id: int, archive_id: int) -> Optional[Archive]:
        return (
            db.query(Archive)
            .filter(and_(Archive.user_id == user_id, Archive.id == archive_id))
            .first()
        )

    def update(self, db: Session, *, db_obj: Archive, obj_in: ArchiveUpdate) -> Archive:
        data = obj_in.model_dump(exclude_unset=True)
        if "analysis_results" in data and data["analysis_results"] is not None:
            data["analysis_results"] = self._normalize_items(data["analysis_results"]) or []
        return super().update(db, db_obj=db_obj, obj_in=data)

    def update_analysis_results(
        self,
        db: Session,
        *,
        archive_id: int,
        analysis_results: Optional[List[AnalysisItem]] = None,
        summary_data: Optional[Dict[str, Any]] = None,
        status: str = "completed",
    ) -> Optional[Archive]:
        archive = db.query(Archive).filter(Archive.id == archive_id).first()
        if not archive:
            return None
        
        archive.processing_status = status
        if status == "completed":
            archive.error_message = None
        
        if analysis_results is not None:
            archive.analysis_results = self._normalize_items(analysis_results) or []
        
        if summary_data is not None:
            archive.summary_data = summary_data
        
        db.commit()
        db.refresh(archive)
        return archive

    def update_processing_status(
        self,
        db: Session,
        *,
        archive_id: int,
        status: str,
        error_message: Optional[str] = None,
    ) -> Optional[Archive]:
        archive = db.query(Archive).filter(Archive.id == archive_id).first()
        if not archive:
            return None
        archive.processing_status = status
        archive.error_message = error_message
        db.commit()
        db.refresh(archive)
        return archive

    def update_abstract_analysis(
        self,
        db: Session,
        *,
        archive_id: int,
        abstract_results: Optional[List[AnalysisItem]] = None,
        abstract_summary: Optional[Dict[str, Any]] = None,
        status: str = "completed",
        error_message: Optional[str] = None,
    ) -> Optional[Archive]:
        archive = db.query(Archive).filter(Archive.id == archive_id).first()
        if not archive:
            return None
        
        archive.abstract_status = status
        if error_message:
            archive.abstract_error = error_message
        else:
            archive.abstract_error = None
            
        if abstract_results is not None:
            archive.abstract_results = self._normalize_items(abstract_results) or []
        
        if abstract_summary is not None:
            archive.abstract_summary = abstract_summary
        
        db.commit()
        db.refresh(archive)
        return archive

    def update_acknowledgement_analysis(
        self,
        db: Session,
        *,
        archive_id: int,
        acknowledgement_results: Optional[List[AnalysisItem]] = None,
        acknowledgement_summary: Optional[Dict[str, Any]] = None,
        status: str = "completed",
        error_message: Optional[str] = None,
    ) -> Optional[Archive]:
        archive = db.query(Archive).filter(Archive.id == archive_id).first()
        if not archive:
            return None
        
        archive.acknowledgement_status = status
        if error_message:
            archive.acknowledgement_error = error_message
        else:
            archive.acknowledgement_error = None
            
        if acknowledgement_results is not None:
            archive.acknowledgement_results = self._normalize_items(acknowledgement_results) or []
        
        if acknowledgement_summary is not None:
            archive.acknowledgement_summary = acknowledgement_summary
        
        db.commit()
        db.refresh(archive)
        return archive

    def count_by_user(self, db: Session, *, user_id: int) -> int:
        return db.query(Archive).filter(Archive.user_id == user_id).count()

    def get_total_count(self, db: Session) -> int:
        """Get total count of all archives"""
        return db.query(Archive).count()

    def get_max_id(self, db: Session) -> int:
        """Get the maximum ID from archives table"""
        result = db.query(Archive.id).order_by(Archive.id.desc()).first()
        return result[0] if result else 0

    async def get_total_count_async(self, db: AsyncSession) -> int:
        """Get total count of all archives (async version)"""
        result = await db.execute("SELECT COUNT(*) FROM archives")
        return result.scalar() or 0

    async def get_max_id_async(self, db: AsyncSession) -> int:
        """Get the maximum ID from archives table (async version)"""
        result = await db.execute("SELECT MAX(id) FROM archives")
        return result.scalar() or 0


archive = CRUDArchive(Archive)