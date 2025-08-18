"""
Base CRUD operations
Generic CRUD operations that can be extended by specific model CRUDs
"""

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import DeclarativeBase

ModelType = TypeVar("ModelType", bound=DeclarativeBase)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base CRUD operations class"""
    
    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).
        
        Args:
            model: A SQLAlchemy model class
        """
        self.model = model
    
    async def get(self, session: AsyncSession, id: Any) -> Optional[ModelType]:
        """
        Get a single record by ID
        
        Args:
            session: Database session
            id: Record ID
            
        Returns:
            Model instance or None if not found
        """
        result = await session.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self, 
        session: AsyncSession, 
        *, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[ModelType]:
        """
        Get multiple records with pagination
        
        Args:
            session: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of model instances
        """
        result = await session.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()
    
    async def create(
        self, 
        session: AsyncSession, 
        *, 
        obj_in: CreateSchemaType
    ) -> ModelType:
        """
        Create a new record
        
        Args:
            session: Database session
            obj_in: Pydantic schema with creation data
            
        Returns:
            Created model instance
        """
        obj_in_data = obj_in.dict()
        db_obj = self.model(**obj_in_data)
        session.add(db_obj)
        await session.flush()
        await session.refresh(db_obj)
        return db_obj
    
    async def update(
        self,
        session: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """
        Update an existing record
        
        Args:
            session: Database session
            db_obj: Existing model instance
            obj_in: Pydantic schema or dict with update data
            
        Returns:
            Updated model instance
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        await session.flush()
        await session.refresh(db_obj)
        return db_obj
    
    async def remove(self, session: AsyncSession, *, id: Any) -> Optional[ModelType]:
        """
        Remove a record by ID
        
        Args:
            session: Database session
            id: Record ID
            
        Returns:
            Removed model instance or None if not found
        """
        obj = await self.get(session, id)
        if obj:
            await session.delete(obj)
            await session.flush()
        return obj
    
    async def count(self, session: AsyncSession) -> int:
        """
        Count total number of records
        
        Args:
            session: Database session
            
        Returns:
            Total count of records
        """
        from sqlalchemy import func
        
        result = await session.execute(
            select(func.count(self.model.id))
        )
        return result.scalar()
    
    async def exists(self, session: AsyncSession, *, id: Any) -> bool:
        """
        Check if a record exists by ID
        
        Args:
            session: Database session
            id: Record ID
            
        Returns:
            True if record exists, False otherwise
        """
        result = await session.execute(
            select(self.model.id).where(self.model.id == id)
        )
        return result.scalar_one_or_none() is not None
