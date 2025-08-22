"""
Pydantic schemas for FAQs
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class FAQBase(BaseModel):
    """Base FAQ schema with common fields"""
    question: str = Field(..., min_length=1, max_length=255, description="FAQ question")
    answer: str = Field(..., min_length=1, description="FAQ answer")


class FAQCreate(FAQBase):
    """Schema for creating a new FAQ"""
    pass

class FAQBulkCreate(BaseModel):
    faqs: List[FAQCreate]

    model_config = {
        "from_attributes": True
    }


class FAQUpdate(BaseModel):
    """Schema for updating an existing FAQ"""
    question: Optional[str] = Field(None, min_length=1, max_length=255, description="FAQ question")
    answer: Optional[str] = Field(None, min_length=1, description="FAQ answer")

class FAQResponse(FAQBase):
    """Schema for returning FAQ details"""
    fid: int = Field(..., description="FAQ ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        orm_mode = True

