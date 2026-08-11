"""
Modèle Feedback — avis soumis par un client anonyme via QR Code.
Le feedback est anonyme et accessible uniquement après le scan du QR Code.
"""
import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    qr_code_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("qr_codes.id", ondelete="CASCADE"), nullable=False
    )
    # Note de satisfaction (1 à 5 étoiles)
    note: Mapped[int] = mapped_column(Integer, nullable=False)
    # Commentaire libre (max 1000 caractères — BF-03)
    commentaire: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    date_soumission: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relations
    qr_code: Mapped["QRCode"] = relationship("QRCode", back_populates="feedbacks")
    suggestion: Mapped["Suggestion | None"] = relationship(
        "Suggestion", back_populates="feedback", uselist=False, cascade="all, delete-orphan"
    )
    analyse_ia: Mapped["AnalyseIA | None"] = relationship(
        "AnalyseIA", back_populates="feedback", uselist=False, cascade="all, delete-orphan"
    )
    demande_contact: Mapped["DemandeContact | None"] = relationship(
        "DemandeContact", back_populates="feedback", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Feedback note={self.note} qr={self.qr_code_id}>"
