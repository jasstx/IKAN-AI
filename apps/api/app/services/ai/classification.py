"""
Classification thématique des feedbacks (BF-07).
Approche basée sur des mots-clés par thème — configurable.
Thèmes : Accueil, Attente, Digital, Infrastructure, Service, Autre.
"""

# Dictionnaire des thèmes avec leurs mots-clés associés
THEMES: dict[str, list[str]] = {
    "accueil": [
        "accueil", "accueillir", "agent", "conseiller", "personnel", "staff",
        "sourire", "aimable", "poli", "impoli", "courtois", "sympathique",
        "serviable", "attentionné", "disponible", "renseignement", "orientation",
        "bonjour", "bienvenue", "réception",
    ],
    "attente": [
        "attente", "attendre", "file", "queue", "long", "durée", "temps",
        "minute", "heure", "retard", "rapide", "lent", "vite", "délai",
        "ticket", "numéro", "tour",
    ],
    "digital": [
        "application", "appli", "app", "site", "web", "mobile", "internet",
        "connexion", "réseau", "numérique", "digital", "technologie", "système",
        "logiciel", "interface", "écran", "tablette", "self-service",
        "distributeur", "automate", "guichet automatique", "gab",
    ],
    "infrastructure": [
        "local", "bâtiment", "salle", "espace", "place", "chaise", "siège",
        "climatisation", "clim", "chaleur", "froid", "propre", "sale",
        "toilettes", "parking", "accès", "escalier", "ascenseur",
        "guichet", "box", "bureau", "fenêtre",
    ],
    "service": [
        "virement", "compte", "carte", "crédit", "prêt", "remboursement",
        "opération", "transaction", "dossier", "document", "formulaire",
        "procédure", "démarche", "frais", "tarif", "commission",
        "depot", "retrait", "épargne", "placement",
    ],
    "communication": [
        "information", "informer", "expliquer", "explication", "clair", "clarté",
        "compréhensible", "lisible", "réponse", "rappel", "téléphone", "email",
        "contact", "joindre",
    ],
}

# Score minimum de mots-clés trouvés pour attribuer un thème
SEUIL_CLASSIFICATION = 1


def classifier_theme(texte: str) -> str:
    """
    Classifie le texte dans un thème prédéfini.

    Returns:
        Nom du thème principal, ou "autre" si aucun thème trouvé.
    """
    if not texte or len(texte.strip()) < 3:
        return "autre"

    texte_lower = texte.lower()
    scores: dict[str, int] = {}

    for theme, mots_cles in THEMES.items():
        score = 0
        for mot in mots_cles:
            if mot in texte_lower:
                score += 1
        if score >= SEUIL_CLASSIFICATION:
            scores[theme] = score

    if not scores:
        return "autre"

    # Retourner le thème avec le score le plus élevé
    return max(scores, key=lambda k: scores[k])
