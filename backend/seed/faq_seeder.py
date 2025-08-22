"""
FAQ seeder for creating predefined FAQs in the database
"""

import asyncio
import logging
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

import sys
import os

# Add the parent directory to the Python path (adjust depth if needed)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


from database.connection import db_manager
from models.faq import FAQ
from schemas.faq import FAQCreate

logger = logging.getLogger(__name__)


class FaqSeeder:
    """Seeder class for inserting predefined FAQs"""

    def __init__(self):
        # Replace with your real FAQs
        self.faqs: List[FAQCreate] = [
            FAQCreate(
                question="What is Report Sage?",
                answer="Report Sage is a reporting and analytics tool to simplify data insights."
            ),
            FAQCreate(
                question="How can I reset my password?",
                answer="Click on 'Forgot Password' at login and follow the instructions."
            ),
            FAQCreate(
                question="Can I export reports?",
                answer="NOPE."
            ),
            FAQCreate(
                question="Who do I contact for support?",
                answer="You can email our support team at support@reportsage.com."
            ),
        ]

    async def seed_faqs(self, session: AsyncSession) -> Dict[str, List[str]]:
        """
        Seed FAQs in the database while checking for duplicates.

        Returns:
            Dictionary with 'created' and 'skipped' lists (based on question)
        """
        result = {
            "created": [],
            "skipped": []
        }

        for faq_data in self.faqs:
            try:
                # Check if FAQ already exists
                query = await session.execute(select(FAQ).where(FAQ.question == faq_data.question))
                existing = query.scalar_one_or_none()
                if existing:
                    logger.info(f"FAQ already exists: {faq_data.question}, skipping")
                    result["skipped"].append(faq_data.question)
                    continue

                # Create new FAQ
                faq = FAQ(
                    question=faq_data.question,
                    answer=faq_data.answer
                )
                session.add(faq)
                await session.flush()
                result["created"].append(faq.question)
                logger.info(f"Created FAQ: {faq.question}")

            except Exception as e:
                logger.error(f"Failed to create FAQ '{faq_data.question}': {e}")
                result["skipped"].append(faq_data.question)
                continue

        return result

    async def run(self) -> bool:
        """Run the FAQ seeding process"""
        try:
            db_manager.initialize()
            async with db_manager.get_async_session() as session:
                result = await self.seed_faqs(session)
                await session.commit()

                logger.info(f"✅ FAQs created: {result['created'] or 'None'}")
                logger.info(f"⚠️ FAQs skipped (already exist or failed): {result['skipped'] or 'None'}")
                return True
        except Exception as e:
            logger.error(f"FAQ seeding failed: {e}")
            return False

    def print_faq_info(self):
        """Print the FAQs that will be created"""
        print("\n🌱 FAQ Seeder - Predefined FAQs:")
        print("=" * 50)
        for i, f in enumerate(self.faqs, 1):
            print(f"\n{i}. Q: {f.question}")
            print(f"   A: {f.answer}")
        print("\n" + "=" * 50)


# Global seeder instance
faq_seeder = FaqSeeder()


async def seed_faqs():
    """Convenience function to run FAQ seeding"""
    faq_seeder.print_faq_info()
    print("\n🚀 Starting FAQ seeding...")
    success = await faq_seeder.run()
    if success:
        print("✅ FAQ seeding completed successfully!")
    else:
        print("❌ FAQ seeding failed!")
    return success


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    asyncio.run(seed_faqs())
