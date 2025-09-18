from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class DocumentRuleBase(BaseModel):
    chunk_id: Optional[str] = None
    university: Optional[str] = None
    degree_program: Optional[str] = None
    chapter: Optional[str] = None
    section: Optional[str] = None
    subsection: Optional[str] = None
    title: Optional[str] = None
    rules: Optional[str] = None
    required_elements: Optional[List[str]] = None
    quality_criteria: Optional[List[str]] = None
    examples: Optional[List[str]] = None
    common_mistakes: Optional[List[str]] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = True
    version: Optional[int] = 1
    created_by: Optional[str] = None

class DocumentRuleCreate(DocumentRuleBase):
    pass

class DocumentRuleUpdate(BaseModel):
    chunk_id: Optional[str] = None
    university: Optional[str] = None
    degree_program: Optional[str] = None
    chapter: Optional[str] = None
    section: Optional[str] = None
    subsection: Optional[str] = None
    title: Optional[str] = None
    rules: Optional[str] = None
    required_elements: Optional[List[str]] = None
    quality_criteria: Optional[List[str]] = None
    examples: Optional[List[str]] = None
    common_mistakes: Optional[List[str]] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    version: Optional[int] = None
    created_by: Optional[str] = None

class DocumentRule(DocumentRuleBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class DocumentRuleResponse(BaseModel):
    success: bool
    data: Optional[DocumentRule] = None
    message: str

class DocumentRuleListResponse(BaseModel):
    success: bool
    data: List[DocumentRule]
    total: int
    message: str
