"""
Endpoints Utilisateurs — gestion par l'Administrateur et le CX Manager.
"""
from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_cx_or_admin, get_current_active_user, get_db
from app.core.security import get_password_hash
from app.models.utilisateur import Utilisateur
from app.models.enums import UserRole
from app.schemas.utilisateur import UtilisateurCreate, UtilisateurUpdate, UtilisateurResponse

router = APIRouter()


@router.get("/", response_model=List[UtilisateurResponse])
def list_utilisateurs(
    org_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_cx_or_admin),
):
    """
    Liste les utilisateurs selon le rôle :
    - Admin : tous les utilisateurs (filtrable par org_id)
    - CX Manager : tous les utilisateurs de son organisation
    """
    if current_user.role == UserRole.ADMIN:
        if org_id:
            return db.query(Utilisateur).filter(Utilisateur.organisation_id == org_id).all()
        return db.query(Utilisateur).all()
    else:
        # CX Manager : uniquement les utilisateurs de son organisation
        return db.query(Utilisateur).filter(
            Utilisateur.organisation_id == current_user.organisation_id
        ).all()


@router.post("/", response_model=UtilisateurResponse, status_code=status.HTTP_201_CREATED)
def create_utilisateur(
    data: UtilisateurCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_cx_or_admin),
):
    """
    Crée un nouvel utilisateur :
    - Admin : peut créer n'importe quel rôle (ADMIN, CX_MANAGER, AGENCY_MANAGER) pour n'importe quelle organisation.
    - CX Manager : peut uniquement créer des AGENCY_MANAGER pour son organisation.
    """
    existing = db.query(Utilisateur).filter(Utilisateur.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    # Vérification des rôles et organisation
    if current_user.role == UserRole.CX_MANAGER:
        if data.role != UserRole.AGENCY_MANAGER:
            raise HTTPException(status_code=403, detail="Un CX Manager ne peut créer que des comptes Agency Manager")
        target_org_id = current_user.organisation_id
    else:
        # Admin
        target_org_id = data.organisation_id or current_user.organisation_id

    user = Utilisateur(
        organisation_id=target_org_id,
        nom=data.nom,
        prenom=data.prenom,
        email=data.email,
        mot_de_passe_hash=get_password_hash(data.password),
        role=data.role,
        agence_id=data.agence_id,
        active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UtilisateurResponse)
def get_utilisateur(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_cx_or_admin),
):
    query = db.query(Utilisateur).filter(Utilisateur.id == user_id)
    if current_user.role == UserRole.CX_MANAGER:
        query = query.filter(Utilisateur.organisation_id == current_user.organisation_id)
    
    user = query.first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return user


@router.patch("/{user_id}", response_model=UtilisateurResponse)
def update_utilisateur(
    user_id: UUID,
    data: UtilisateurUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_cx_or_admin),
):
    query = db.query(Utilisateur).filter(Utilisateur.id == user_id)
    if current_user.role == UserRole.CX_MANAGER:
        query = query.filter(Utilisateur.organisation_id == current_user.organisation_id)

    user = query.first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    updates = data.model_dump(exclude_unset=True)
    if "password" in updates and updates["password"]:
        updates["mot_de_passe_hash"] = get_password_hash(updates.pop("password"))

    for field, value in updates.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_utilisateur(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_cx_or_admin),
):
    """Désactive un utilisateur (Soft Delete — active = False)."""
    query = db.query(Utilisateur).filter(Utilisateur.id == user_id)
    if current_user.role == UserRole.CX_MANAGER:
        query = query.filter(Utilisateur.organisation_id == current_user.organisation_id)

    user = query.first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    user.active = False
    db.commit()
