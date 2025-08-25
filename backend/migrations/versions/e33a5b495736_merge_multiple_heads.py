"""merge multiple heads

Revision ID: e33a5b495736
Revises: add_user_blocked_column, 8c74856a1cf1, fe2d3feda58d
Create Date: 2025-08-22 17:45:44.754191

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e33a5b495736'
down_revision: Union[str, None] = ('add_user_blocked_column', '8c74856a1cf1', 'fe2d3feda58d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
