# ROBIA Monorepo

ROBIA est une plateforme d'audit SEO local assistée par intelligence artificielle. Ce dépôt regroupe l'ensemble des services du projet dans un monorepo afin de faciliter le développement, la collaboration et le déploiement.

## Architecture

```text
robia-monorepo/
│
├── apps/
│   ├── backend/          # API REST NestJS + Prisma
│   ├── ai-engine/        # Moteur IA FastAPI (Python)
│   └── frontend/         # Application Next.js (Vitrine , dashboard , mobile )
│
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

### Backend

```bash
cd apps/backend
cp .env.example .env
```

Configurer les variables d'environnement.

Générer Prisma Client :

```bash
npx prisma generate
```

---

### AI Engine

```bash
cd apps/ai-engine
python -m venv .venv
```

Windows

```bash
.venv\Scripts\activate
```

Linux / macOS

```bash
source .venv/bin/activate
```

Installer les dépendances :

```bash
pip install -r requirements.txt
```

Créer le fichier `.env` à partir de `.env.example`.

---

## Lancer le projet

Depuis la racine :

```bash
pnpm dev
```

Cette commande démarre automatiquement :

* Backend NestJS
* AI Engine FastAPI

Le frontend sera ajouté prochainement.

---

## Scripts utiles

### Monorepo

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
```

### Backend

```bash
pnpm --filter @robia/backend dev
pnpm --filter @robia/backend build
```

### AI Engine

```bash
cd apps/ai-engine

python -m uvicorn main:app --reload --port 8005
```

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
