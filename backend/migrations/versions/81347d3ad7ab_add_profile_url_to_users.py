"""add_profile_url_to_users

Revision ID: 81347d3ad7ab
Revises: 27ebf0fab472
Create Date: 2025-09-18 08:45:45.929324

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '81347d3ad7ab'
down_revision = '27ebf0fab472'
branch_labels = None
depends_on = None


def upgrade():
    # Add profile_url column to users table
    op.add_column('users', sa.Column('profile_url', sa.String(length=500), nullable=True))


def downgrade():
    # Remove profile_url column from users table
    op.drop_column('users', 'profile_url')
