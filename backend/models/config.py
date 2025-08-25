from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from .base import Base

class Config(Base):
    __tablename__ = "configs"
    
    id = Column(String(50), primary_key=True, index=True)
    smtp_server = Column(String(255), nullable=False)
    smtp_port = Column(String(10), nullable=False)
    smtp_username = Column(String(255), nullable=False)
    smtp_password = Column(String(255), nullable=False)
    from_email = Column(String(255), nullable=False)
    from_name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
