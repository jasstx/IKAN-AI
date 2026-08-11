"""
Modèle Organisation — entité cliente de la plateforme IKAN AI (multi-tenant).
"""
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Organisation(Base):
    __tablename__ = "organisations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    logo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    secteur_activite: Mapped[str] = mapped_column(String(100), nullable=False, default="Télécommunications")
    pays_region: Mapped[str] = mapped_column(String(100), nullable=False, default="Tunisie / Afrique du Nord")
    email_pro: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Propriétés de rétro-compatibilité
    @property
    def secteur(self) -> str:
        return self.secteur_activite

    @property
    def email(self) -> str:
        return self.email_pro

    @property
    def date_creation(self) -> datetime:
        return self.created_at

    # Relations
    agences: Mapped[list["Agence"]] = relationship("Agence", back_populates="organisation")
    utilisateurs: Mapped[list["Utilisateur"]] = relationship(
        "Utilisateur", back_populates="organisation"
    )

    def __repr__(self) -> str:
        return f"<Organisation {self.nom} ({self.email_pro})>"
