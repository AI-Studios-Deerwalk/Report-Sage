"""
Pagination utilities
"""

from typing import Generic, List, TypeVar, Optional
from pydantic import BaseModel
from pydantic.generics import GenericModel

T = TypeVar("T")

class PaginationParams(BaseModel):
    """Parameters for pagination requests"""
    page: int = 1
    page_size: int = 10

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

class PaginatedResult(GenericModel, Generic[T]):
    """Standard structure for paginated API responses"""
    items: List[T]
    total: int
    page: int
    page_size: int
    next_page: Optional[int] = None
    prev_page: Optional[int] = None
    
    model_config = {
        "from_attributes": True,  # Pydantic V2 replacement for orm_mode
        "arbitrary_types_allowed": True
    }
    def __init__(self, **data):
        
        super().__init__(**data)
        # set prev/next automatically
        if self.page > 1:
            self.prev_page = self.page - 1
        if (self.page * self.page_size) < self.total:
            self.next_page = self.page + 1
    
