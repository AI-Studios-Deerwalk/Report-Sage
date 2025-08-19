"""change_uid_to_integer

Revision ID: 573c223863a6
Revises: 9988bad20350
Create Date: 2025-08-18 14:28:15.454307

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '573c223863a6'
down_revision: Union[str, None] = '9988bad20350'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Since we're changing the primary key type from UUID to Integer,
    # we need to recreate the table. This will clear existing data.
    
    # Drop the existing users table
    op.drop_table('users')
    
    # Create the new users table with integer uid using raw SQL
    op.execute('''
        CREATE TABLE users (
            uid SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            college_name VARCHAR(255) NOT NULL,
            role userrole NOT NULL,
            is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN NOT NULL DEFAULT TRUE
        )
    ''')
    
    # Create indexes
    op.create_index('ix_users_uid', 'users', ['uid'], unique=False)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)


def downgrade() -> None:
    # Drop the integer-based users table
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_uid'), table_name='users')
    op.drop_table('users')
    
    # Recreate the UUID-based users table
    op.create_table('users',
        sa.Column('uid', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('college_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('STUDENT', 'TEACHER', name='userrole', create_type=False), nullable=False),
        sa.Column('is_email_verified', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('uid')
    )
    
    # Create indexes
    op.create_index(op.f('ix_users_uid'), 'users', ['uid'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
