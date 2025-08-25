"""
Issue operations
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from models.issue import Issue, IssueStatusEnum
from schemas.issue import IssueCreate, IssueUpdateStatus, IssueUpdateRead
from uuid import UUID

class IssueCRUD:
  async def add_issue(self, db: AsyncSession, issue: IssueCreate, user_id: int) -> Issue:
        try:
            db_issue = Issue(**issue.model_dump(), uid=user_id)  # Changed from user_id to uid
            db.add(db_issue)
            await db.commit()
            await db.refresh(db_issue)
            
            # Explicitly load the user relationship to ensure proper serialization
            from sqlalchemy.orm import selectinload
            result = await db.execute(
                select(Issue)
                .where(Issue.issue_id == db_issue.issue_id)
                .options(selectinload(Issue.user))
            )
            db_issue_with_user = result.scalar_one()
            
            # Log successful creation
            import logging
            logging.info(f"CRUD: Issue created successfully with ID {db_issue_with_user.issue_id}")
            
            return db_issue_with_user
        except Exception as e:
            import logging
            logging.error(f"CRUD Error in add_issue: {str(e)}")
            await db.rollback()
            raise

  async def get_all_issues(self,db: AsyncSession):
      from sqlalchemy.orm import selectinload
      result = await db.execute(
          select(Issue)
          .options(selectinload(Issue.user))
      )
      return result.scalars().all()

  async def get_user_issues(self, db: AsyncSession, user_id: int):
      result = await db.execute(select(Issue).where(Issue.uid == user_id).order_by(Issue.created_at.desc()))  # Changed from user_id to uid
      return result.scalars().all()

  async def get_issue_by_id(self,db: AsyncSession, issue_id: UUID):
      from sqlalchemy.orm import selectinload
      result = await db.execute(
          select(Issue)
          .where(Issue.issue_id == issue_id)
          .options(selectinload(Issue.user))
      )
      return result.scalar_one_or_none()

  async def update_issue_status(self,db: AsyncSession, issue_id: UUID, status: IssueUpdateStatus):
      try:
          result = await db.execute(select(Issue).where(Issue.issue_id == issue_id))
          db_issue = result.scalar_one_or_none()
          if not db_issue:
              return None
          
          db_issue.status = status.status
          db.add(db_issue)
          await db.commit()
          await db.refresh(db_issue)
          
          # Load the updated issue with user relationship for proper serialization
          from sqlalchemy.orm import selectinload
          result = await db.execute(
              select(Issue)
              .where(Issue.issue_id == issue_id)
              .options(selectinload(Issue.user))
          )
          updated_issue_with_user = result.scalar_one()
          
          return updated_issue_with_user
      except Exception as e:
          import logging
          logging.error(f"CRUD Error in update_issue_status: {str(e)}")
          await db.rollback()
          raise

  async def mark_issue_as_read(self, db: AsyncSession, issue_id: UUID):
      """Mark an issue as read when viewed by admin"""
      try:
          result = await db.execute(select(Issue).where(Issue.issue_id == issue_id))
          db_issue = result.scalar_one_or_none()
          if not db_issue:
              return None
          
          # Only mark as read if it's currently unread
          if not db_issue.is_read:
              db_issue.is_read = True
              db.add(db_issue)
              await db.commit()
              await db.refresh(db_issue)
          
          # Load the updated issue with user relationship for proper serialization
          from sqlalchemy.orm import selectinload
          result = await db.execute(
              select(Issue)
              .where(Issue.issue_id == issue_id)
              .options(selectinload(Issue.user))
          )
          updated_issue_with_user = result.scalar_one()
          
          return updated_issue_with_user
      except Exception as e:
          import logging
          logging.error(f"CRUD Error in mark_issue_as_read: {str(e)}")
          await db.rollback()
          raise

  async def delete_issue(self, db: AsyncSession, issue_id: UUID, user_id: int) -> bool:
      """Delete an issue if it belongs to the user"""
      result = await db.execute(
          select(Issue).where(Issue.issue_id == issue_id, Issue.uid == user_id)
      )
      db_issue = result.scalar_one_or_none()
      if not db_issue:
          return False
      
      await db.delete(db_issue)
      await db.commit()
      return True

  async def get_unread_count(self, db: AsyncSession) -> int:
      """Get count of unread issues"""
      result = await db.execute(
          select(Issue).where(Issue.is_read == False)
      )
      return len(result.scalars().all())

#Global Instance
issue_crud = IssueCRUD()