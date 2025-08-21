"""
UserOTP CRUD operations
Database operations for UserOTP model
"""

from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from models.user_otp import UserOTP
from models.user import User
from schemas.user_otp import UserOTPCreate, UserOTPUpdate, UserOTPVerify
import secrets
import string


class UserOTPCRUD:
    """UserOTP CRUD operations class"""
    
    def _generate_otp_code(self, length: int = 6) -> str:
        """
        Generate a random OTP code
        
        Args:
            length: Length of the OTP code (default: 6)
            
        Returns:
            Random OTP code string
        """
        return ''.join(secrets.choice(string.digits) for _ in range(length))
    
    async def create_otp(
        self, 
        session: AsyncSession, 
        user_id: int, 
        for_purpose: str = "verification",
        expires_in_minutes: int = 2,
        otp_length: int = 6
    ) -> UserOTP:
        """
        Create a new OTP for a user
        
        Args:
            session: Database session
            user_id: User ID
            for_purpose: Purpose of the OTP (verification or forgot_password)
            expires_in_minutes: Minutes until OTP expires (default: 10)
            otp_length: Length of OTP code (default: 6)
            
        Returns:
            Created OTP object
            
        Raises:
            ValueError: If user not found
        """
        # Verify user exists
        user = await session.execute(
            select(User).where(User.uid == user_id)
        )
        user = user.scalar_one_or_none()
        if not user:
            raise ValueError(f"User with ID {user_id} not found")
        
        # Generate OTP code
        otp_code = self._generate_otp_code(otp_length)
        
        # Calculate expiration time
        expires_at = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        
        # Create OTP object
        otp = UserOTP(
            user_id=user_id,
            otp_code=otp_code,
            expires_at=expires_at,
            for_purpose=for_purpose,
            is_used=False,
            attempts=0
        )
        
        session.add(otp)
        await session.flush()
        await session.refresh(otp)
        
        return otp
    
    async def get_by_id(self, session: AsyncSession, otp_id: int) -> Optional[UserOTP]:
        """
        Get OTP by ID
        
        Args:
            session: Database session
            otp_id: OTP ID
            
        Returns:
            OTP object or None if not found
        """
        result = await session.execute(
            select(UserOTP).where(UserOTP.id == otp_id)
        )
        return result.scalar_one_or_none()
    
    async def get_valid_otp_by_user(
        self, 
        session: AsyncSession, 
        user_id: int,
        for_purpose: Optional[str] = None
    ) -> Optional[UserOTP]:
        """
        Get the most recent valid OTP for a user
        
        Args:
            session: Database session
            user_id: User ID
            for_purpose: Optional purpose filter
            
        Returns:
            Valid OTP object or None if not found
        """
        query = select(UserOTP).where(
            and_(
                UserOTP.user_id == user_id,
                UserOTP.is_used == False,
                UserOTP.expires_at > datetime.utcnow()
            )
        )
        
        if for_purpose:
            query = query.where(UserOTP.for_purpose == for_purpose)
        
        query = query.order_by(UserOTP.created_at.desc())
        
        result = await session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all_otps_by_user(
        self, 
        session: AsyncSession, 
        user_id: int,
        for_purpose: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[UserOTP]:
        """
        Get all OTPs for a user with pagination
        
        Args:
            session: Database session
            user_id: User ID
            for_purpose: Optional purpose filter
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of OTP objects
        """
        query = select(UserOTP).where(UserOTP.user_id == user_id)
        
        if for_purpose:
            query = query.where(UserOTP.for_purpose == for_purpose)
        
        query = query.order_by(UserOTP.created_at.desc()).offset(skip).limit(limit)
        
        result = await session.execute(query)
        return result.scalars().all()
    
    async def verify_otp(
        self, 
        session: AsyncSession, 
        user_id: int, 
        otp_code: str,
        for_purpose: Optional[str] = None
    ) -> tuple[bool, Optional[UserOTP]]:
        """
        Verify an OTP code for a user
        
        Args:
            session: Database session
            user_id: User ID
            otp_code: OTP code to verify
            for_purpose: Optional purpose filter
            
        Returns:
            Tuple of (is_valid, otp_object)
        """
        # Get the most recent valid OTP for the user
        otp = await self.get_valid_otp_by_user(session, user_id, for_purpose)
        
        if not otp:
            return False, None
        
        # Increment attempts
        otp.attempts += 1
        
        # Check if OTP code matches
        if otp.otp_code != otp_code:
            await session.flush()
            return False, otp
        
        # Mark OTP as used
        otp.is_used = True
        await session.flush()
        
        return True, otp
    
    async def invalidate_user_otps(
        self, 
        session: AsyncSession, 
        user_id: int,
        for_purpose: Optional[str] = None
    ) -> int:
        """
        Invalidate all unused OTPs for a user
        
        Args:
            session: Database session
            user_id: User ID
            for_purpose: Optional purpose filter
            
        Returns:
            Number of OTPs invalidated
        """
        query = select(UserOTP).where(
            and_(
                UserOTP.user_id == user_id,
                UserOTP.is_used == False
            )
        )
        
        if for_purpose:
            query = query.where(UserOTP.for_purpose == for_purpose)
        
        result = await session.execute(query)
        otps = result.scalars().all()
        
        for otp in otps:
            otp.is_used = True
        
        await session.flush()
        return len(otps)
    
    async def cleanup_expired_otps(self, session: AsyncSession) -> int:
        """
        Remove expired OTPs from database
        
        Args:
            session: Database session
            
        Returns:
            Number of OTPs removed
        """
        result = await session.execute(
            select(UserOTP).where(
                or_(
                    UserOTP.expires_at < datetime.utcnow(),
                    UserOTP.is_used == True
                )
            )
        )
        expired_otps = result.scalars().all()
        
        for otp in expired_otps:
            await session.delete(otp)
        
        await session.flush()
        return len(expired_otps)
    
    async def get_otp_status(
        self, 
        session: AsyncSession, 
        user_id: int,
        for_purpose: Optional[str] = None
    ) -> dict:
        """
        Get OTP status for a user
        
        Args:
            session: Database session
            user_id: User ID
            for_purpose: Optional purpose filter
            
        Returns:
            Dictionary with OTP status information
        """
        # Get valid OTP
        valid_otp = await self.get_valid_otp_by_user(session, user_id, for_purpose)
        
        if not valid_otp:
            return {
                "has_valid_otp": False,
                "for_purpose": for_purpose,
                "expires_in": None,
                "attempts_remaining": None
            }
        
        # Calculate time remaining
        time_remaining = valid_otp.expires_at - datetime.utcnow()
        expires_in_seconds = int(time_remaining.total_seconds())
        
        # Calculate attempts remaining (assuming max 5 attempts)
        max_attempts = 5
        attempts_remaining = max(0, max_attempts - valid_otp.attempts)
        
        return {
            "has_valid_otp": True,
            "for_purpose": valid_otp.for_purpose,
            "expires_in": expires_in_seconds,
            "attempts_remaining": attempts_remaining
        }
    
    async def resend_otp(
        self, 
        session: AsyncSession, 
        user_id: int,
        for_purpose: str = "verification",
        expires_in_minutes: int = 2
    ) -> Optional[UserOTP]:
        """
        Resend OTP for a user (invalidate old ones and create new)
        
        Args:
            session: Database session
            user_id: User ID
            for_purpose: Purpose of the OTP
            expires_in_minutes: Minutes until new OTP expires
            
        Returns:
            New OTP object or None if user not found
        """
        try:
            # Invalidate existing OTPs for this purpose
            await self.invalidate_user_otps(session, user_id, for_purpose)
            
            # Create new OTP
            new_otp = await self.create_otp(
                session, 
                user_id, 
                for_purpose,
                expires_in_minutes
            )
            
            return new_otp
        except ValueError:
            return None
    
    async def update_otp(
        self, 
        session: AsyncSession, 
        otp_id: int, 
        update_data: UserOTPUpdate
    ) -> Optional[UserOTP]:
        """
        Update OTP information
        
        Args:
            session: Database session
            otp_id: OTP ID
            update_data: OTP update data
            
        Returns:
            Updated OTP object or None if not found
        """
        otp = await self.get_by_id(session, otp_id)
        if not otp:
            return None
        
        # Update fields if provided
        update_dict = update_data.dict(exclude_unset=True)
        
        for field, value in update_dict.items():
            setattr(otp, field, value)
        
        await session.flush()
        await session.refresh(otp)
        
        return otp
    
    async def delete_otp(self, session: AsyncSession, otp_id: int) -> bool:
        """
        Delete OTP by ID
        
        Args:
            session: Database session
            otp_id: OTP ID
            
        Returns:
            True if OTP was deleted, False if not found
        """
        otp = await self.get_by_id(session, otp_id)
        if not otp:
            return False
        
        await session.delete(otp)
        await session.flush()
        return True
    
    async def count_user_otps(
        self, 
        session: AsyncSession, 
        user_id: int,
        for_purpose: Optional[str] = None,
        is_used: Optional[bool] = None
    ) -> int:
        """
        Count OTPs for a user with optional filtering
        
        Args:
            session: Database session
            user_id: User ID
            for_purpose: Optional purpose filter
            is_used: Filter by used status
            
        Returns:
            Number of OTPs matching criteria
        """
        from sqlalchemy import func
        
        query = select(func.count(UserOTP.id)).where(UserOTP.user_id == user_id)
        
        if for_purpose:
            query = query.where(UserOTP.for_purpose == for_purpose)
        
        if is_used is not None:
            query = query.where(UserOTP.is_used == is_used)
        
        result = await session.execute(query)
        return result.scalar()


# Create global instance
user_otp_crud = UserOTPCRUD()
