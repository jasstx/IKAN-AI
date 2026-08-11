"""
Schémas Pydantic pour l'authentification.
"""
from pydantic import BaseModel, EmailStr
from app.models.enums import UserRole
import uuid


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: uuid.UUID
    nom: str
    prenom: str
    email: str
    role: UserRole
    organisation_id: uuid.UUID
    agence_id: uuid.UUID | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    message: str
    user: UserPublic
