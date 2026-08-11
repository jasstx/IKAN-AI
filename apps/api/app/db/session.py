"""
Configuration de la session SQLAlchemy et connexion à PostgreSQL.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings


db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
if "render.com" in db_url and "sslmode" not in db_url:
    separator = "&" if "?" in db_url else "?"
    db_url = f"{db_url}{separator}sslmode=require"

engine = create_engine(
    db_url,
    pool_pre_ping=True,           # Vérification de la connexion avant utilisation
    pool_size=10,                  # Taille du pool de connexions
    max_overflow=20,               # Connexions supplémentaires autorisées
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Classe de base pour tous les modèles SQLAlchemy."""
    pass


def get_db():
    """Dépendance FastAPI : fournit une session de base de données."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
