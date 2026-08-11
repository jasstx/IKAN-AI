"""
Endpoints Dashboard — KPIs et indicateurs de satisfaction (BF-09).
"""
from uuid import UUID
from typing import Optional
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_current_active_user, get_cx_manager, get_cx_or_agency_manager, get_db
from app.models.utilisateur import Utilisateur
from app.models.feedback import Feedback
from app.models.qr_code import QRCode
from app.models.agence import Agence
from app.models.analyse_ia import AnalyseIA
from app.models.suggestion import Suggestion
from app.models.enums import UserRole, SentimentType
from app.schemas.dashboard import DashboardAgence, DashboardSiege, KPIAgence, TendanceSatisfaction, ThemeStats

router = APIRouter()


@router.get("/agence/{agence_id}", response_model=DashboardAgence)
def dashboard_agence(
    agence_id: UUID,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_cx_or_agency_manager),
    jours: int = Query(30, ge=1, le=365),
):
    """Dashboard complet pour un Agency Manager ou CX Manager."""
    agence = db.query(Agence).filter(Agence.id == agence_id).first()
    date_debut = datetime.now(timezone.utc) - timedelta(days=jours)

    # Feedbacks de la période
    feedbacks = (
        db.query(Feedback)
        .join(QRCode, Feedback.qr_code_id == QRCode.id)
        .filter(
            QRCode.agence_id == agence_id,
            Feedback.date_soumission >= date_debut,
        )
        .all()
    )

    total = len(feedbacks)
    if total == 0:
        taux = 0.0
    else:
        positifs = sum(1 for f in feedbacks if f.note >= 4)
        taux = round(positifs / total * 100, 1)

    # Analyses IA
    analyses_ids = [f.id for f in feedbacks]
    analyses = db.query(AnalyseIA).filter(AnalyseIA.feedback_id.in_(analyses_ids)).all()

    negatifs = sum(1 for a in analyses if a.sentiment == SentimentType.NEGATIF)
    from app.models.enums import CriticiteType
    critiques = sum(1 for a in analyses if a.criticite == CriticiteType.CRITIQUE)
    discordances = sum(1 for a in analyses if a.discordance_detectee)

    # Suggestions
    fb_ids = [f.id for f in feedbacks]
    nb_suggestions = db.query(Suggestion).filter(Suggestion.feedback_id.in_(fb_ids)).count()

    # Thèmes
    themes_count: dict[str, int] = {}
    for a in analyses:
        if a.theme_principal:
            themes_count[a.theme_principal] = themes_count.get(a.theme_principal, 0) + 1
    nb_analyses = len(analyses) or 1
    themes = [
        ThemeStats(theme=k, count=v, pourcentage=round(v / nb_analyses * 100, 1))
        for k, v in sorted(themes_count.items(), key=lambda x: -x[1])
    ]

    # Tendances (par semaine)
    tendances = _compute_tendances(feedbacks, jours)

    return DashboardAgence(
        agence_id=agence_id,
        agence_nom=agence.nom if agence else str(agence_id),
        periode=f"{jours} derniers jours",
        taux_satisfaction=taux,
        nombre_feedbacks=total,
        nombre_negatifs=negatifs,
        nombre_critiques=critiques,
        nombre_suggestions=nb_suggestions,
        tendances=tendances,
        themes=themes,
        discordances=discordances,
    )


