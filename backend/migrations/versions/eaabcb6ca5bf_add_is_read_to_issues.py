"""add_is_read_to_issues

Revision ID: eaabcb6ca5bf
Revises: e33a5b495736
Create Date: 2025-08-23 12:33:57.249864

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eaabcb6ca5bf'
down_revision: Union[str, None] = 'e33a5b495736'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_read column to issues table
    op.add_column('issues', sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove is_read column from issues table
    op.drop_column('issues', 'is_read')
