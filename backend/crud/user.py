"""
User CRUD operations
Database operations for User model
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from models.user import User
from schemas.user import UserCreate, UserUpdate, UserPasswordChange
from utils.password import hash_password, verify_password
# Using standard Python exceptions for simplicity


class UserCRUD:
    """User CRUD operations class"""
    
    async def create(self, session: AsyncSession, user_data: UserCreate) -> User:
        """
        Create a new user
        
        Args:
            session: Database session
            user_data: User creation data
            
        Returns:
            Created user object
            
        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists
        existing_user = await self.get_by_email(session, user_data.email)
        if existing_user:
            raise ValueError(f"User with email {user_data.email} already exists")
        
        # Hash the password
        hashed_password = hash_password(user_data.password)
        
        # Create user object
        user = User(
            email=user_data.email,
            password=hashed_password,
            fname=user_data.fname,
            lname=user_data.lname,
            phone_number=user_data.phone_number,
        )
        
        session.add(user)
        await session.flush()  # Get the ID without committing
        await session.refresh(user)
        
        return user
    
    async def get_by_id(self, session: AsyncSession, user_id: int) -> Optional[User]:
        """
        Get user by ID
        
        Args:
            session: Database session
            user_id: User ID
            
        Returns:
            User object or None if not found
        """
        result = await session.execute(
            select(User).where(User.uid == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_email(self, session: AsyncSession, email: str) -> Optional[User]:
        """
        Get user by email
        
        Args:
            session: Database session
            email: User email
            
        Returns:
            User object or None if not found
        """
        result = await session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_active_by_email(self, session: AsyncSession, email: str) -> Optional[User]:
        """
        Get active user by email
        
        Args:
            session: Database session
            email: User email
            
        Returns:
            Active user object or None if not found
        """
        result = await session.execute(
            select(User).where(
                and_(User.email == email, User.is_active == True)
            )
        )
        return result.scalar_one_or_none()
    
    async def get_all(
        self, 
        session: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[User]:
        """
        Get all users with filtering and pagination
        
        Args:
            session: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            is_active: Filter by active status
            search: Search in name or email
            
        Returns:
            List of user objects
        """
        query = select(User)
        
        # Apply filters
        conditions = []
        
        if is_active is not None:
            conditions.append(User.is_active == is_active)
        
        if search:
            search_term = f"%{search}%"
            conditions.append(
                or_(
                    User.fname.ilike(search_term),
                    User.lname.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        # Order by creation date (newest first)
        query = query.order_by(User.created_at.desc())
        
        result = await session.execute(query)
        return result.scalars().all()
    
    async def update(
        self, 
        session: AsyncSession, 
        user_id: int, 
        user_data: UserUpdate
    ) -> Optional[User]:
        """
        Update user information
        
        Args:
            session: Database session
            user_id: User ID
            user_data: User update data
            
        Returns:
            Updated user object or None if not found
        """
        user = await self.get_by_id(session, user_id)
        if not user:
            return None
        
        # Update fields if provided
        update_data = user_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        # Update timestamp
        user.updated_at = datetime.utcnow()
        
        await session.flush()
        await session.refresh(user)
        
        return user
    
    async def delete(self, session: AsyncSession, user_id: int) -> bool:
        """
        Soft delete user (set is_active to False)
        
        Args:
            session: Database session
            user_id: User ID
            
        Returns:
            True if user was deleted, False if not found
        """
        user = await self.get_by_id(session, user_id)
        if not user:
            return False
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        
        await session.flush()
        return True
    
    async def hard_delete(self, session: AsyncSession, user_id: int) -> bool:
        """
        Hard delete user from database
        
        Args:
            session: Database session
            user_id: User ID
            
        Returns:
            True if user was deleted, False if not found
        """
        user = await self.get_by_id(session, user_id)
        if not user:
            return False
        
        await session.delete(user)
        await session.flush()
        return True
    
    async def authenticate(
        self, 
        session: AsyncSession, 
        email: str, 
        password: str
    ) -> Optional[User]:
        """
        Authenticate user with email and password
        
        Args:
            session: Database session
            email: User email
            password: Plain text password
            
        Returns:
            User object if authentication successful, None otherwise
        """
        user = await self.get_active_by_email(session, email)
        if not user:
            return None
        
        if not verify_password(password, user.password):
            return None
        
        return user
    
    async def change_password(
        self, 
        session: AsyncSession, 
        user_id: int, 
        password_data: UserPasswordChange
    ) -> bool:
        """
        Change user password
        
        Args:
            session: Database session
            user_id: User ID
            password_data: Password change data
            
        Returns:
            True if password was changed, False if current password is incorrect
            
        Raises:
            ValueError: If user not found
        """
        user = await self.get_by_id(session, user_id)
        if not user:
            raise ValueError(f"User with ID {user_id} not found")
        
        # Verify current password
        if not verify_password(password_data.current_password, user.password):
            return False
        
        # Update password
        user.password = hash_password(password_data.new_password)
        user.updated_at = datetime.utcnow()
        
        await session.flush()
        return True
    
    async def verify_email(self, session: AsyncSession, user_id: int) -> bool:
        """
        Mark user email as verified
        
        Args:
            session: Database session
            user_id: User ID
            
        Returns:
            True if email was verified, False if user not found
        """
        user = await self.get_by_id(session, user_id)
        if not user:
            return False
        
        user.is_email_verified = True
        user.updated_at = datetime.utcnow()
        
        await session.flush()
        return True
    
    async def reset_password(
        self, 
        session: AsyncSession, 
        email: str, 
        new_password: str
    ) -> bool:
        """
        Reset user password (for password reset functionality)
        
        Args:
            session: Database session
            email: User email
            new_password: New plain text password
            
        Returns:
            True if password was reset, False if user not found
        """
        user = await self.get_by_email(session, email)
        if not user:
            return False
        
        user.password = hash_password(new_password)
        user.updated_at = datetime.utcnow()
        
        await session.flush()
        return True
    
    async def count_users(
        self, 
        session: AsyncSession,
        is_active: Optional[bool] = None
    ) -> int:
        """
        Count users with optional filtering
        
        Args:
            session: Database session
            is_active: Filter by active status
            
        Returns:
            Number of users matching criteria
        """
        from sqlalchemy import func
        
        query = select(func.count(User.uid))
        
        conditions = []
        
        if is_active is not None:
            conditions.append(User.is_active == is_active)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        result = await session.execute(query)
        return result.scalar()
    



# Create global instance
user_crud = UserCRUD()
