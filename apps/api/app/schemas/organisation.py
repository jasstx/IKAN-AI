"""
Schémas Pydantic pour les organisations (OrganisationCreate, OrganisationUpdate, OrganisationRead).
"""
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class OrganisationBase(BaseModel):
    nom: str = Field(..., description="Nom de l'organisation", min_length=2, max_length=255)
    logo: str | None = Field(default=None, description="Chemin ou URL du logo")
    secteur_activite: str = Field(..., description="Secteur d'activité de l'entreprise")
    pays_region: str = Field(..., description="Pays ou région principale")
    email_pro: EmailStr = Field(..., description="Adresse email professionnelle unique")


class OrganisationCreate(OrganisationBase):
    """Schéma de création d'une nouvelle organisation."""
    pass


class OrganisationUpdate(BaseModel):
    """Schéma de mise à jour partielle d'une organisation."""
    nom: str | None = None
    logo: str | None = None
    secteur_activite: str | None = None
    pays_region: str | None = None
    email_pro: EmailStr | None = None
    active: bool | None = None


class OrganisationRead(OrganisationBase):
    """Schéma de lecture d'une organisation."""
    id: uuid.UUID
    active: bool
    created_at: datetime

    # Alias pour compatibilité ascendante si nécessaire
    @property
    def secteur(self) -> str:
        return self.secteur_activite

    @property
    def email(self) -> str:
        return self.email_pro

    @property
    def date_creation(self) -> datetime:
        return self.created_at

    model_config = {"from_attributes": True}


# Alias pour rétro-compatibilité avec le reste du code
OrganisationResponse = OrganisationRead
