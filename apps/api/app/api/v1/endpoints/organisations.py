"""
Endpoints Organisations — gestion par l'Administrateur.
"""
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_db
from app.models.utilisateur import Utilisateur
from app.models.organisation import Organisation
from app.schemas.organisation import OrganisationCreate, OrganisationUpdate, OrganisationResponse

router = APIRouter()


@router.get("/", response_model=List[OrganisationResponse])
def list_organisations(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_admin_user),
):
    """Liste toutes les organisations (Admin uniquement)."""
    return db.query(Organisation).all()


@router.post("/", response_model=OrganisationResponse, status_code=status.HTTP_201_CREATED)
def create_organisation(
    data: OrganisationCreate,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_admin_user),
):
    """Crée une nouvelle organisation (Admin uniquement)."""
    existing = db.query(Organisation).filter(Organisation.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    org = Organisation(**data.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.get("/{org_id}", response_model=OrganisationResponse)
def get_organisation(
    org_id: UUID,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_admin_user),
):
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation introuvable")
    return org


@router.patch("/{org_id}", response_model=OrganisationResponse)
def update_organisation(
    org_id: UUID,
    data: OrganisationUpdate,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_admin_user),
):
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation introuvable")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(org, field, value)
    db.commit()
    db.refresh(org)
    return org


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organisation(
    org_id: UUID,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_admin_user),
):
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation introuvable")
    db.delete(org)
    db.commit()
