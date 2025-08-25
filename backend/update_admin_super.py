#!/usr/bin/env python3
"""
Script to check and update admin super admin status
"""

import asyncio
import sys
import os

# Add the backend root to the Python path
backend_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_root)

from database.connection import db_manager
from models.admin import Admin
from sqlalchemy.future import select

async def check_admin_status():
    """Check the current admin status in the database"""
    try:
        db_manager.initialize()
        async with db_manager.get_async_session() as session:
            # Get all admins
            result = await session.execute(select(Admin))
            admins = result.scalars().all()
            
            print("\n🔍 Current Admin Status:")
            print("=" * 50)
            for admin in admins:
                print(f"Email: {admin.email}")
                print(f"ID: {admin.aid}")
                print(f"Active: {admin.is_active}")
                print(f"Super Admin: {admin.is_superadmin}")
                print(f"Created: {admin.created_at}")
                print("-" * 30)
            
            return admins
            
    except Exception as e:
        print(f"❌ Error checking admin status: {e}")
        return []

async def make_admin_super(email: str):
    """Make a specific admin a super admin"""
    try:
        db_manager.initialize()
        async with db_manager.get_async_session() as session:
            # Find the admin
            result = await session.execute(select(Admin).where(Admin.email == email))
            admin = result.scalar_one_or_none()
            
            if not admin:
                print(f"❌ Admin with email {email} not found")
                return False
            
            print(f"📧 Found admin: {admin.email}")
            print(f"Current super admin status: {admin.is_superadmin}")
            
            if admin.is_superadmin:
                print("✅ Admin is already a super admin")
                return True
            
            # Update to super admin
            admin.is_superadmin = True
            await session.commit()
            
            print("✅ Admin updated to super admin successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error updating admin: {e}")
        return False

async def main():
    """Main function"""
    print("🚀 Admin Status Checker and Updater")
    print("=" * 50)
    
    # Check current status
    admins = await check_admin_status()
    
    if not admins:
        print("❌ No admins found or error occurred")
        return
    
    # Ask user which admin to make super
    print("\n🤔 Which admin would you like to make a super admin?")
    print("Available admins:")
    for i, admin in enumerate(admins, 1):
        print(f"{i}. {admin.email} (Super: {admin.is_superadmin})")
    
    try:
        choice = input("\nEnter the number (or 'q' to quit): ").strip()
        if choice.lower() == 'q':
            return
        
        choice_idx = int(choice) - 1
        if 0 <= choice_idx < len(admins):
            selected_admin = admins[choice_idx]
            print(f"\n🎯 Selected: {selected_admin.email}")
            
            if selected_admin.is_superadmin:
                print("✅ This admin is already a super admin!")
            else:
                confirm = input("Make this admin a super admin? (y/n): ").strip().lower()
                if confirm == 'y':
                    success = await make_admin_super(selected_admin.email)
                    if success:
                        print("✅ Admin updated successfully!")
                        # Show updated status
                        await check_admin_status()
                else:
                    print("❌ Operation cancelled")
        else:
            print("❌ Invalid choice")
            
    except ValueError:
        print("❌ Invalid input")
    except KeyboardInterrupt:
        print("\n❌ Operation cancelled by user")

if __name__ == "__main__":
    asyncio.run(main())
