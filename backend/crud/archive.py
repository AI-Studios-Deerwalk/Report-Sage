from sqlalchemy.orm import Session
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
        data["suggestions"] = self._normalize_items(data.get("suggestions")) or []
        data["warnings"] = self._normalize_items(data.get("warnings")) or []
        data["errors"] = self._normalize_items(data.get("errors")) or []
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
        if "suggestions" in data and data["suggestions"] is not None:
            data["suggestions"] = self._normalize_items(data["suggestions"]) or []
        if "warnings" in data and data["warnings"] is not None:
            data["warnings"] = self._normalize_items(data["warnings"]) or []
        if "errors" in data and data["errors"] is not None:
            data["errors"] = self._normalize_items(data["errors"]) or []
        return super().update(db, db_obj=db_obj, obj_in=data)

    def update_analysis_results(
        self,
        db: Session,
        *,
        archive_id: int,
        analysis_content: str,
        suggestions: Optional[List[AnalysisItem]] = None,
        warnings: Optional[List[AnalysisItem]] = None,
        errors: Optional[List[AnalysisItem]] = None,
        status: str = "completed",
    ) -> Optional[Archive]:
        archive = db.query(Archive).filter(Archive.id == archive_id).first()
        if not archive:
            return None
        archive.analysis_content = analysis_content
        archive.processing_status = status
        if status == "completed":
            archive.error_message = None
        if suggestions is not None:
            archive.suggestions = self._normalize_items(suggestions) or []
        if warnings is not None:
            archive.warnings = self._normalize_items(warnings) or []
        if errors is not None:
            archive.errors = self._normalize_items(errors) or []
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

    def count_by_user(self, db: Session, *, user_id: int) -> int:
        return db.query(Archive).filter(Archive.user_id == user_id).count()


archive = CRUDArchive(Archive)