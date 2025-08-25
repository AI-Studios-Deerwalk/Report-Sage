from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from typing import Optional, List
from models.config import Config
from schemas.config import ConfigCreate, ConfigUpdate
import uuid

class ConfigCRUD:
    # Async methods
    async def create(self, db: AsyncSession, config_data: ConfigCreate) -> Config:
        """Create a new config entry"""
        config_id = str(uuid.uuid4())
        db_config = Config(
            id=config_id,
            **config_data.model_dump()
        )
        db.add(db_config)
        await db.commit()
        await db.refresh(db_config)
        return db_config
    
    async def get_by_id(self, db: AsyncSession, config_id: str) -> Optional[Config]:
        """Get config by ID"""
        result = await db.execute(select(Config).filter(Config.id == config_id))
        return result.scalar_one_or_none()
    
    async def get_email_config(self, db: AsyncSession) -> Optional[Config]:
        """Get the email configuration (assuming single config for now)"""
        result = await db.execute(select(Config).limit(1))
        return result.scalar_one_or_none()
    
    async def get_all(self, db: AsyncSession) -> List[Config]:
        """Get all configs"""
        result = await db.execute(select(Config))
        return result.scalars().all()
    
    async def update(self, db: AsyncSession, config_id: str, config_data: ConfigUpdate) -> Optional[Config]:
        """Update config by ID"""
        db_config = await self.get_by_id(db, config_id)
        if not db_config:
            return None
        
        update_data = config_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_config, field, value)
        
        await db.commit()
        await db.refresh(db_config)
        return db_config
    
    async def delete(self, db: AsyncSession, config_id: str) -> bool:
        """Delete config by ID"""
        db_config = await self.get_by_id(db, config_id)
        if not db_config:
            return False
        
        await db.delete(db_config)
        await db.commit()
        return True
    
    async def upsert_email_config(self, db: AsyncSession, config_data: ConfigCreate) -> Config:
        """Create or update email configuration"""
        existing_config = await self.get_email_config(db)
        
        if existing_config:
            # Update existing config
            update_data = ConfigUpdate(**config_data.model_dump())
            return await self.update(db, existing_config.id, update_data)
        else:
            # Create new config
            return await self.create(db, config_data)
    
    # Synchronous methods for initialization
    def get_email_config_sync(self, db: Session) -> Optional[Config]:
        """Get the email configuration synchronously"""
        result = db.execute(select(Config).limit(1))
        return result.scalar_one_or_none()
    
    def create_sync(self, db: Session, config_data: ConfigCreate) -> Config:
        """Create a new config entry synchronously"""
        config_id = str(uuid.uuid4())
        db_config = Config(
            id=config_id,
            **config_data.model_dump()
        )
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config
    
    def update_sync(self, db: Session, config_id: str, config_data: ConfigUpdate) -> Optional[Config]:
        """Update config by ID synchronously"""
        db_config = db.get(Config, config_id)
        if not db_config:
            return None
        
        update_data = config_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_config, field, value)
        
        db.commit()
        db.refresh(db_config)
        return db_config
    
    def upsert_email_config_sync(self, db: Session, config_data: ConfigCreate) -> Config:
        """Create or update email configuration synchronously"""
        existing_config = self.get_email_config_sync(db)
        
        if existing_config:
            # Update existing config
            update_data = ConfigUpdate(**config_data.model_dump())
            return self.update_sync(db, existing_config.id, update_data)
        else:
            # Create new config
            return self.create_sync(db, config_data)

config_crud = ConfigCRUD()
