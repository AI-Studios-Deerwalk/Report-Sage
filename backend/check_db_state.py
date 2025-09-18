import asyncio
from sqlalchemy import text
from database.connection import db_manager

async def check_database_state():
    """Check what tables and types exist in the database"""
    db_manager.initialize()
    async with db_manager.get_async_session() as session:
        # Check existing tables
        result = await session.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """))
        tables = [row[0] for row in result.fetchall()]
        print("Existing tables:", tables)
        
        # Check existing enum types
        result = await session.execute(text("""
            SELECT typname 
            FROM pg_type 
            WHERE typtype = 'e' 
            ORDER BY typname
        """))
        enums = [row[0] for row in result.fetchall()]
        print("Existing enum types:", enums)
        
        # Check alembic version table
        result = await session.execute(text("""
            SELECT version_num 
            FROM alembic_version 
            LIMIT 1
        """))
        version = result.fetchone()
        print("Alembic version:", version[0] if version else "No version found")

if __name__ == "__main__":
    asyncio.run(check_database_state())