@router.get("/siege", response_model=DashboardSiege)
def dashboard_siege(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_cx_manager),
    jours: int = Query(30, ge=1, le=365),
):
    """Dashboard vue siège réservé au CX Manager (Admin exclu)."""
    date_debut = datetime.now(timezone.utc) - timedelta(days=jours)

    agences = db.query(Agence).filter(
        Agence.organisation_id == current_user.organisation_id,
        Agence.active == True,
    ).all()

    kpis = []
    all_feedbacks = []

    for agence in agences:
        feedbacks = (
            db.query(Feedback)
            .join(QRCode, Feedback.qr_code_id == QRCode.id)
            .filter(
                QRCode.agence_id == agence.id,
                Feedback.date_soumission >= date_debut,
            )
            .all()
        )
        all_feedbacks.extend(feedbacks)
        total = len(feedbacks)
        taux = round(sum(1 for f in feedbacks if f.note >= 4) / total * 100, 1) if total else 0.0
        analyses_ids = [f.id for f in feedbacks]
        negatifs = db.query(AnalyseIA).filter(
            AnalyseIA.feedback_id.in_(analyses_ids),
            AnalyseIA.sentiment == SentimentType.NEGATIF,
        ).count()

        kpis.append(KPIAgence(
            agence_id=agence.id,
            agence_nom=agence.nom,
            ville=agence.ville,
            taux_satisfaction=taux,
            nombre_feedbacks=total,
            nombre_negatifs=negatifs,
            nombre_suggestions=db.query(Suggestion).filter(
                Suggestion.feedback_id.in_([f.id for f in feedbacks])
            ).count(),
            latitude=agence.latitude,
            longitude=agence.longitude,
        ))

    total_global = len(all_feedbacks)
    taux_global = (
        round(sum(1 for f in all_feedbacks if f.note >= 4) / total_global * 100, 1)
        if total_global else 0.0
    )

    from app.models.enums import IdeaStatus
    idees_attente = db.query(Suggestion).filter(
        Suggestion.statut == IdeaStatus.NOUVEAU
    ).count()

    tendances = _compute_tendances(all_feedbacks, jours)

    # Calcul des thèmes et sentiments globaux (toutes agences)
    all_fb_ids = [f.id for f in all_feedbacks]
    all_analyses = db.query(AnalyseIA).filter(AnalyseIA.feedback_id.in_(all_fb_ids)).all() if all_fb_ids else []

    # Thèmes globaux
    themes_count: dict[str, int] = {}
    for a in all_analyses:
        if a.theme_principal:
            themes_count[a.theme_principal] = themes_count.get(a.theme_principal, 0) + 1
    nb_analyses_total = len(all_analyses) or 1
    from app.schemas.dashboard import ThemeStats, SentimentStats
    themes_globaux = [
        ThemeStats(theme=k, count=v, pourcentage=round(v / nb_analyses_total * 100, 1))
        for k, v in sorted(themes_count.items(), key=lambda x: -x[1])
    ]

    # Sentiments globaux
    sentiments_count: dict[str, int] = {}
    for a in all_analyses:
        s = a.sentiment.value if hasattr(a.sentiment, 'value') else str(a.sentiment)
        sentiments_count[s] = sentiments_count.get(s, 0) + 1
    sentiments_globaux = [
        SentimentStats(sentiment=k, count=v, pourcentage=round(v / nb_analyses_total * 100, 1))
        for k, v in sorted(sentiments_count.items(), key=lambda x: -x[1])
    ]

    from app.models.enums import CriticiteType
    nombre_discordances = sum(1 for a in all_analyses if a.discordance_detectee)
    nombre_critiques = sum(1 for a in all_analyses if a.criticite == CriticiteType.CRITIQUE)

    return DashboardSiege(
        organisation_id=current_user.organisation_id,
        periode=f"{jours} derniers jours",
        feedbacks_total=total_global,
        taux_satisfaction_global=taux_global,
        idees_en_attente=idees_attente,
        agences_actives=len(agences),
        agences=sorted(kpis, key=lambda x: -x.taux_satisfaction),
        tendances=tendances,
        themes_globaux=themes_globaux,
        sentiments_globaux=sentiments_globaux,
        nombre_discordances=nombre_discordances,
        nombre_critiques=nombre_critiques,
    )


def _compute_tendances(feedbacks: list, jours: int) -> list[TendanceSatisfaction]:
    """Calcule les tendances de satisfaction par semaine ou par jour."""
    from collections import defaultdict
    bucket: dict[str, list] = defaultdict(list)

    for f in feedbacks:
        if jours <= 30:
            key = f.date_soumission.strftime("%Y-%m-%d")
        else:
            # Regrouper par semaine
            key = f"Semaine {f.date_soumission.isocalendar()[1]}"
        bucket[key].append(f.note)

    return [
        TendanceSatisfaction(
            date=date,
            taux=round(sum(1 for n in notes if n >= 4) / len(notes) * 100, 1),
            nombre_feedbacks=len(notes),
        )
        for date, notes in sorted(bucket.items())
    ]
