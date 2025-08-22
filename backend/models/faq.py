from sqlalchemy import Column, Integer, String, Text, DateTime, func
from models.base import Base
from datetime import datetime

class FAQ(Base):
    """FAQ model for storing frequently asked questions and answers"""

    __tablename__ = "faqs"

    # Primary key
    fid = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # Question and Answer fields
    question = Column(String(255), nullable=False, index=True)
    answer = Column(Text, nullable=False)
    priority = Column(String(50), nullable=True, index=True)
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<FAQ(fid={self.fid}, question='{self.question}')>"