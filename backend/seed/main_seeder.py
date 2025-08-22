"""
Main Seeder
Runs admin, user, and faq seeders from their respective files
Each seeder already handles duplicate checking using the database
"""

import asyncio
import logging
import sys
import os

# Add backend root to sys.path so seeders can import correctly
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_root)

from admin_seeder import admin_seeder
from user_seeder import user_seeder
from faq_seeder import faq_seeder

logger = logging.getLogger(__name__)

async def run_all_seeders():
    print("\n🌱 Running Admin Seeder...")
    admin_seeder.print_admin_info()
    admin_result = await admin_seeder.run()
    print(f"Admin seeding {'completed' if admin_result else 'failed'}\n")

    print("\n🌱 Running User Seeder...")
    user_seeder.print_user_info()  # assumes you have similar print method in user_seeder.py
    user_result = await user_seeder.run()
    print(f"User seeding {'completed' if user_result else 'failed'}\n")

    print("\n🌱 Running FAQ Seeder...")
    faq_seeder.print_faq_info()
    faq_result = await faq_seeder.run()
    print(f"FAQ seeding {'completed' if faq_result else 'failed'}\n")

    print("✅ All seeders finished!")

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    asyncio.run(run_all_seeders())
