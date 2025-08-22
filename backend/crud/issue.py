"""
Issue operations
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from models.issue import Issue, IssueStatusEnum
from schemas.issue import IssueCreate, IssueUpdateStatus
from uuid import UUID

class IssueCRUD:
  async def add_issue(self, db: AsyncSession, issue: IssueCreate, user_id: int) -> Issue:
        db_issue = Issue(**issue.dict(), user_id=user_id)
        db.add(db_issue)
        await db.commit()
        await db.refresh(db_issue)
        return db_issue

  async def get_all_issues(self,db: AsyncSession):
      result = await db.execute(select(Issue))
      return result.scalars().all()

  async def get_issue_by_id(self,db: AsyncSession, issue_id: UUID):
      result = await db.execute(select(Issue).where(Issue.issue_id == issue_id))
      return result.scalar_one_or_none()

  async def update_issue_status(self,db: AsyncSession, issue_id: UUID, status: IssueUpdateStatus):
      result = await db.execute(select(Issue).where(Issue.issue_id == issue_id))
      db_issue = result.scalar_one_or_none()
      if not db_issue:
          return None
      db_issue.status = status.status
      db.add(db_issue)
      await db.commit()
      await db.refresh(db_issue)
      return db_issue

#Global Instance
issue_crud = IssueCRUD()