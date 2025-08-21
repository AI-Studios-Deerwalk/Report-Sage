"""
Script to reset alembic migration state
"""
import psycopg2
from database.config import db_config

def reset_migration_state():
    """Reset the alembic migration state by dropping the alembic_version table"""
    try:
        # Connect to the database
        conn = psycopg2.connect(db_config.database_url)
        cursor = conn.cursor()
        
        # Drop the alembic_version table if it exists
        cursor.execute("DROP TABLE IF EXISTS alembic_version;")
        
        # Commit the changes
        conn.commit()
        print("Successfully reset alembic migration state")
        
    except Exception as e:
        print(f"Error resetting migration state: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    reset_migration_state()
