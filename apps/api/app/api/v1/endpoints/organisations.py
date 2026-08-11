"""
Endpoints CRUD Organisations — réservés exclusivement au rôle Administrateur (RBAC).
"""
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_db
from app.models.utilisateur import Utilisateur
from app.models.organisation import Organisation
from app.schemas.organisation import OrganisationCreate, OrganisationUpdate, OrganisationRead

router = APIRouter()


@router.get("/", response_model=List[OrganisationRead])
def list_organisations(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_admin_user),
):
    """Liste toutes les organisations (Réservé au rôle Admin)."""
    return db.query(Organisation).order_by(Organisation.created_at.desc()).all()


@router.post("/", response_model=OrganisationRead, status_code=status.HTTP_201_CREATED)
def create_organisation(
    data: OrganisationCreate,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_admin_user),
):
    """Crée une nouvelle organisation (Réservé au rôle Admin)."""
    # Vérification de l'unicité de l'email professionnel
    existing = db.query(Organisation).filter(Organisation.email_pro == data.email_pro).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Une organisation avec l'email professionnel '{data.email_pro}' existe déjà."
        )

    org_data = data.model_dump()
    org_data["email"] = data.email_pro
    org_data["secteur"] = data.secteur_activite

    org = Organisation(**org_data)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.get("/{org_id}", response_model=OrganisationRead)
def get_organisation(
    org_id: UUID,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_admin_user),
):
    """Obtient le détail d'une organisation par son ID (Réservé au rôle Admin)."""
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organisation introuvable")
    return org


@router.patch("/{org_id}", response_model=OrganisationRead)
def update_organisation(
    org_id: UUID,
    data: OrganisationUpdate,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_admin_user),
):
    """Met à jour partiellement une organisation (Réservé au rôle Admin)."""
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organisation introuvable")

    # Si l'email pro est modifié, vérifier qu'il reste unique
    if data.email_pro and data.email_pro != org.email_pro:
        dup = db.query(Organisation).filter(
            Organisation.email_pro == data.email_pro,
            Organisation.id != org_id
        ).first()
        if dup:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"L'email professionnel '{data.email_pro}' est déjà utilisé par une autre organisation."
            )

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
    """Supprime une organisation (Réservé au rôle Admin)."""
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organisation introuvable")
    
    db.delete(org)
    db.commit()
