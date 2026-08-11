"""
Endpoints QR Codes — génération et gestion.
"""
import uuid
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import io

from app.api.deps import get_admin_user, get_db
from app.models.utilisateur import Utilisateur
from app.models.qr_code import QRCode
from app.models.agence import Agence
from app.core.config import settings

router = APIRouter()

CLIENT_BASE_URL = settings.PUBLIC_CLIENT_URL.rstrip("/")


@router.get("/ping")
def ping_qr_codes():
    return {"status": "pong"}


@router.get("/validate-test/{code}")
def validate_test_qr(code: str, db: Session = Depends(get_db)):
    try:
        from app.models.qr_code import QRCode
        count = db.query(QRCode).count()
        return {"code_param": code, "db_qr_count": count}
    except Exception as e:
        import traceback
        return {"error": str(e), "trace": traceback.format_exc()}


class QRCodeResponse(BaseModel):
    id: uuid.UUID
    agence_id: uuid.UUID
    code: str
    url: str
    label: str | None
    actif: bool

    model_config = {"from_attributes": True}


class QRCodeCreate(BaseModel):
    label: str | None = None


@router.post("/agences/{agence_id}", response_model=QRCodeResponse, status_code=201)
def create_qr_code(
    agence_id: UUID,
    data: QRCodeCreate,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_admin_user),
):
    """Génère un QR Code pour une agence."""
    agence = db.query(Agence).filter(Agence.id == agence_id).first()
    if not agence:
        raise HTTPException(status_code=404, detail="Agence introuvable")

    code = str(uuid.uuid4()).replace("-", "")[:16].upper()
    url = f"{CLIENT_BASE_URL}/feedback/{code}"

    qr = QRCode(
        agence_id=agence_id,
        code=code,
        url=url,
        label=data.label,
    )
    db.add(qr)
    db.commit()
    db.refresh(qr)
    return qr


@router.get("/agences/{agence_id}", response_model=List[QRCodeResponse])
def list_qr_codes(
    agence_id: UUID,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_admin_user),
):
    return db.query(QRCode).filter(QRCode.agence_id == agence_id).all()


@router.get("/{code}/validate")
def validate_qr_code(
    code: str,
    db: Session = Depends(get_db),
):
    """
    Valide un code QR et retourne les infos de l'agence.
    Endpoint public — appelé par la page Astro client.
    """
    try:
        qr = db.query(QRCode).filter(
            QRCode.code == code,
            QRCode.actif == True,
        ).first()

        if not qr:
            raise HTTPException(status_code=404, detail="QR Code invalide ou inactif")

        agence_nom = qr.agence.nom if (qr and qr.agence) else "Agence"
        ville = qr.agence.ville if (qr and qr.agence) else None

        return {
            "qr_code_id": str(qr.id),
            "agence_id": str(qr.agence_id),
            "agence_nom": agence_nom,
            "ville": ville,
            "label": qr.label,
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur validation QR code: {str(e)}")


@router.delete("/{qr_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_qr_code(
    qr_id: UUID,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_admin_user),
):
    qr = db.query(QRCode).filter(QRCode.id == qr_id).first()
    if not qr:
        raise HTTPException(status_code=404, detail="QR Code introuvable")
    db.delete(qr)
    db.commit()
