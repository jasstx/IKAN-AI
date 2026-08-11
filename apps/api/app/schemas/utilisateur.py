"""
Schémas Pydantic pour les utilisateurs.
"""
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.enums import UserRole


class UtilisateurCreate(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    password: str
    role: UserRole
    organisation_id: uuid.UUID | None = None
    agence_id: uuid.UUID | None = None


class UtilisateurUpdate(BaseModel):
    nom: str | None = None
    prenom: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    agence_id: uuid.UUID | None = None
    active: bool | None = None


class UtilisateurResponse(BaseModel):
    id: uuid.UUID
    organisation_id: uuid.UUID
    agence_id: uuid.UUID | None
    nom: str
    prenom: str
    email: str
    role: UserRole
    active: bool
    date_creation: datetime

    model_config = {"from_attributes": True}
