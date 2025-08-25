"""
Issue seeder for creating sample issues in the database
"""

import asyncio
import logging
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta
import random

import sys
import os

# Add the backend root to the Python path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_root)

from database.connection import db_manager
from models.issue import Issue
from models.user import User

logger = logging.getLogger(__name__)


class IssueSeeder:
    """Seeder class for inserting sample issues"""

    def __init__(self):
        self.sample_issues = [
            {
                "title": "PDF Upload Issue",
                "description": "Unable to upload PDF files larger than 5MB. Getting error message 'File too large'.",
                "status": "pending"
            },
            {
                "title": "Analysis Results Not Loading",
                "description": "After PDF analysis, the results page shows loading spinner indefinitely. Need to refresh to see results.",
                "status": "inprogress"
            },
            {
                "title": "Email Verification Problem",
                "description": "OTP verification emails are not being received. Checked spam folder and still nothing.",
                "status": "resolved"
            },
            {
                "title": "Mobile Responsiveness Issues",
                "description": "Dashboard layout breaks on mobile devices. Elements overlap and buttons are too small to tap.",
                "status": "pending"
            },
            {
                "title": "Login Authentication Error",
                "description": "Getting 'Invalid credentials' error even with correct username and password. Works after clearing browser cache.",
                "status": "resolved"
            },
            {
                "title": "Report Generation Failed",
                "description": "When trying to generate reports, the system shows 'Internal server error' and the process stops.",
                "status": "pending"
            },
            {
                "title": "User Profile Update Issue",
                "description": "Changes to profile information are not being saved. The form submits but reverts to old values.",
                "status": "inprogress"
            },
            {
                "title": "Search Functionality Broken",
                "description": "Search bar in the archive section returns no results even when documents exist with matching keywords.",
                "status": "pending"
            }
        ]

    async def seed_issues(self, session: AsyncSession) -> Dict[str, List[str]]:
        """
        Seed issues in the database while checking for duplicates.

        Returns:
            Dictionary with 'created' and 'skipped' lists
        """
        result = {
            "created": [],
            "skipped": []
        }

        # Get existing users to assign issues to
        users_result = await session.execute(select(User).limit(5))
        users = users_result.scalars().all()
        
        if not users:
            logger.warning("No users found. Cannot create issues without users.")
            return result

        for i, issue_data in enumerate(self.sample_issues):
            try:
                # Check if issue already exists
                query = await session.execute(select(Issue).where(Issue.title == issue_data["title"]))
                existing = query.scalar_one_or_none()
                if existing:
                    logger.info(f"Issue already exists: {issue_data['title']}, skipping")
                    result["skipped"].append(issue_data["title"])
                    continue

                # Assign to a random user
                user = random.choice(users)
                
                # Create issue with random creation date in the last 30 days
                days_ago = random.randint(0, 30)
                created_at = datetime.utcnow() - timedelta(days=days_ago)
                
                # Random read status
                is_read = random.choice([True, False])
                
                issue = Issue(
                    title=issue_data["title"],
                    description=issue_data["description"],
                    status=issue_data["status"],
                    is_read=is_read,
                    created_at=created_at,
                    uid=user.uid
                )
                session.add(issue)
                await session.flush()
                result["created"].append(issue.title)
                logger.info(f"Created issue: {issue.title}")

            except Exception as e:
                logger.error(f"Failed to create issue '{issue_data['title']}': {e}")
                result["skipped"].append(issue_data["title"])
                continue

        return result

    async def run(self) -> bool:
        """Run the issue seeding process"""
        try:
            db_manager.initialize()
            async with db_manager.get_async_session() as session:
                result = await self.seed_issues(session)
                await session.commit()

                logger.info(f"✅ Issues created: {result['created'] or 'None'}")
                logger.info(f"⚠️ Issues skipped (already exist or failed): {result['skipped'] or 'None'}")
                return True
        except Exception as e:
            logger.error(f"Issue seeding failed: {e}")
            return False

    def print_issue_info(self):
        """Print the issues that will be created"""
        print("\n🌱 Issue Seeder - Sample Issues:")
        print("=" * 50)
        for i, issue in enumerate(self.sample_issues, 1):
            print(f"{i}. {issue['title']} - Status: {issue['status']}")


# Global instance
issue_seeder = IssueSeeder()
