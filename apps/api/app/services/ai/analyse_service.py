"""
Service d'analyse IA principal — orchestre toutes les analyses pour un feedback.
Exécuté en tâche de fond après la soumission d'un feedback.
"""
import uuid
import logging
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.feedback import Feedback
from app.models.analyse_ia import AnalyseIA
from app.models.recommandation import Recommandation
from app.services.ai.sentiment import analyser_sentiment
from app.services.ai.classification import classifier_theme
from app.services.ai.criticite import calculer_criticite, detecter_discordance
from app.services.ai.recommandations import generer_recommandations

logger = logging.getLogger(__name__)


def analyser_feedback(feedback_id: uuid.UUID, db: Session | None = None) -> None:
    """
    Analyse complète d'un feedback :
    1. Analyse de sentiment (BF-06)
    2. Classification thématique (BF-07)
    3. Détection de discordance (BF-08)
    4. Calcul de criticité
    5. Génération de recommandations (BF-17)

    Peut être appelée en tâche de fond (BackgroundTask) ou directement.
    """
    # Créer une nouvelle session si non fournie (tâche de fond)
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
        if not feedback:
            logger.warning(f"Feedback {feedback_id} introuvable pour analyse")
            return

        # Ne pas analyser si déjà analysé
        existing = db.query(AnalyseIA).filter(AnalyseIA.feedback_id == feedback_id).first()
        if existing:
            logger.info(f"Feedback {feedback_id} déjà analysé")
            return

        # 1. Analyse de sentiment
        texte = feedback.commentaire or ""
        sentiment, score = analyser_sentiment(texte)

        # 2. Classification thématique
        theme = classifier_theme(texte)

        # 3. Détection de discordance
        discordance = detecter_discordance(feedback.note, sentiment)

        # 4. Criticité
        criticite = calculer_criticite(feedback.note, sentiment)

        logger.info(
            f"Feedback {feedback_id} analysé — "
            f"sentiment={sentiment.value}, theme={theme}, "
            f"criticite={criticite.value}, discordance={discordance}"
        )

        # 5. Persister l'analyse
        analyse = AnalyseIA(
            feedback_id=feedback_id,
            sentiment=sentiment,
            criticite=criticite,
            theme_principal=theme,
            discordance_detectee=discordance,
            score_sentiment=score,
        )
        db.add(analyse)
        db.flush()

        # 6. Générer les recommandations (BF-17)
        recommandations = generer_recommandations(theme, criticite, discordance)
        for contenu, priorite in recommandations:
            reco = Recommandation(
                analyse_ia_id=analyse.id,
                contenu=contenu,
                priorite=priorite,
            )
            db.add(reco)

        db.commit()
        logger.info(f"Analyse sauvegardée pour feedback {feedback_id}")

    except Exception as e:
        logger.error(f"Erreur lors de l'analyse du feedback {feedback_id}: {e}")
        db.rollback()
    finally:
        if close_db:
            db.close()
