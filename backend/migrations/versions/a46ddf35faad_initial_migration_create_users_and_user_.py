"""Initial migration: Create users and user_otps tables

Revision ID: a46ddf35faad
Revises: 
Create Date: 2025-08-20 14:43:44.967221

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a46ddf35faad'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('uid', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password', sa.String(length=255), nullable=False),
        sa.Column('fname', sa.String(length=128), nullable=False),
        sa.Column('lname', sa.String(length=128), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=True),
        sa.Column('is_email_verified', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('uid')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_uid'), 'users', ['uid'], unique=False)
    
    # Create user_otps table
    op.create_table('user_otps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('otp_code', sa.String(length=10), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('attempts', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.uid'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_otps_id'), 'user_otps', ['id'], unique=False)
    op.create_index(op.f('ix_user_otps_user_id'), 'user_otps', ['user_id'], unique=False)


def downgrade() -> None:
    # Drop user_otps table first (due to foreign key constraint)
    op.drop_index(op.f('ix_user_otps_user_id'), table_name='user_otps')
    op.drop_index(op.f('ix_user_otps_id'), table_name='user_otps')
    op.drop_table('user_otps')
    
    # Drop users table
    op.drop_index(op.f('ix_users_uid'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
