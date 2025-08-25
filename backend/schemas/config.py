from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ConfigBase(BaseModel):
    smtp_server: str
    smtp_port: str
    smtp_username: str
    smtp_password: str
    from_email: EmailStr
    from_name: str

class ConfigCreate(ConfigBase):
    pass

class ConfigUpdate(BaseModel):
    smtp_server: Optional[str] = None
    smtp_port: Optional[str] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None

class ConfigResponse(ConfigBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
