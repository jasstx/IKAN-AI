# IKAN AI

**Plateforme SaaS de Feedback Client**

La voix du client, captée en agence, comprise au siège.

## 🎯 Objectif

IKAN AI permet aux organisations (banques, opérateurs mobiles, hôtels, restaurants) de recueillir les feedbacks clients via QR Code, d'analyser automatiquement ces données avec l'IA, et de piloter l'expérience client en temps réel.

## 🏗️ Architecture

Ce projet est un monorepo comprenant :

- **`apps/api`** — Backend FastAPI + Service IA (Python)
- **`apps/client`** — Page QR publique (Astro)
- **`apps/dashboard`** — Back-office web (React 18 + Vite)

## 📚 Stack Technique

### Backend (`apps/api`)
- **FastAPI** — Framework web asynchrone
- **SQLAlchemy** — ORM
- **Alembic** — Migrations de base de données
- **PostgreSQL** — Base de données relationnelle
- **JWT** — Authentification
- **Argon2** — Hashing des mots de passe
- **Module IA déterministe** — Analyse de sentiment, classification thématique, recommandations

### Client (`apps/client`)
- **Astro** — Framework SSR ultra-léger (<200KB)
- Formulaire de feedback optimisé mobile

### Dashboard (`apps/dashboard`)
- **React 18** — Framework UI
- **Vite** — Build tool
- **Recharts** — Graphiques et KPIs
- **Leaflet** — Carte interactive des agences

## 🚀 Installation

### Prérequis
- Python 3.12+
- Node.js 22+
- PostgreSQL 17+

### Configuration

1. Cloner le repository
```bash
git clone <url>
cd ikanai
```

2. Backend API
```bash
cd apps/api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

3. Client Astro
```bash
cd apps/client
npm install
```

4. Dashboard React
```bash
cd apps/dashboard
npm install
```

## 🧩 Acteurs du Système

- **Client** — Scanne le QR Code, évalue son expérience, soumet des suggestions
- **Agency Manager** — Consulte les feedbacks et recommandations de son agence
- **CX Manager** — Supervise l'expérience client à l'échelle de l'organisation
- **Administrateur** — Configure la plateforme, organisations, agences, utilisateurs

## 📊 Fonctionnalités Principales

### Collecte
- Scan QR Code → formulaire en <3 secondes
- Note d'expérience (échelle à définir)
- Commentaire libre (1000 caractères max)
- Suggestion/idée

### Analyse IA (Moteur Déterministe)
- Analyse de sentiment (positif, neutre, négatif)
- Classification thématique (accueil, attente, digital, infrastructure)
- Détection de discordance (note haute + commentaire négatif)
- Génération de recommandations d'action

### Pilotage
- Dashboard temps réel (KPIs, tendances)
- Comparaison agences
- Alertes automatiques (seuils configurables)
- Gestion des suggestions (statuts : nouveau, en cours, traité)
- Synthèses périodiques

## 🔐 Sécurité

- Isolation multi-tenant stricte (PostgreSQL)
- RBAC (Role-Based Access Control)
- JWT avec cookies HTTP-only
- Mots de passe hachés avec Argon2
- Protection CSRF
- HTTPS obligatoire

## 📱 Tunnels Publics & Scan QR Mobile

Pour tester les **QR Codes** depuis n'importe quel réseau mobile (4G/Wi-Fi externe) :
1. Créez un tunnel HTTPS avec Cloudflare Tunnel : `cloudflared tunnel --url http://localhost:4321`
2. Définissez la variable dans `apps/api/.env` : `PUBLIC_CLIENT_URL=https://<votre-tunnel>.trycloudflare.com`
3. Consulter le guide complet dans [DEPLOYMENT.md](file:///c:/Users/HentaiHeros/Orange_Projet/ikanai/DEPLOYMENT.md) pour la mise en production.

## 📅 Roadmap

- [x] Phase 1 — Structure du monorepo
- [ ] Phase 2 — Schéma de base de données
- [ ] Phase 3 — Backend FastAPI
- [ ] Phase 4 — Module IA
- [ ] Phase 5 — Client Astro
- [ ] Phase 6 — Dashboard React
- [ ] Phase 7 — Tests & déploiement
- [ ] Phase 8 — Documentation

## 📝 Licence

Propriétaire — Orange Summer Challenge / NOVAX

---

**Contact** : contact@ikanai.app
