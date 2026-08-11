"""
Endpoints Feedbacks — soumission par les clients (anonyme) et consultation par les managers.
"""
from uuid import UUID
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_cx_or_agency_manager, get_db
from app.models.utilisateur import Utilisateur
from app.models.feedback import Feedback
from app.models.qr_code import QRCode
from app.models.suggestion import Suggestion
from app.models.demande_contact import DemandeContact
from app.models.enums import UserRole
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.services.ai.analyse_service import analyser_feedback

router = APIRouter()


@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    qr_code: str,
    data: FeedbackCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Soumet un feedback client — endpoint PUBLIC (pas d'authentification requise).
    Déclenche l'analyse IA en tâche de fond.
    BF-01, BF-02, BF-03, BF-04, BF-05
    """
    # Valider le QR code
    qr = db.query(QRCode).filter(
        QRCode.code == qr_code,
        QRCode.actif == True,
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="QR Code invalide")

    try:
        # Créer le feedback
        feedback = Feedback(
            qr_code_id=qr.id,
            note=data.note,
            commentaire=data.commentaire,
        )
        db.add(feedback)
        db.flush()  # Obtenir l'ID sans commit

        # Ajouter la suggestion si fournie (BF-04)
        if data.suggestion:
            suggestion = Suggestion(
                feedback_id=feedback.id,
                contenu=data.suggestion,
            )
            db.add(suggestion)

        # Ajouter la demande de contact si fournie
        if data.souhaite_etre_rappele or data.contact_email:
            contact = DemandeContact(
                feedback_id=feedback.id,
                nom=data.contact_nom,
                telephone=data.contact_telephone,
                email=data.contact_email,
                souhaite_etre_rappele=data.souhaite_etre_rappele,
            )
            db.add(contact)

        db.commit()
        db.refresh(feedback)

        # Analyse IA en arrière-plan (BF-06, BF-17) - Ne PAS passer la session db fermée de la requête HTTP
        background_tasks.add_task(analyser_feedback, feedback.id)

        res_item = FeedbackResponse.model_validate(feedback)
        res_item.agence_id = qr.agence_id
        if qr.agence:
            res_item.agence_nom = qr.agence.nom

        return res_item
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur enregistrement feedback: {str(e)}")


@router.get("/", response_model=List[FeedbackResponse])
def list_feedbacks(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_cx_or_agency_manager),
    agence_id: Optional[UUID] = Query(None),
    date_debut: Optional[datetime] = Query(None),
    date_fin: Optional[datetime] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
):
    """
    Liste les feedbacks pour CX Manager et Agency Manager uniquement.
    Exclusion stricte du rôle ADMIN (403).
    """
    # Base query avec jointures pour filtrer par organisation
    query = (
        db.query(Feedback)
        .join(QRCode, Feedback.qr_code_id == QRCode.id)
    )

    if current_user.role == UserRole.AGENCY_MANAGER:
        # Ne voit que les feedbacks de son agence
        query = query.filter(QRCode.agence_id == current_user.agence_id)
    elif current_user.role == UserRole.CX_MANAGER:
        # Voit tous les feedbacks des agences de son organisation
        from app.models.agence import Agence
        query = query.join(Agence, QRCode.agence_id == Agence.id).filter(
            Agence.organisation_id == current_user.organisation_id
        )
        if agence_id:
            query = query.filter(QRCode.agence_id == agence_id)

    if date_debut:
        query = query.filter(Feedback.date_soumission >= date_debut)
    if date_fin:
        query = query.filter(Feedback.date_soumission <= date_fin)

    feedbacks = query.order_by(Feedback.date_soumission.desc()).offset(offset).limit(limit).all()

    response_list = []
    for f in feedbacks:
        item = FeedbackResponse.model_validate(f)
        if f.qr_code and f.qr_code.agence:
            item.agence_id = f.qr_code.agence_id
            item.agence_nom = f.qr_code.agence.nom
        response_list.append(item)

    return response_list


@router.get("/{feedback_id}", response_model=FeedbackResponse)
def get_feedback(
    feedback_id: UUID,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_cx_or_agency_manager),
):
    """Obtient un feedback par ID (CX Manager / Agency Manager)."""
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback introuvable")

    # Vérification d'accès
    qr = db.query(QRCode).filter(QRCode.id == feedback.qr_code_id).first()
    if current_user.role == UserRole.AGENCY_MANAGER and qr.agence_id != current_user.agence_id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    item = FeedbackResponse.model_validate(feedback)
    if qr and qr.agence:
        item.agence_id = qr.agence_id
        item.agence_nom = qr.agence.nom

    return item


@router.patch("/demandes-contact/{contact_id}/traiter")
def marquer_demande_contact_traitee(
    contact_id: UUID,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_cx_or_agency_manager),
):
    """Marque une demande de contact client comme traitée (CX Manager / Agency Manager)."""
    dc = db.query(DemandeContact).filter(DemandeContact.id == contact_id).first()
    if not dc:
        raise HTTPException(status_code=404, detail="Demande de contact introuvable")
    dc.traitee = True
    db.commit()
    return {"message": "Demande de contact marquée comme traitée"}
