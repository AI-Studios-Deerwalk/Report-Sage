"""
Simple script to test PostgreSQL connection
"""

import asyncio
import logging
from sqlalchemy import text
from connection import db_manager, check_database_health

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_connection():
    """Test the database connection"""
    try:
        logger.info("Testing PostgreSQL connection...")
        
        # Initialize the database manager
        db_manager.initialize()
        
        # Test the connection
        is_healthy = await check_database_health()
        
        if is_healthy:
            logger.info("✅ Database connection successful!")
            
            # Test a simple query
            async with db_manager.get_async_session() as session:
                result = await session.execute(text("SELECT version()"))
                version = result.scalar()
                logger.info(f"PostgreSQL version: {version}")
                
        else:
            logger.error("❌ Database connection failed!")
            
    except Exception as e:
        logger.error(f"❌ Connection test failed: {e}")
    finally:
        await db_manager.close()


if __name__ == "__main__":
    asyncio.run(test_connection())
