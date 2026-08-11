"""
Point d'entrée principal de l'API IKAN AI.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine, Base
import app.models.organisation
import app.models.agence
import app.models.utilisateur
import app.models.qr_code
import app.models.feedback
import app.models.analyse_ia
import app.models.suggestion
import app.models.demande_contact
import app.models.historique_action
import app.models.system_settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Plateforme SaaS de Feedback Client — IKAN AI",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

@app.on_event("startup")
def on_startup():
    """Création automatique des tables au démarrage de l'application."""
    Base.metadata.create_all(bind=engine)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": f"{settings.API_V1_STR}/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
