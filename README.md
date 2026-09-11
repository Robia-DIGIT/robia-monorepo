# ROBIA Monorepo

ROBIA est une plateforme d'audit SEO local assistée par intelligence artificielle. Ce dépôt regroupe les frontends du projet (dashboard, vitrine, mobile) dans un monorepo afin de faciliter le développement, la collaboration et le déploiement.

## ⚠️ Source canonique du backend et du moteur IA

Le **backend NestJS** et le **moteur IA** de production ne sont **pas** dans ce monorepo. Ils vivent dans le dépôt séparé **[`Robia-DIGIT/Robia-Back`](https://github.com/Robia-DIGIT/Robia-Back)** :

- backend NestJS canonique : racine de `Robia-Back` ;
- moteur IA canonique : `Robia-Back/python-service` ;
- migrations Prisma canoniques : `Robia-Back/prisma` ;
- chaîne Docker et déploiement backend en production : `Robia-Back` (`Dockerfile`, `docker-compose.production.yml`, `deploy/`).

Ce monorepo contient `apps/backend` et `apps/ai-engine`, deux copies historiques **non construites, non déployées et non utilisées par la production**. Elles ne doivent servir à aucun développement ni déploiement — voir l'avertissement dans leur `README.md` respectif et le détail des raisons dans [`docs/architecture/source-of-truth.md`](docs/architecture/source-of-truth.md).

Toute correction backend, migration Prisma, intégration (Google, Stripe, n8n...) ou fonctionnalité IA doit être réalisée dans `Robia-Back`. Les frontends de ce monorepo consomment l'API backend en production via `https://api.robiacopilot.site`.

## Architecture

```text
robia-monorepo/
│
├── apps/
│   ├── backend/          # copie historique non canonique — voir apps/backend/README.md
│   ├── ai-engine/        # copie historique non canonique — voir apps/ai-engine/README.md
│   ├── app-robia/        # Dashboard client (React + Vite)
│   ├── vitrine-robia/    # Site vitrine (React + Vite)
│   └── robia-mobile/     # Application mobile (Expo / React Native)
│
├── docs/
│   └── architecture/     # Décisions d'architecture (source de vérité, etc.)
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## Technologies

### Backend

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL
* JWT Authentication

### AI Engine

* FastAPI
* Python
* Pydantic
* Uvicorn

### Frontend

* Next.js
* React
* TypeScript

### Outils

* pnpm Workspaces
* Turborepo
* GitHub

---

## Prérequis

Avant de commencer, installez :

* Node.js 22+
* pnpm
* Python 3.12+
* Git

---

## Installation

Cloner le dépôt :

```bash
git clone https://github.com/Robia-DIGIT/robia-monorepo.git
cd robia-monorepo
```

Installer les dépendances JavaScript :

```bash
pnpm install
```

---

## Configuration

Le backend et le moteur IA se configurent et se lancent depuis le dépôt **[`Robia-DIGIT/Robia-Back`](https://github.com/Robia-DIGIT/Robia-Back)** — voir son README. Les instructions `apps/backend` et `apps/ai-engine` historiquement présentes ici ont été retirées pour éviter qu'un contributeur ne configure ou lance la copie non canonique par erreur.

### Frontends

Chaque app frontend (`apps/app-robia`, `apps/vitrine-robia`, `apps/robia-mobile`) a son propre `README.md` et son propre `.env.example`.

---

## Lancer le projet

⚠️ `pnpm dev` (= `turbo run dev`) lance le script `dev` de **tous** les packages du workspace (`apps/*`), sans filtre. Cela inclut `apps/backend` et `apps/ai-engine`, qui ont chacun un script `dev` — pas seulement les trois apps frontend. Ne pas utiliser `pnpm dev` en pensant ne lancer que le frontend.

Pour lancer uniquement les frontends, filtrer explicitement par package :

```bash
pnpm --filter app-robia dev
pnpm --filter vitrine_robia dev
pnpm --filter robia-mobile start
```

Pour le backend et le moteur IA, suivre le README de `Robia-Back` plutôt que d'utiliser `apps/backend`/`apps/ai-engine` via `pnpm dev`.

---

## Scripts utiles

### Monorepo

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
```

### Backend et AI Engine (copies historiques non canoniques)

Les commandes `pnpm --filter @robia/backend ...` et le lancement d'`apps/ai-engine` restent techniquement possibles (ce sont toujours des workspaces valides), mais ils font tourner la copie non canonique, pas la production. Utiliser `Robia-Back` pour tout développement ou test backend/IA réel — voir l'avertissement dans `apps/backend/README.md` et `apps/ai-engine/README.md`.

---

## Workflow Git

Le projet utilise le workflow Git suivant :

```
main
│
└── develop
     ├── feature/backend-...
     ├── feature/frontend-...
     ├── feature/ai-engine-...
     └── hotfix/...
```

Les nouvelles fonctionnalités doivent être développées dans une branche `feature/*`, puis fusionnées dans `develop` via une Pull Request.

Les versions stables sont fusionnées de `develop` vers `main`.

---

## Bonnes pratiques

Ne jamais versionner :

* `.env`
* `.venv`
* `node_modules`
* `dist`
* `__pycache__`

Toujours :

* utiliser des Pull Requests ;
* maintenir `develop` stable ;
* effectuer une revue de code avant la fusion.

---

## Équipe

Projet développé par l'équipe ROBIA.

---

## Licence

Ce projet est privé. Tous droits réservés.
