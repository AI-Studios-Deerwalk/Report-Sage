"""
Config Seeder
Seeds the configs table with default email configuration
"""

import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from database.connection import get_db
from models.config import Config
from crud.config import config_crud
from schemas.config import ConfigCreate
import uuid

def seed_config():
    """Seed the configs table with default email configuration"""
    db = next(get_db())
    
    try:
        # Check if config already exists
        existing_config = config_crud.get_email_config_sync(db)
        if existing_config:
            print("Config already exists, skipping seed...")
            return
        
        # Create default email configuration
        default_config = ConfigCreate(
            smtp_server="smtp.gmail.com",
            smtp_port="587",
            smtp_username="ason.gautam@deerwalk.edu.np",
            smtp_password="zhez fkus whhj rnfc",
            from_email="ason.gautam@deerwalk.edu.np",
            from_name="Deerwalk Academia"
        )
        
        # Create the config
        config = config_crud.create_sync(db, default_config)
        
        print(f"✅ Config seeded successfully!")
        print(f"   ID: {config.id}")
        print(f"   SMTP Server: {config.smtp_server}")
        print(f"   SMTP Port: {config.smtp_port}")
        print(f"   SMTP Username: {config.smtp_username}")
        print(f"   From Email: {config.from_email}")
        print(f"   From Name: {config.from_name}")
        
    except Exception as e:
        print(f"❌ Error seeding config: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Seeding config table...")
    seed_config()
    print("✨ Config seeding completed!")
