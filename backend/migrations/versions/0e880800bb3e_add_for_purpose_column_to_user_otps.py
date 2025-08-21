"""add_for_purpose_column_to_user_otps

Revision ID: 0e880800bb3e
Revises: a46ddf35faad
Create Date: 2025-08-20 21:21:11.780211

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0e880800bb3e'
down_revision: Union[str, None] = 'a46ddf35faad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum type for OTP purposes (only if it doesn't exist)
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    
    # Check if enum type already exists
    existing_enums = inspector.get_enums()
    enum_exists = any(enum['name'] == 'otppurpose' for enum in existing_enums)
    
    if not enum_exists:
        otp_purpose_enum = sa.Enum('verification', 'forgot_password', name='otppurpose')
        otp_purpose_enum.create(connection)
    
    # Add for_purpose column to user_otps table
    op.add_column('user_otps', sa.Column('for_purpose', sa.Enum('verification', 'forgot_password', name='otppurpose'), nullable=True))
    
    # Set default value for existing records
    op.execute("UPDATE user_otps SET for_purpose = 'verification' WHERE for_purpose IS NULL")
    
    # Make the column not nullable after setting default values
    op.alter_column('user_otps', 'for_purpose', nullable=False)
    
    # Create index on for_purpose column
    op.create_index(op.f('ix_user_otps_for_purpose'), 'user_otps', ['for_purpose'], unique=False)


def downgrade() -> None:
    # Drop index
    op.drop_index(op.f('ix_user_otps_for_purpose'), table_name='user_otps')
    
    # Drop column
    op.drop_column('user_otps', 'for_purpose')
    
    # Drop enum type (only if it exists)
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    
    # Check if enum type exists
    existing_enums = inspector.get_enums()
    enum_exists = any(enum['name'] == 'otppurpose' for enum in existing_enums)
    
    if enum_exists:
        otp_purpose_enum = sa.Enum(name='otppurpose')
        otp_purpose_enum.drop(connection)
