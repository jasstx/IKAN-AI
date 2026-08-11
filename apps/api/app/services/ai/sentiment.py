"""
Analyse de sentiment déterministe en français.
Approche lexicale avec dictionnaire de mots-clés pondérés.
Pas de LLM externe — moteur local (BF-06).
"""
from app.models.enums import SentimentType

# Dictionnaire de mots/expressions positifs en français (contexte banque/services)
MOTS_POSITIFS = {
    # Très positifs (poids 2)
    "excellent": 2, "parfait": 2, "exceptionnel": 2, "remarquable": 2,
    "fantastique": 2, "magnifique": 2, "super": 2, "génial": 2,
    "impressionnant": 2, "formidable": 2,
    # Positifs (poids 1)
    "bien": 1, "bon": 1, "bonne": 1, "satisfait": 1, "satisfaisant": 1,
    "rapide": 1, "efficace": 1, "professionnel": 1, "agréable": 1,
    "sympathique": 1, "souriant": 1, "aimable": 1, "accueillant": 1,
    "propre": 1, "confortable": 1, "facile": 1, "pratique": 1,
    "utile": 1, "clair": 1, "compétent": 1, "attentionné": 1,
    "serviable": 1, "disponible": 1, "poli": 1, "courtois": 1,
    "merci": 1, "bravo": 1, "félicitations": 1, "continue": 1,
    "conforme": 1, "fiable": 1, "sécurisé": 1, "moderne": 1,
}

# Dictionnaire de mots/expressions négatifs
MOTS_NEGATIFS = {
    # Très négatifs (poids 2)
    "terrible": 2, "horrible": 2, "catastrophique": 2, "inacceptable": 2,
    "scandaleux": 2, "honteux": 2, "désastreux": 2, "nul": 2,
    "incompétent": 2, "inutile": 2,
    # Négatifs (poids 1)
    "mauvais": 1, "lent": 1, "lente": 1, "long": 1, "longue": 1,
    "attente": 1, "déçu": 1, "déception": 1, "mécontent": 1,
    "problème": 1, "problèmes": 1, "erreur": 1, "erreurs": 1,
    "difficile": 1, "compliqué": 1, "confus": 1, "impolie": 1,
    "impoli": 1, "désagréable": 1, "sale": 1, "bruyant": 1,
    "inconfortable": 1, "froid": 1, "froide": 1, "manque": 1,
    "absent": 1, "absent": 1, "fermer": 1, "fermé": 1,
    "retard": 1, "retards": 1, "délai": 1, "délais": 1,
    "refus": 1, "refusé": 1, "rejeté": 1, "bloqué": 1,
    "panne": 1, "bogue": 1, "bug": 1, "dysfonctionnement": 1,
    "pas": 1, "jamais": 1, "aucun": 1, "aucune": 1,
    "insatisfait": 1, "désolant": 1, "frustrant": 1, "agaçant": 1,
}

# Négations qui inversent la polarité
NEGATIONS = {"ne", "pas", "jamais", "aucun", "aucune", "ni", "non", "sans"}


def analyser_sentiment(texte: str) -> tuple[SentimentType, float]:
    """
    Analyse le sentiment d'un texte en français.

    Returns:
        (SentimentType, score) où score va de 0.0 (très négatif) à 1.0 (très positif)
    """
    if not texte or len(texte.strip()) < 3:
        return SentimentType.NEUTRE, 0.5

    # Normaliser le texte
    mots = texte.lower().split()
    mots_nettoyes = [m.strip(".,;:!?()\"'") for m in mots]

    score_positif = 0.0
    score_negatif = 0.0
    i = 0

    while i < len(mots_nettoyes):
        mot = mots_nettoyes[i]

        # Vérifier la présence d'une négation avant ce mot
        est_nie = (i > 0 and mots_nettoyes[i - 1] in NEGATIONS)

        if mot in MOTS_POSITIFS:
            poids = MOTS_POSITIFS[mot]
            if est_nie:
                score_negatif += poids
            else:
                score_positif += poids

        elif mot in MOTS_NEGATIFS:
            poids = MOTS_NEGATIFS[mot]
            if est_nie:
                score_positif += poids * 0.5  # "pas mauvais" -> légèrement positif
            else:
                score_negatif += poids

        i += 1

    total = score_positif + score_negatif

    if total == 0:
        # Aucun mot-clé trouvé — analyser la longueur et la ponctuation
        nb_exclamations = texte.count("!")
        if nb_exclamations >= 2:
            return SentimentType.POSITIF, 0.65
        return SentimentType.NEUTRE, 0.5

    # Calculer le score normalisé (0 = très négatif, 1 = très positif)
    score_normalise = score_positif / total

    if score_normalise >= 0.6:
        return SentimentType.POSITIF, round(score_normalise, 3)
    elif score_normalise <= 0.35:
        return SentimentType.NEGATIF, round(score_normalise, 3)
    else:
        return SentimentType.NEUTRE, round(score_normalise, 3)
