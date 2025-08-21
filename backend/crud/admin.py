"""
Admin CRUD operations
- Admin authentication
- Admin management actions on Users (block/unblock/delete/list/count)
"""

from typing import Optional, List
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.admin import Admin
from models.user import User
from schemas.admin import AdminLogin, AdminPasswordChange
from utils.password import verify_password, hash_password


class AdminCRUD:
    """Admin CRUD operations"""

    # ---------- Admin Authentication & Maintenance ----------

    async def get_by_email(self, session: AsyncSession, email: str) -> Optional[Admin]:
        result = await session.execute(select(Admin).where(Admin.email == email))
        return result.scalar_one_or_none()
    
    async def get_by_id(self, session: AsyncSession, aid: int) -> Admin | None:
        """
        Fetch an admin by their ID.
        Returns Admin object if found, else None.
        """
        result = await session.execute(select(Admin).where(Admin.aid == aid))
        admin = result.scalars().first()
        return admin


    async def authenticate(self, session: AsyncSession, login_data: AdminLogin) -> Optional[Admin]:
        admin = await self.get_by_email(session, login_data.email)
        if not admin or not admin.is_active:
            return None
        if not verify_password(login_data.password, admin.password):
            return None
        return admin

    async def change_password(
        self,
        session: AsyncSession,
        admin_id: int,
        pwd_data: AdminPasswordChange
    ) -> bool:
        admin = await session.get(Admin, admin_id)
        if not admin:
            return False
        if not verify_password(pwd_data.current_password, admin.password):
            return False
        admin.password = hash_password(pwd_data.new_password)
        admin.updated_at = datetime.utcnow()
        await session.flush()
        return True

    # Optional helper to create admin (not needed at runtime if you seed)
    async def create_admin(self, session: AsyncSession, email: str, plain_password: str) -> Admin:
        admin = Admin(email=email, password=hash_password(plain_password))
        session.add(admin)
        await session.flush()
        await session.refresh(admin)
        return admin

    # ---------- Admin Powers on Users ----------

    async def list_users(self, session: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
        result = await session.execute(
            select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def count_users(self, session: AsyncSession, is_active: Optional[bool] = None) -> int:
        from sqlalchemy import func, and_
        query = select(func.count(User.uid))
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        result = await session.execute(query)
        return result.scalar() or 0

    async def block_user(self, session: AsyncSession, user_id: int) -> bool:
        user = await session.get(User, user_id)
        if not user:
            return False
        user.is_active = False
        user.updated_at = datetime.utcnow()
        await session.flush()
        return True

    async def unblock_user(self, session: AsyncSession, user_id: int) -> bool:
        user = await session.get(User, user_id)
        if not user:
            return False
        user.is_active = True
        user.updated_at = datetime.utcnow()
        await session.flush()
        return True

    async def delete_user_permanently(self, session: AsyncSession, user_id: int) -> bool:
        user = await session.get(User, user_id)
        if not user:
            return False
        await session.delete(user)
        await session.flush()
        return True


# Global instance
admin_crud = AdminCRUD()
