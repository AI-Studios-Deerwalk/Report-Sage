"""
Simple script to create the admins table manually
"""

import psycopg2
from database.config import db_config

def create_admin_table():
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=db_config.DB_HOST,
            database=db_config.DB_NAME,
            user=db_config.DB_USER,
            password=db_config.DB_PASSWORD
        )
        cur = conn.cursor()
        
        # Create admins table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS admins (
            aid SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            is_superadmin BOOLEAN NOT NULL DEFAULT FALSE
        );
        """
        
        # Create indexes
        create_indexes_sql = """
        CREATE INDEX IF NOT EXISTS ix_admins_aid ON admins(aid);
        CREATE INDEX IF NOT EXISTS ix_admins_email ON admins(email);
        """
        
        print("Creating admins table...")
        cur.execute(create_table_sql)
        
        print("Creating indexes...")
        cur.execute(create_indexes_sql)
        
        # Commit changes
        conn.commit()
        print("✅ Admins table created successfully!")
        
        # Verify table exists
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_name = 'admins';")
        if cur.fetchone():
            print("✅ Table verification successful!")
        else:
            print("❌ Table verification failed!")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error creating admins table: {e}")

if __name__ == "__main__":
    create_admin_table()
