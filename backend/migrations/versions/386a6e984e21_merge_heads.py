"""merge heads

Revision ID: 386a6e984e21
Revises: 9e6b6c399610, a8e913301094
Create Date: 2025-08-20 11:58:10.529373

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '386a6e984e21'
down_revision: Union[str, None] = ('9e6b6c399610', 'a8e913301094')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
