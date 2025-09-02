from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .user import Base

class Archive(Base):
    __tablename__ = "archives"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.uid"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    
    # Store abstract analysis results
    analysis_results = Column(JSON, nullable=True)  # Store analysis results as JSON array
    summary_data = Column(JSON, nullable=True)      # Store summary data as JSON object
    
    # Metadata
    file_size = Column(Integer, nullable=True)
    processing_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)  # Store processing errors
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    user = relationship("User", back_populates="archives")