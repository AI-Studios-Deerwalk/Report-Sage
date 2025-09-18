from sqlalchemy import Column, Integer, String, Text, JSON, Boolean, DateTime
from datetime import datetime
from .base import Base

class DocumentRule(Base):
    __tablename__ = "document_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    chunk_id = Column(String, unique=True, index=True, nullable=True)
    university = Column(String, index=True, nullable=True)  # "TU", "KU", "PU", etc.
    degree_program = Column(String, index=True, nullable=True)  # "BScCSIT", "BCA", "BBA", etc.
    chapter = Column(String, index=True, nullable=True)  # "1", "2", "3"
    section = Column(String, index=True, nullable=True)  # "1.1", "1.2"
    subsection = Column(String, nullable=True)  # "1.1.1"
    title = Column(String, nullable=True)
    rules = Column(Text, nullable=True)
    required_elements = Column(JSON, nullable=True)  # List of required elements
    quality_criteria = Column(JSON, nullable=True)   # List of quality criteria
    examples = Column(JSON, nullable=True)          # List of examples
    common_mistakes = Column(JSON, nullable=True)   # List of common mistakes
    priority = Column(Integer, nullable=True)       # 1=critical, 2=important, 3=recommended
    is_active = Column(Boolean, default=True, nullable=True)
    version = Column(Integer, default=1, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)
