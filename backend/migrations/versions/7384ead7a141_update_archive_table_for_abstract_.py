"""update_archive_table_for_abstract_analysis

Revision ID: 7384ead7a141
Revises: add_is_superadmin_to_admins
Create Date: 2025-09-01 16:00:01.718392

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7384ead7a141'
down_revision: Union[str, None] = 'add_is_superadmin_to_admins'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove old TU formatting analysis columns
    op.drop_column('archives', 'analysis_content')
    op.drop_column('archives', 'suggestions')
    op.drop_column('archives', 'warnings')
    op.drop_column('archives', 'errors')
    
    # Add new abstract analysis columns
    op.add_column('archives', sa.Column('analysis_results', sa.JSON(), nullable=True))
    op.add_column('archives', sa.Column('summary_data', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Remove new abstract analysis columns
    op.drop_column('archives', 'analysis_results')
    op.drop_column('archives', 'summary_data')
    
    # Restore old TU formatting analysis columns
    op.add_column('archives', sa.Column('analysis_content', sa.Text(), nullable=True))
    op.add_column('archives', sa.Column('suggestions', sa.JSON(), nullable=True))
    op.add_column('archives', sa.Column('warnings', sa.JSON(), nullable=True))
    op.add_column('archives', sa.Column('errors', sa.JSON(), nullable=True))
