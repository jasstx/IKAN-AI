"""update_organisation_fields

Revision ID: 002_organisation_fields
Revises: 001_system_settings
Create Date: 2026-08-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '002_organisation_fields'
down_revision = '001_system_settings'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Ajouter la colonne logo si elle n'existe pas
    op.add_column('organisations', sa.Column('logo', sa.String(length=500), nullable=True))

    # 2. Renommer ou ajouter secteur_activite
    op.add_column('organisations', sa.Column('secteur_activite', sa.String(length=100), nullable=True))
    op.execute("UPDATE organisations SET secteur_activite = secteur WHERE secteur_activite IS NULL;")
    op.alter_column('organisations', 'secteur_activite', nullable=False, server_default='Télécommunications')

    # 3. Ajouter pays_region
    op.add_column('organisations', sa.Column('pays_region', sa.String(length=100), nullable=True))
    op.execute("UPDATE organisations SET pays_region = 'Tunisie / Afrique du Nord' WHERE pays_region IS NULL;")
    op.alter_column('organisations', 'pays_region', nullable=False, server_default='Tunisie / Afrique du Nord')

    # 4. Renommer ou ajouter email_pro avec contrainte d'unicité
    op.add_column('organisations', sa.Column('email_pro', sa.String(length=255), nullable=True))
    op.execute("UPDATE organisations SET email_pro = email WHERE email_pro IS NULL;")
    op.alter_column('organisations', 'email_pro', nullable=False)
    op.create_index(op.f('ix_organisations_email_pro'), 'organisations', ['email_pro'], unique=True)

    # 5. Ajouter created_at
    op.add_column('organisations', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    op.execute("UPDATE organisations SET created_at = date_creation WHERE created_at IS NULL;")
    op.alter_column('organisations', 'created_at', nullable=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_organisations_email_pro'), table_name='organisations')
    op.drop_column('organisations', 'created_at')
    op.drop_column('organisations', 'email_pro')
    op.drop_column('organisations', 'pays_region')
    op.drop_column('organisations', 'secteur_activite')
    op.drop_column('organisations', 'logo')
