import asyncio
from sqlalchemy import text
from database.connection import db_manager

async def check_table():
    db_manager.initialize()
    async with db_manager.get_async_session() as session:
        result = await session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name = 'document_rules'"))
        row = result.fetchone()
        print('Table exists:', row is not None)
        if row:
            print('Table name:', row[0])

if __name__ == "__main__":
    asyncio.run(check_table())
