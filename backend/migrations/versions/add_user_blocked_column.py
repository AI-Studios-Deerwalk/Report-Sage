"""Add is_blocked column to users table

Revision ID: add_user_blocked_column
Revises: 19f27a94658c
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_user_blocked_column'
down_revision = '19f27a94658c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_blocked column to users table
    op.add_column('users', sa.Column('is_blocked', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove is_blocked column from users table
    op.drop_column('users', 'is_blocked')
