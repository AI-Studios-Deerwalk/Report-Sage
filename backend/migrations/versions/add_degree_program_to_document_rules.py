"""Add degree_program column to document_rules table

Revision ID: add_degree_program_column
Revises: 9a1b2c3d4e5f
Create Date: 2024-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_degree_program_column'
down_revision = '9a1b2c3d4e5f'
branch_labels = None
depends_on = None


def upgrade():
    # Add degree_program column to document_rules table
    op.add_column('document_rules', sa.Column('degree_program', sa.String(), nullable=True))
    
    # Create index for degree_program column
    op.create_index(op.f('ix_document_rules_degree_program'), 'document_rules', ['degree_program'], unique=False)


def downgrade():
    # Drop index first
    op.drop_index(op.f('ix_document_rules_degree_program'), table_name='document_rules')
    
    # Drop degree_program column
    op.drop_column('document_rules', 'degree_program')
