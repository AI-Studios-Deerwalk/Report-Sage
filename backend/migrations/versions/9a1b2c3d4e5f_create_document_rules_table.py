"""Create document rules table

Revision ID: 9a1b2c3d4e5f
Revises: 7384ead7a141
Create Date: 2024-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '9a1b2c3d4e5f'
down_revision = '7384ead7a141'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('document_rules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('chunk_id', sa.String(), nullable=True),
        sa.Column('university', sa.String(), nullable=True),
        sa.Column('chapter', sa.String(), nullable=True),
        sa.Column('section', sa.String(), nullable=True),
        sa.Column('subsection', sa.String(), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('rules', sa.Text(), nullable=True),
        sa.Column('required_elements', sa.JSON(), nullable=True),
        sa.Column('quality_criteria', sa.JSON(), nullable=True),
        sa.Column('examples', sa.JSON(), nullable=True),
        sa.Column('common_mistakes', sa.JSON(), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('version', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_document_rules_chunk_id'), 'document_rules', ['chunk_id'], unique=True)
    op.create_index(op.f('ix_document_rules_id'), 'document_rules', ['id'], unique=False)
    op.create_index(op.f('ix_document_rules_university'), 'document_rules', ['university'], unique=False)
    op.create_index(op.f('ix_document_rules_chapter'), 'document_rules', ['chapter'], unique=False)
    op.create_index(op.f('ix_document_rules_section'), 'document_rules', ['section'], unique=False)

def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_document_rules_section'), table_name='document_rules')
    op.drop_index(op.f('ix_document_rules_chapter'), table_name='document_rules')
    op.drop_index(op.f('ix_document_rules_university'), table_name='document_rules')
    op.drop_index(op.f('ix_document_rules_id'), table_name='document_rules')
    op.drop_index(op.f('ix_document_rules_chunk_id'), table_name='document_rules')
    
    # Drop table
    op.drop_table('document_rules')
