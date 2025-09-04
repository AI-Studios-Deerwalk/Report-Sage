from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, or_, select
from typing import List, Optional, Dict, Any
from models.document_rules import DocumentRule
from schemas.document_rules import DocumentRuleCreate, DocumentRuleUpdate
from datetime import datetime

class CRUDDocumentRules:
    async def get_by_id(self, db: AsyncSession, rule_id: int) -> Optional[DocumentRule]:
        """Get rule by ID"""
        result = await db.execute(select(DocumentRule).filter(DocumentRule.id == rule_id))
        return result.scalar_one_or_none()
    
    async def get_by_chunk_id(self, db: AsyncSession, chunk_id: str) -> Optional[DocumentRule]:
        """Get rule by chunk ID"""
        result = await db.execute(select(DocumentRule).filter(DocumentRule.chunk_id == chunk_id))
        return result.scalar_one_or_none()
    
    async def get_by_university(self, db: AsyncSession, university: str) -> List[DocumentRule]:
        """Get all rules for a specific university"""
        result = await db.execute(select(DocumentRule).filter(DocumentRule.university == university))
        return result.scalars().all()
    
    async def get_by_degree_program(self, db: AsyncSession, university: str, degree_program: str) -> List[DocumentRule]:
        """Get rules for a specific degree program in a university"""
        result = await db.execute(select(DocumentRule).filter(
            and_(
                DocumentRule.university == university,
                DocumentRule.degree_program == degree_program
            )
        ))
        return result.scalars().all()
    
    async def get_by_chapter(self, db: AsyncSession, university: str, chapter: str) -> List[DocumentRule]:
        """Get rules for a specific chapter in a university"""
        result = await db.execute(select(DocumentRule).filter(
            and_(
                DocumentRule.university == university,
                DocumentRule.chapter == chapter
            )
        ))
        return result.scalars().all()
    
    async def get_by_section(self, db: AsyncSession, university: str, section: str) -> List[DocumentRule]:
        """Get rules for a specific section in a university"""
        result = await db.execute(select(DocumentRule).filter(
            and_(
                DocumentRule.university == university,
                DocumentRule.section == section
            )
        ))
        return result.scalars().all()
    
    async def get_by_university_degree_and_chapter(self, db: AsyncSession, university: str, degree_program: str, chapter: str) -> List[DocumentRule]:
        """Get rules for a specific university, degree program and chapter"""
        result = await db.execute(select(DocumentRule).filter(
            and_(
                DocumentRule.university == university,
                DocumentRule.degree_program == degree_program,
                DocumentRule.chapter == chapter
            )
        ))
        return result.scalars().all()
    
    async def get_active_rules(self, db: AsyncSession, university: str) -> List[DocumentRule]:
        """Get all active rules for a university"""
        result = await db.execute(select(DocumentRule).filter(
            and_(
                DocumentRule.university == university,
                DocumentRule.is_active == True
            )
        ))
        return result.scalars().all()
    
    async def get_all_rules(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[DocumentRule]:
        """Get all rules with pagination"""
        result = await db.execute(select(DocumentRule).offset(skip).limit(limit))
        return result.scalars().all()
    
    async def search_rules(self, db: AsyncSession, university: str, query: str) -> List[DocumentRule]:
        """Search rules by text in title, rules, or content"""
        search_term = f"%{query}%"
        result = await db.execute(select(DocumentRule).filter(
            and_(
                DocumentRule.university == university,
                or_(
                    DocumentRule.title.ilike(search_term),
                    DocumentRule.rules.ilike(search_term),
                    DocumentRule.chunk_id.ilike(search_term)
                )
            )
        ))
        return result.scalars().all()
    
    async def create_rule(self, db: AsyncSession, rule_data: DocumentRuleCreate) -> DocumentRule:
        """Create a new rule"""
        db_rule = DocumentRule(**rule_data.dict())
        db.add(db_rule)
        await db.commit()
        await db.refresh(db_rule)
        return db_rule
    
    async def update_rule(self, db: AsyncSession, rule_id: int, rule_data: DocumentRuleUpdate) -> Optional[DocumentRule]:
        """Update an existing rule"""
        rule = await self.get_by_id(db, rule_id)
        if rule:
            update_data = rule_data.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(rule, key, value)
            rule.updated_at = datetime.utcnow()
            await db.commit()
            await db.refresh(rule)
        return rule
    
    async def delete_rule(self, db: AsyncSession, rule_id: int) -> bool:
        """Delete a rule"""
        rule = await self.get_by_id(db, rule_id)
        if rule:
            await db.delete(rule)
            await db.commit()
            return True
        return False
    
    async def deactivate_rule(self, db: AsyncSession, rule_id: int) -> Optional[DocumentRule]:
        """Deactivate a rule (soft delete)"""
        rule = await self.get_by_id(db, rule_id)
        if rule:
            rule.is_active = False
            await db.commit()
            await db.refresh(rule)
        return rule
    
    async def get_rule_hierarchy(self, db: AsyncSession, university: str) -> Dict[str, Any]:
        """Get organized rule hierarchy for a university"""
        rules = await self.get_active_rules(db, university)
        
        hierarchy = {}
        for rule in rules:
            chapter = rule.chapter or "unknown"
            section = rule.section or "unknown"
            
            if chapter not in hierarchy:
                hierarchy[chapter] = {}
            
            if section not in hierarchy[chapter]:
                hierarchy[chapter][section] = []
            
            hierarchy[chapter][section].append({
                "id": rule.id,
                "chunk_id": rule.chunk_id,
                "title": rule.title,
                "priority": rule.priority,
                "subsection": rule.subsection
            })
        
        return hierarchy

# Global instance for easy access
document_rules = CRUDDocumentRules()
