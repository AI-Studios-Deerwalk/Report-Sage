from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

class AnalysisItem(BaseModel):
    type: str = Field(..., description="Type of analysis item (suggestion, warning, error)")
    message: str = Field(..., description="The analysis message")
    severity: Optional[str] = Field("medium", description="Severity level (low, medium, high)")
    category: Optional[str] = Field(None, description="Category of the item")
    page_number: Optional[int] = Field(None, description="Page number where issue was found")
    section: Optional[str] = Field(None, description="Section where issue was found")

class ArchiveBase(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    analysis_content: Optional[str] = None
    # Use default_factory to avoid mutable default pitfalls
    suggestions: List[AnalysisItem] = Field(default_factory=list)
    warnings: List[AnalysisItem] = Field(default_factory=list)
    errors: List[AnalysisItem] = Field(default_factory=list)
    processing_status: str = Field(default="pending")

class ArchiveCreate(ArchiveBase):
    file_path: Optional[str] = None
    file_size: Optional[int] = None

class ArchiveUpdate(BaseModel):
    file_name: Optional[str] = None
    analysis_content: Optional[str] = None
    suggestions: Optional[List[AnalysisItem]] = None
    warnings: Optional[List[AnalysisItem]] = None
    errors: Optional[List[AnalysisItem]] = None
    processing_status: Optional[str] = None
    error_message: Optional[str] = None

class ArchiveResponse(ArchiveBase):
    id: int
    user_id: int
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ArchiveListResponse(BaseModel):
    archives: List[ArchiveResponse]
    total: int
    page: int
    size: int
    total_pages: int

class ArchiveAnalysisRequest(BaseModel):
    archive_id: int
    
class ArchiveAnalysisResponse(BaseModel):
    archive_id: int
    status: str
    message: str
    suggestions_count: int = 0
    warnings_count: int = 0
    errors_count: int = 0