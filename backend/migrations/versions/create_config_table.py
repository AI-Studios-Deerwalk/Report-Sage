"""create_config_table

Revision ID: create_config_table
Revises: eaabcb6ca5bf
Create Date: 2025-01-27 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'create_config_table'
down_revision: Union[str, None] = 'eaabcb6ca5bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create configs table
    op.create_table('configs',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('smtp_server', sa.String(255), nullable=False),
        sa.Column('smtp_port', sa.String(10), nullable=False),
        sa.Column('smtp_username', sa.String(255), nullable=False),
        sa.Column('smtp_password', sa.String(255), nullable=False),
        sa.Column('from_email', sa.String(255), nullable=False),
        sa.Column('from_name', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )


def downgrade() -> None:
    # Drop configs table
    op.drop_table('configs')
