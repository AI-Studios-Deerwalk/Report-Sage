"""Add is_superadmin column to admins table

Revision ID: add_is_superadmin_to_admins
Revises: e33a5b495736
Create Date: 2025-01-23 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_is_superadmin_to_admins'
down_revision: Union[str, None] = 'create_config_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_superadmin column to admins table
    op.add_column('admins', sa.Column('is_superadmin', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove is_superadmin column from admins table
    op.drop_column('admins', 'is_superadmin')
