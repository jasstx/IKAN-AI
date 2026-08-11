"""
Schémas Pydantic pour les feedbacks (soumis par les clients).
"""
from __future__ import annotations
import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional


class FeedbackCreate(BaseModel):
    """Payload envoyé par le formulaire client."""
    note: int = Field(..., ge=1, le=5, description="Note de satisfaction (1 à 5)")
    commentaire: Optional[str] = Field(None, max_length=1000)
    # Suggestion optionnelle (BF-04)
    suggestion: Optional[str] = None
    # Demande de contact optionnelle
    contact_nom: Optional[str] = None
    contact_telephone: Optional[str] = None
    contact_email: Optional[str] = None
    souhaite_etre_rappele: bool = False


class AnalyseIAInfo(BaseModel):
    id: uuid.UUID
    sentiment: str
    criticite: str
    theme_principal: Optional[str] = None
    discordance_detectee: bool = False
    score_sentiment: Optional[float] = None

    model_config = {"from_attributes": True}


class DemandeContactInfo(BaseModel):
    id: uuid.UUID
    nom: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    souhaite_etre_rappele: bool = False
    traitee: bool = False

    model_config = {"from_attributes": True}


class FeedbackResponse(BaseModel):
    id: uuid.UUID
    qr_code_id: uuid.UUID
    agence_id: Optional[uuid.UUID] = None
    agence_nom: Optional[str] = None
    note: int
    commentaire: Optional[str]
    date_soumission: datetime
    analyse_ia: Optional[AnalyseIAInfo] = None
    demande_contact: Optional[DemandeContactInfo] = None

    model_config = {"from_attributes": True}
