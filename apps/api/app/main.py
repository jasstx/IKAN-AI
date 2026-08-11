"""
Point d'entrée principal de l'API IKAN AI.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine, Base, SessionLocal
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
    """Création automatique des tables, migration DDL et auto-seeding si la base de prod est vide."""
    Base.metadata.create_all(bind=engine)
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS logo TEXT;"))
            conn.execute(text("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS secteur_activite VARCHAR(100) DEFAULT 'Télécommunications';"))
            conn.execute(text("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS pays_region VARCHAR(100) DEFAULT 'Tunisie / Afrique du Nord';"))
            conn.execute(text("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS email_pro VARCHAR(255);"))
            conn.execute(text("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"))
            conn.execute(text("ALTER TABLE organisations ALTER COLUMN logo TYPE TEXT;"))
            conn.execute(text("ALTER TABLE organisations ALTER COLUMN secteur DROP NOT NULL;"))
            conn.execute(text("ALTER TABLE organisations ALTER COLUMN email DROP NOT NULL;"))
            conn.execute(text("UPDATE organisations SET secteur_activite = secteur WHERE secteur_activite IS NULL AND secteur IS NOT NULL;"))
            conn.execute(text("UPDATE organisations SET email_pro = email WHERE email_pro IS NULL AND email IS NOT NULL;"))
            conn.execute(text("UPDATE organisations SET created_at = date_creation WHERE created_at IS NULL AND date_creation IS NOT NULL;"))
    except Exception as e:
        print(f"[STARTUP DB MIGRATION LOG] {e}")

    # Auto-seeding si aucun QR Code n'existe en base
    try:
        db = SessionLocal()
        from app.models.qr_code import QRCode
        count = db.query(QRCode).count()
        db.close()
        if count == 0:
            print("[STARTUP SEED] Aucune donnée détectée. Seeding automatique en cours...")
            from seed import seed_database
            seed_database()
            print("[STARTUP SEED] Seeding automatique terminé avec succès !")
    except Exception as e:
        print(f"[STARTUP SEED LOG ERROR] {e}")

# Configuration CORS (Support Render + Localhost)
origins = [
    "http://localhost:4321",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:4321",
    "http://127.0.0.1:5173",
    "https://ikanai-client.onrender.com",
    "https://ikanai-dashboard.onrender.com",
]
for o in settings.allowed_origins_list:
    if o and o not in origins:
        origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
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
