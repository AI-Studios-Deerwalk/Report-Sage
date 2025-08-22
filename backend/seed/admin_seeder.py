"""
Admin seeder for creating predefined admins in the database
"""

import asyncio
import logging
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

import sys
import os

# Add the backend root to the Python path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_root)

from database.connection import db_manager
from models.admin import Admin
from schemas.admin import AdminCreate
from utils.password import hash_password

logger = logging.getLogger(__name__)


class AdminSeeder:
    """Seeder class for inserting predefined admins"""

    def __init__(self):
        # Replace with your real 4 admins (emails/passwords)
        self.admins: List[AdminCreate] = [
            AdminCreate(email="swornima.shrestha04@gmail.com", password="Swornima123"),
            AdminCreate(email="ason.gautam12@gmail.com", password="#asonG12"),
            AdminCreate(email="bidushi.thapa05@gmail.com", password="#deerwalkD12"),
            AdminCreate(email="admin@admin.com", password="aprojectisnevertrulycomplete"),
        ]

    async def seed_admins(self, session: AsyncSession) -> Dict[str, List[str]]:
        """
        Seed admins in the database while checking for duplicates.

        Returns:
            Dictionary with 'created' and 'skipped' lists
        """
        result = {
            "created": [],
            "skipped": []
        }

        for admin_data in self.admins:
            try:
                # Check if admin already exists
                query = await session.execute(select(Admin).where(Admin.email == admin_data.email))
                existing = query.scalar_one_or_none()
                if existing:
                    logger.info(f"Admin {admin_data.email} already exists, skipping")
                    result["skipped"].append(admin_data.email)
                    continue

                # Create new admin with hashed password
                admin = Admin(
                    email=admin_data.email,
                    password=hash_password(admin_data.password)
                )
                session.add(admin)
                await session.flush()
                result["created"].append(admin.email)
                logger.info(f"Created admin: {admin.email}")

            except Exception as e:
                logger.error(f"Failed to create admin {admin_data.email}: {e}")
                result["skipped"].append(admin_data.email)
                continue

        return result

    async def run(self) -> bool:
        """Run the admin seeding process"""
        try:
            db_manager.initialize()
            async with db_manager.get_async_session() as session:
                result = await self.seed_admins(session)
                await session.commit()

                logger.info(f"✅ Admins created: {result['created'] or 'None'}")
                logger.info(f"⚠️ Admins skipped (already exist or failed): {result['skipped'] or 'None'}")
                return True
        except Exception as e:
            logger.error(f"Admin seeding failed: {e}")
            return False

    def print_admin_info(self):
        """Print the admins that will be created (plain passwords for dev visibility)"""
        print("\n🌱 Admin Seeder - Predefined Admins:")
        print("=" * 50)
        for i, a in enumerate(self.admins, 1):
            print(f"\n{i}. {a.email}")
            print(f"   Password: {a.password}")
        print("\n" + "=" * 50)


# Global seeder instance
admin_seeder = AdminSeeder()


async def seed_admins():
    """Convenience function to run admin seeding"""
    admin_seeder.print_admin_info()
    print("\n🚀 Starting admin seeding...")
    success = await admin_seeder.run()
    if success:
        print("✅ Admin seeding completed successfully!")
    else:
        print("❌ Admin seeding failed!")
    return success


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    asyncio.run(seed_admins())
