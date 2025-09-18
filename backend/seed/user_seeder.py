"""
User seeder for creating sample users in the database
"""

import asyncio
import logging
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

import sys
import os

# Add the backend root to the Python path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_root)

from database.connection import db_manager
from crud.user import user_crud
from schemas.user import UserCreate


logger = logging.getLogger(__name__)


class UserSeeder:
    """User seeder class for creating sample users"""
    
    def __init__(self):
        self.sample_users = [
            UserCreate(
                email="john.student@university.edu",
                password="StudentPass123",
                fname="John",
                lname="Smith",
                phone_number="555-123-4567"
            ),
            UserCreate(
                email="prof.williams@university.edu", 
                password="TeacherPass456",
                fname="Sarah",
                lname="Williams",
                phone_number="555-987-6543"
            ),
            UserCreate(
                email="alice.jones@university.edu",
                password="StudentPass789",
                fname="Alice", 
                lname="Jones",
                phone_number="555-456-7890"
            ),
            UserCreate(
                email="hardikshakya17@gmail.com",
                password="Hardik@123",
                fname="Hardik",
                lname="Shakya",
                phone_number="555-000-0001",
                is_verified=True
            ),
            UserCreate(
                email="ason.gautam2580@gmail.com",
                password="#asonG12",
                fname="Ason",
                lname="Gautam",
                phone_number="555-000-0002",
                is_verified=True
            )
        ]
    
    async def seed_users(self, session: AsyncSession) -> List[str]:
        """
        Create sample users in the database
        
        Args:
            session: Database session
            
        Returns:
            List of created user IDs
        """
        created_users = []
        
        for user_data in self.sample_users:
            try:
                # Check if user already exists
                existing_user = await user_crud.get_by_email(session, user_data.email)
                if existing_user:
                    logger.info(f"User {user_data.email} already exists, skipping")
                    continue
                
                # Create new user
                user = await user_crud.create(session, user_data)
                created_users.append(user.uid)
                
                logger.info(f"Created user: {user.fname} {user.lname} ({user.email})")
                
            except Exception as e:
                logger.error(f"Failed to create user {user_data.email}: {e}")
                continue
        
        return created_users
    
    async def run(self) -> bool:
        """
        Run the user seeding process
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Initialize database
            db_manager.initialize()
            
            # Create users
            async with db_manager.get_async_session() as session:
                created_users = await self.seed_users(session)
                
                if created_users:
                    logger.info(f"Successfully created {len(created_users)} users")
                    logger.info(f"User IDs: {created_users}")
                    return True
                else:
                    logger.info("No new users were created (all users may already exist)")
                    return True
                    
        except Exception as e:
            logger.error(f"User seeding failed: {e}")
            return False
    
    def print_user_info(self):
        """Print information about the users that will be created"""
        print("\n🌱 User Seeder - Sample Users:")
        print("=" * 50)
        
        for i, user in enumerate(self.sample_users, 1):
            print(f"\n{i}. {user.fname} {user.lname}")
            print(f"   Email: {user.email}")
            print(f"   Phone: {user.phone_number or 'Not provided'}")
            print(f"   Password: {user.password}")
        
        print("\n" + "=" * 50)


# Create global seeder instance
user_seeder = UserSeeder()


async def seed_users():
    """Convenience function to run user seeding"""
    user_seeder.print_user_info()
    print("\n🚀 Starting user seeding...")
    
    success = await user_seeder.run()
    
    if success:
        print("✅ User seeding completed successfully!")
    else:
        print("❌ User seeding failed!")
    
    return success


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the seeder
    asyncio.run(seed_users())
