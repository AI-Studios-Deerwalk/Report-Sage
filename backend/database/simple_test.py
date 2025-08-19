"""
Simple PostgreSQL connection test
Just tests raw connection without ORM
"""

import asyncio
import logging
from sqlalchemy import text
from connection import db_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_simple_connection():
    """Test basic PostgreSQL connection with raw SQL"""
    try:
        logger.info("Testing basic PostgreSQL connection...")
        
        # Initialize the database manager
        db_manager.initialize()
        
        # Test with raw SQL queries
        async with db_manager.get_async_session() as session:
            # Test connection
            result = await session.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            logger.info(f"✅ Connection test: {test_value}")
            
            # Test PostgreSQL version
            result = await session.execute(text("SELECT version()"))
            version = result.scalar()
            logger.info(f"✅ PostgreSQL version: {version}")
            
            # Test current database
            result = await session.execute(text("SELECT current_database()"))
            db_name = result.scalar()
            logger.info(f"✅ Connected to database: {db_name}")
            
            # Test current user
            result = await session.execute(text("SELECT current_user"))
            user = result.scalar()
            logger.info(f"✅ Connected as user: {user}")
            
        logger.info("🎉 All connection tests passed!")
            
    except Exception as e:
        logger.error(f"❌ Connection test failed: {e}")
        logger.error("Make sure PostgreSQL is running and credentials are correct in .env")
    finally:
        await db_manager.close()


if __name__ == "__main__":
    asyncio.run(test_simple_connection())
