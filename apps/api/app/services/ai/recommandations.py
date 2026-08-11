"""
Génération de recommandations d'action pour l'Agency Manager (BF-17).
Approche basée sur des templates par thème et criticité.
"""
from app.models.enums import SentimentType, CriticiteType, PriorityLevel

# Templates de recommandations par thème et criticité
RECOMMANDATIONS_TEMPLATES: dict[str, dict[str, str]] = {
    "accueil": {
        "elevee": (
            "Revoir la formation à l'accueil client de l'équipe. "
            "Plusieurs retours indiquent un manque de courtoisie ou de disponibilité. "
            "Organisez un briefing hebdomadaire sur les standards de qualité d'accueil."
        ),
        "critique": (
            "URGENT — Des retours très négatifs signalent des problèmes graves d'accueil. "
            "Contactez immédiatement le responsable d'équipe et identifiez les agents concernés. "
            "Mettez en place un suivi individuel renforcé et un plan d'amélioration immédiat."
        ),
    },
    "attente": {
        "elevee": (
            "Optimisez la gestion des files d'attente. "
            "Analysez les pics d'affluence pour adapter les effectifs. "
            "Envisagez un système de prise de rendez-vous ou de tickets numérotés."
        ),
        "critique": (
            "URGENT — Les temps d'attente sont signalés comme inacceptables. "
            "Revoyez l'organisation des guichets et renforcez les effectifs aux heures de pointe. "
            "Communiquez les délais estimés aux clients en attente."
        ),
    },
    "digital": {
        "elevee": (
            "Des problèmes ont été signalés sur les outils digitaux. "
            "Vérifiez le fonctionnement des automates, du réseau Wi-Fi et de l'application mobile. "
            "Transmettez un rapport technique à l'équipe IT."
        ),
        "critique": (
            "URGENT — Des pannes ou dysfonctionnements digitaux répétés sont rapportés. "
            "Escaladez immédiatement au service IT. "
            "Mettez en place une solution de secours et informez les clients des délais de résolution."
        ),
    },
    "infrastructure": {
        "elevee": (
            "Des problèmes d'infrastructure ont été signalés (propreté, confort, accessibilité). "
            "Effectuez un audit rapide des locaux et planifiez les interventions nécessaires."
        ),
        "critique": (
            "URGENT — L'état des locaux est jugé inacceptable par plusieurs clients. "
            "Intervenez immédiatement sur les problèmes de propreté ou de sécurité signalés."
        ),
    },
    "service": {
        "elevee": (
            "La qualité du service bancaire est remise en question. "
            "Vérifiez les procédures opérationnelles et assurez-vous que les agents maîtrisent les produits. "
            "Organisez une session de formation technique."
        ),
        "critique": (
            "URGENT — Des retours très négatifs concernent la qualité du service fourni. "
            "Identifiez les cas problématiques et contactez les clients concernés pour un suivi personnalisé."
        ),
    },
    "communication": {
        "elevee": (
            "Améliorez la communication avec les clients. "
            "Assurez-vous que les agents donnent des explications claires sur les procédures et délais. "
            "Mettez à disposition des supports d'information lisibles."
        ),
        "critique": (
            "URGENT — Les clients se plaignent d'un manque d'information critique. "
            "Revoyez les processus de communication et formez les agents à mieux informer les clients."
        ),
    },
    "autre": {
        "elevee": (
            "Un retour négatif a été reçu sans thème précis identifié. "
            "Relisez le commentaire et prenez les mesures appropriées selon le contexte."
        ),
        "critique": (
            "URGENT — Un retour très négatif nécessite votre attention immédiate. "
            "Analysez le commentaire et contactez si possible le client pour comprendre et résoudre le problème."
        ),
    },
}

# Recommandation générique pour la discordance
RECOMMANDATION_DISCORDANCE = (
    "Discordance détectée : le client a attribué une note favorable mais son commentaire révèle une insatisfaction. "
    "Ce signal qualité mérite une attention particulière. "
    "Analysez le commentaire pour identifier le problème sous-jacent et prenez les mesures correctives."
)


def generer_recommandations(
    theme: str,
    criticite: CriticiteType,
    discordance: bool,
) -> list[tuple[str, PriorityLevel]]:
    """
    Génère une liste de recommandations basée sur le thème et la criticité.

    Returns:
        Liste de tuples (contenu_recommandation, priorite)
    """
    recommandations = []

    # Ne générer des recommandations que pour criticité ELEVEE ou CRITIQUE (BF-17)
    if criticite in (CriticiteType.ELEVEE, CriticiteType.CRITIQUE):
        niveau = "critique" if criticite == CriticiteType.CRITIQUE else "elevee"
        priorite = PriorityLevel.CRITICAL if criticite == CriticiteType.CRITIQUE else PriorityLevel.HIGH

        theme_key = theme if theme in RECOMMANDATIONS_TEMPLATES else "autre"
        contenu = RECOMMANDATIONS_TEMPLATES[theme_key][niveau]
        recommandations.append((contenu, priorite))

    # Recommandation supplémentaire pour les discordances
    if discordance:
        recommandations.append((RECOMMANDATION_DISCORDANCE, PriorityLevel.MEDIUM))

    return recommandations
