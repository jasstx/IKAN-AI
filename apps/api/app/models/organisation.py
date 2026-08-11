"""
Modèle Organisation — entité cliente de la plateforme IKAN AI (multi-tenant).
"""
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Organisation(Base):
    __tablename__ = "organisations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    secteur: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    telephone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    date_creation: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    active: Mapped[bool] = mapped_column(default=True)

    # Relations
    agences: Mapped[list["Agence"]] = relationship("Agence", back_populates="organisation")
    utilisateurs: Mapped[list["Utilisateur"]] = relationship(
        "Utilisateur", back_populates="organisation"
    )

    def __repr__(self) -> str:
        return f"<Organisation {self.nom}>"
