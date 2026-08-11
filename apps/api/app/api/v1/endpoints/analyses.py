"""
Endpoints Analyses IA — consultation des analyses de sentiments.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.utilisateur import Utilisateur
from app.models.analyse_ia import AnalyseIA
from app.schemas.analyse import AnalyseIAResponse

router = APIRouter()


@router.get("/{feedback_id}", response_model=AnalyseIAResponse)
def get_analyse(
    feedback_id: UUID,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_active_user),
):
    """Retourne l'analyse IA d'un feedback spécifique."""
    analyse = db.query(AnalyseIA).filter(AnalyseIA.feedback_id == feedback_id).first()
    if not analyse:
        raise HTTPException(status_code=404, detail="Analyse introuvable")
    return analyse
