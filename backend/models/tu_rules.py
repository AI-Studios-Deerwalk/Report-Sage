from sqlalchemy import Column, Integer, String, Text, JSON, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class TURule(Base):
    __tablename__ = "tu_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    chunk_id = Column(String, unique=True, index=True, nullable=True)
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
