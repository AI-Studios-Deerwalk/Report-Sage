from pydantic import BaseModel, StringConstraints
from typing import Annotated,Optional
from datetime import datetime
from uuid import UUID
from enum import Enum

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

    class Config:
        orm_mode = True


class IssueUpdateStatus(BaseModel):
    status: IssueStatusEnum