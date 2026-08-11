"""
Schémas Pydantic pour les organisations.
"""
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class OrganisationCreate(BaseModel):
    nom: str
    secteur: str
    email: EmailStr
    telephone: str | None = None


class OrganisationUpdate(BaseModel):
    nom: str | None = None
    secteur: str | None = None
    email: EmailStr | None = None
    telephone: str | None = None
    active: bool | None = None


class OrganisationResponse(BaseModel):
    id: uuid.UUID
    nom: str
    secteur: str
    email: str
    telephone: str | None
    active: bool
    date_creation: datetime

    model_config = {"from_attributes": True}
