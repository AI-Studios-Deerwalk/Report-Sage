"""
Database connection management
Simple PostgreSQL connection setup
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session
from .config import db_config

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages database connections and sessions"""
    
    def __init__(self):
        self.sync_engine = None
        self.async_engine = None
        self.sync_session_factory = None
        self.async_session_factory = None
        self._initialized = False
    
    def initialize(self):
        """Initialize database engines and session factories"""
        if self._initialized:
            return
        
        try:
            # Synchronous engine for basic operations
            self.sync_engine = create_engine(
                db_config.database_url,
                pool_size=db_config.DB_POOL_SIZE,
                max_overflow=db_config.DB_MAX_OVERFLOW,
                pool_timeout=db_config.DB_POOL_TIMEOUT,
                pool_recycle=db_config.DB_POOL_RECYCLE,
                echo=False,  # Set to True for SQL debugging
            )
            
            # Asynchronous engine for FastAPI endpoints
            self.async_engine = create_async_engine(
                db_config.async_database_url,
                pool_size=db_config.DB_POOL_SIZE,
                max_overflow=db_config.DB_MAX_OVERFLOW,
                pool_timeout=db_config.DB_POOL_TIMEOUT,
                pool_recycle=db_config.DB_POOL_RECYCLE,
                echo=False,  # Set to True for SQL debugging
            )
            
            # Session factories
            self.sync_session_factory = sessionmaker(
                bind=self.sync_engine,
                autoflush=False,
                autocommit=False
            )
            
            self.async_session_factory = async_sessionmaker(
                bind=self.async_engine,
                class_=AsyncSession,
                autoflush=False,
                autocommit=False,
                expire_on_commit=False
            )
            
            self._initialized = True
            logger.info("Database manager initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize database manager: {e}")
            raise
    
    async def create_tables(self):
        """Create database tables for all models"""
        try:
            from ..models.user import Base
            
            # Create all tables using the declarative base
            async with self.async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create tables: {e}")
            raise
    
    async def check_connection(self) -> bool:
        """Check if database connection is working"""
        try:
            async with self.get_async_session() as session:
                result = await session.execute(text("SELECT 1"))
                return result.scalar() == 1
        except Exception as e:
            logger.error(f"Database connection check failed: {e}")
            return False
    
    @asynccontextmanager
    async def get_async_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get async database session with automatic cleanup"""
        if not self._initialized:
            self.initialize()
        
        async with self.async_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.error(f"Database session error: {e}")
                raise
            finally:
                await session.close()
    
    def get_sync_session(self) -> Session:
        """Get synchronous database session"""
        if not self._initialized:
            self.initialize()
        
        return self.sync_session_factory()
    
    async def close(self):
        """Close all database connections"""
        if self.async_engine:
            await self.async_engine.dispose()
        if self.sync_engine:
            self.sync_engine.dispose()
        logger.info("Database connections closed")


# Global database manager instance
db_manager = DatabaseManager()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI to get database session"""
    async with db_manager.get_async_session() as session:
        yield session


# Convenience functions
async def init_database():
    """Initialize database and create tables"""
    db_manager.initialize()
    await db_manager.create_tables()


async def check_database_health() -> bool:
    """Check database health for health endpoints"""
    return await db_manager.check_connection()
