from pydantic import BaseModel, StringConstraints
from typing import Annotated,Optional
from datetime import datetime
from uuid import UUID
from enum import Enum
from .user import UserResponse

class IssueStatusEnum(str, Enum):
    pending = "pending"
    inprogress = "inprogress"
    resolved = "resolved"
    closed = "closed"

class IssueCreate(BaseModel):
    title: Annotated[str, StringConstraints(max_length=255)]
    description: str
    image: Optional[str] = None  # could be URL or base64 encoded

class IssueResponse(BaseModel):
    issue_id: UUID
    title: str
    description: str
    image: Optional[str]
    status: IssueStatusEnum
    created_at: datetime
    uid: int  # Changed from user_id to uid
    user: Optional[UserResponse] = None
    is_read: bool = False  # New field for read status

    class Config:
        from_attributes = True


class IssueUpdateStatus(BaseModel):
    status: IssueStatusEnum

class IssueUpdateRead(BaseModel):
    is_read: bool