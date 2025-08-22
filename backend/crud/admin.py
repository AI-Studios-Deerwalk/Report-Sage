"""
Admin CRUD operations
- Admin authentication
- Admin management actions on Users (block/unblock/delete/list/count)
- User activity tracking
- System health monitoring
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import psutil
import os

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, desc

from models.admin import Admin
from models.user import User
from models.user_activity import UserActivity
from models.system_health import SystemHealth
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

    # ---------- Enhanced User Management ----------

    async def list_users(self, session: AsyncSession, skip: int = 0, limit: int = 100, 
                        search: Optional[str] = None, status_filter: Optional[str] = None) -> List[User]:
        query = select(User).order_by(User.created_at.desc())
        
        if search:
            search_term = f"%{search}%"
            query = query.where(
                and_(
                    User.email.ilike(search_term) |
                    User.fname.ilike(search_term) |
                    User.lname.ilike(search_term)
                )
            )
        
        if status_filter:
            if status_filter == "active":
                query = query.where(User.is_active == True, User.is_blocked == False)
            elif status_filter == "blocked":
                query = query.where(User.is_blocked == True)
            elif status_filter == "inactive":
                query = query.where(User.is_active == False)
            elif status_filter == "verified":
                query = query.where(User.is_email_verified == True)
            elif status_filter == "unverified":
                query = query.where(User.is_email_verified == False)
        
        query = query.offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()

    async def get_user_by_id(self, session: AsyncSession, user_id: int) -> Optional[User]:
        """Get detailed user information"""
        result = await session.execute(select(User).where(User.uid == user_id))
        return result.scalar_one_or_none()

    async def count_users(self, session: AsyncSession, is_active: Optional[bool] = None, 
                         is_blocked: Optional[bool] = None) -> int:
        query = select(func.count(User.uid))
        conditions = []
        
        if is_active is not None:
            conditions.append(User.is_active == is_active)
        if is_blocked is not None:
            conditions.append(User.is_blocked == is_blocked)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        result = await session.execute(query)
        return result.scalar() or 0

    async def get_user_stats(self, session: AsyncSession) -> Dict[str, Any]:
        """Get comprehensive user statistics"""
        # Total users
        total_result = await session.execute(select(func.count(User.uid)))
        total_users = total_result.scalar() or 0
        
        # Active users
        active_result = await session.execute(
            select(func.count(User.uid)).where(User.is_active == True, User.is_blocked == False)
        )
        active_users = active_result.scalar() or 0
        
        # Blocked users
        blocked_result = await session.execute(
            select(func.count(User.uid)).where(User.is_blocked == True)
        )
        blocked_users = blocked_result.scalar() or 0
        
        # Verified users
        verified_result = await session.execute(
            select(func.count(User.uid)).where(User.is_email_verified == True)
        )
        verified_users = verified_result.scalar() or 0
        
        # Users registered in last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_result = await session.execute(
            select(func.count(User.uid)).where(User.created_at >= week_ago)
        )
        recent_users = recent_result.scalar() or 0
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "blocked_users": blocked_users,
            "verified_users": verified_users,
            "recent_users_7d": recent_users,
            "verification_rate": (verified_users / total_users * 100) if total_users > 0 else 0
        }

    async def block_user(self, session: AsyncSession, user_id: int) -> bool:
        user = await session.get(User, user_id)
        if not user:
            return False
        user.is_blocked = True
        user.is_active = False
        user.updated_at = datetime.utcnow()
        await session.flush()
        return True

    async def unblock_user(self, session: AsyncSession, user_id: int) -> bool:
        user = await session.get(User, user_id)
        if not user:
            return False
        user.is_blocked = False
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

    async def verify_user_email(self, session: AsyncSession, user_id: int) -> bool:
        """Manually verify a user's email"""
        user = await session.get(User, user_id)
        if not user:
            return False
        user.is_email_verified = True
        user.updated_at = datetime.utcnow()
        await session.flush()
        return True

    # ---------- User Activity Tracking ----------

    async def log_user_activity(self, session: AsyncSession, user_id: int, action_type: str, 
                               action_description: Optional[str] = None, ip_address: Optional[str] = None,
                               user_agent: Optional[str] = None) -> UserActivity:
        """Log a user activity"""
        activity = UserActivity(
            user_id=user_id,
            action_type=action_type,
            action_description=action_description,
            ip_address=ip_address,
            user_agent=user_agent
        )
        session.add(activity)
        await session.flush()
        await session.refresh(activity)
        return activity

    async def get_user_activities(self, session: AsyncSession, user_id: int, 
                                 limit: int = 50) -> List[UserActivity]:
        """Get user activity history"""
        result = await session.execute(
            select(UserActivity)
            .where(UserActivity.user_id == user_id)
            .order_by(desc(UserActivity.created_at))
            .limit(limit)
        )
        return result.scalars().all()

    async def get_recent_activities(self, session: AsyncSession, limit: int = 100) -> List[UserActivity]:
        """Get recent activities across all users"""
        result = await session.execute(
            select(UserActivity)
            .order_by(desc(UserActivity.created_at))
            .limit(limit)
        )
        return result.scalars().all()

    # ---------- System Health Monitoring ----------

    async def get_system_health(self, session: AsyncSession) -> Dict[str, Any]:
        """Get current system health metrics"""
        # Get system metrics
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Get database connection info (simplified)
        active_connections = 0  # This would need proper DB connection monitoring
        
        # Get application metrics
        total_users = await self.count_users(session)
        
        # Users active in last 24 hours (simplified - would need proper activity tracking)
        day_ago = datetime.utcnow() - timedelta(days=1)
        active_24h_result = await session.execute(
            select(func.count(UserActivity.user_id.distinct()))
            .where(UserActivity.created_at >= day_ago)
        )
        active_users_24h = active_24h_result.scalar() or 0
        
        # Determine overall health
        is_healthy = (
            cpu_usage < 80 and 
            memory.percent < 80 and 
            disk.percent < 90
        )
        
        status_message = "System is healthy"
        if cpu_usage > 80:
            status_message = "High CPU usage detected"
        elif memory.percent > 80:
            status_message = "High memory usage detected"
        elif disk.percent > 90:
            status_message = "High disk usage detected"
        
        return {
            "cpu_usage": cpu_usage,
            "memory_usage": memory.percent,
            "disk_usage": disk.percent,
            "active_connections": active_connections,
            "total_users": total_users,
            "active_users_24h": active_users_24h,
            "is_healthy": is_healthy,
            "status_message": status_message,
            "timestamp": datetime.utcnow().isoformat()
        }

    async def save_system_health(self, session: AsyncSession, health_data: Dict[str, Any]) -> SystemHealth:
        """Save system health metrics to database"""
        health = SystemHealth(
            cpu_usage=health_data.get("cpu_usage"),
            memory_usage=health_data.get("memory_usage"),
            disk_usage=health_data.get("disk_usage"),
            active_connections=health_data.get("active_connections"),
            total_users=health_data.get("total_users"),
            active_users_24h=health_data.get("active_users_24h"),
            is_healthy=health_data.get("is_healthy", True),
            status_message=health_data.get("status_message")
        )
        session.add(health)
        await session.flush()
        await session.refresh(health)
        return health

    async def get_health_history(self, session: AsyncSession, hours: int = 24) -> List[SystemHealth]:
        """Get system health history"""
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        result = await session.execute(
            select(SystemHealth)
            .where(SystemHealth.created_at >= time_threshold)
            .order_by(desc(SystemHealth.created_at))
        )
        return result.scalars().all()


# Global instance
admin_crud = AdminCRUD()
