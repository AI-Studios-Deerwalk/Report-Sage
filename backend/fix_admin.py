#!/usr/bin/env python3
"""
Script to fix admin permissions and make existing admins super admins
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

async def fix_admin_permissions():
    """Update existing admin accounts to have proper permissions"""
    try:
        print("🔧 Starting admin permission fix...")
        
        # Initialize database connection
        db_manager.initialize()
        
        async with db_manager.get_async_session() as session:
            # Get all existing admins
            result = await session.execute(select(Admin))
            admins = result.scalars().all()
            
            print(f"📋 Found {len(admins)} admin(s) in database:")
            
            for admin in admins:
                print(f"   - {admin.email} (ID: {admin.aid})")
                print(f"     Current is_superadmin: {admin.is_superadmin}")
                print(f"     Current is_active: {admin.is_active}")
                
                # Update specific admins to be super admins
                if admin.email in ["ason.gautam12@gmail.com", "bidushi.thapa05@gmail.com"]:
                    if not admin.is_superadmin:
                        admin.is_superadmin = True
                        print(f"     ✅ Updated {admin.email} to super admin")
                    else:
                        print(f"     ℹ️  {admin.email} is already a super admin")
                else:
                    # Keep other admins as regular admins
                    print(f"     ℹ️  {admin.email} remains a regular admin")
            
            # Commit changes
            await session.commit()
            print("\n✅ Admin permissions updated successfully!")
            
            # Verify the changes
            print("\n🔍 Verifying changes...")
            result = await session.execute(select(Admin))
            admins = result.scalars().all()
            
            for admin in admins:
                print(f"   - {admin.email}: is_superadmin = {admin.is_superadmin}")
                
    except Exception as e:
        print(f"❌ Error fixing admin permissions: {e}")
        return False
    
    return True

async def main():
    """Main function"""
    print("🚀 Admin Permission Fix Tool")
    print("=" * 40)
    
    success = await fix_admin_permissions()
    
    if success:
        print("\n🎉 Admin permissions have been fixed!")
        print("You can now log in again and access the admin tools page.")
    else:
        print("\n💥 Failed to fix admin permissions.")
        print("Please check the error messages above.")

if __name__ == "__main__":
    asyncio.run(main())
