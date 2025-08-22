import uuid
from sqlalchemy import Column, String, Text, Enum, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from models.base import Base
import enum



class IssueStatusEnum(str, enum.Enum):
    pending = "pending"
    inprogress = "inprogress"
    resolved = "resolved"
    closed = "closed"

class Issue(Base):
    __tablename__ = "issues"

    issue_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column("uid",Integer, ForeignKey("users.uid"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    image = Column(String, nullable=True)  
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(IssueStatusEnum), nullable=False, default=IssueStatusEnum.pending)

    def __repr__(self):
        return f"<Issue(issue_id={self.issue_id}, title='{self.title}', status='{self.status}')>"