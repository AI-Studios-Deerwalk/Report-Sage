from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

class AnalysisItem(BaseModel):
    type: str = Field(..., description="Type of analysis item (motivation, methods, results, conclusion, overall)")
    message: str = Field(..., description="The analysis message")
    page_number: Optional[int] = Field(None, description="Page number where issue was found")

class ArchiveBase(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    # Use default_factory to avoid mutable default pitfalls
    analysis_results: List[AnalysisItem] = Field(default_factory=list)
    summary_data: Optional[Dict[str, Any]] = None
    processing_status: str = Field(default="pending")
    
    # Individual analysis results
    abstract_results: Optional[List[AnalysisItem]] = None
    abstract_summary: Optional[Dict[str, Any]] = None
    acknowledgement_results: Optional[List[AnalysisItem]] = None
    acknowledgement_summary: Optional[Dict[str, Any]] = None
    
    # Individual analysis status
    abstract_status: str = Field(default="pending")
    acknowledgement_status: str = Field(default="pending")
    abstract_error: Optional[str] = None
    acknowledgement_error: Optional[str] = None

class ArchiveCreate(ArchiveBase):
    file_path: Optional[str] = None
    file_size: Optional[int] = None

class ArchiveUpdate(BaseModel):
    file_name: Optional[str] = None
    analysis_results: Optional[List[AnalysisItem]] = None
    summary_data: Optional[Dict[str, Any]] = None
    processing_status: Optional[str] = None
    error_message: Optional[str] = None
    
    # Individual analysis results
    abstract_results: Optional[List[AnalysisItem]] = None
    abstract_summary: Optional[Dict[str, Any]] = None
    acknowledgement_results: Optional[List[AnalysisItem]] = None
    acknowledgement_summary: Optional[Dict[str, Any]] = None
    
    # Individual analysis status
    abstract_status: Optional[str] = None
    acknowledgement_status: Optional[str] = None
    abstract_error: Optional[str] = None
    acknowledgement_error: Optional[str] = None

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
    analysis_results_count: int = 0