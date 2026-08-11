"""
Schémas Pydantic pour les données du dashboard (BF-09).
"""
from pydantic import BaseModel
from typing import List
import uuid


class KPIAgence(BaseModel):
    agence_id: uuid.UUID
    agence_nom: str
    ville: str | None
    taux_satisfaction: float
    nombre_feedbacks: int
    nombre_negatifs: int
    nombre_suggestions: int
    latitude: float | None = None
    longitude: float | None = None


class TendanceSatisfaction(BaseModel):
    date: str
    taux: float
    nombre_feedbacks: int


class ThemeStats(BaseModel):
    theme: str
    count: int
    pourcentage: float


class DashboardAgence(BaseModel):
    """Vue dashboard pour un Agency Manager."""
    agence_id: uuid.UUID
    agence_nom: str
    periode: str
    taux_satisfaction: float
    nombre_feedbacks: int
    nombre_negatifs: int
    nombre_critiques: int
    nombre_suggestions: int
    tendances: List[TendanceSatisfaction]
    themes: List[ThemeStats]
    discordances: int


class SentimentStats(BaseModel):
    sentiment: str
    count: int
    pourcentage: float


class DashboardSiege(BaseModel):
    """Vue dashboard pour le CX Manager (vue siège)."""
    organisation_id: uuid.UUID
    periode: str
    feedbacks_total: int
    taux_satisfaction_global: float
    idees_en_attente: int
    agences_actives: int
    agences: List[KPIAgence]
    tendances: List[TendanceSatisfaction]
    themes_globaux: List[ThemeStats] = []
    sentiments_globaux: List[SentimentStats] = []
    nombre_discordances: int = 0
    nombre_critiques: int = 0
