# Source de vérité : backend et moteur IA

Statut : décision validée. Date : 11 septembre 2026.

## Décision

Le dépôt **[`Robia-DIGIT/Robia-Back`](https://github.com/Robia-DIGIT/Robia-Back)** est la source canonique :

- du backend NestJS ;
- du moteur IA, situé dans `python-service` ;
- des migrations Prisma ;
- de la chaîne Docker et du déploiement backend en production.

Les dossiers `apps/backend` et `apps/ai-engine` de ce monorepo (`robia-monorepo`) sont des **copies historiques, anciennes, divergentes et non utilisées par la production**.

## Pourquoi

Comparaison factuelle entre les deux copies au moment de la décision :

| Critère | `Robia-Back` | `robia-monorepo/apps/backend` + `apps/ai-engine` |
| --- | --- | --- |
| Construit par une CI | Oui (`backend-ci.yml` : lint, build, tests, images Docker, déploiement) | Non — aucun workflow ne référence ces dossiers |
| Dockerfile | Présent pour le backend et pour `python-service` | Absent pour les deux |
| Référencé par `docker-compose.production.yml` | Oui — `backend` construit depuis la racine, `ai-engine` depuis `./python-service` | Non |
| Migrations Prisma | 13, jusqu'à l'ajout du billing Stripe | 6, arrêtées avant les intégrations Google, les locations et le billing |
| Modules backend | Inclut `billing`, `integrations` (Google Search Console, GA4), `locations`, `prospects` | Ces modules sont absents |
| Dépendances moteur IA | Inclut `anthropic` et `playwright` (crawl réel, fournisseur Claude) | Absentes — le crawl et Claude ne peuvent pas fonctionner |
| Tests moteur IA | 5 fichiers de tests | Aucun |
| Backend appelé par les frontends en production | `https://api.robiacopilot.site`, construit depuis `Robia-Back` | — |

En résumé : `apps/backend` et `apps/ai-engine` correspondent à un essai de monorepo abandonné après un commit commun ancien (avant l'ajout du billing, des intégrations Google et de plusieurs migrations). Ils n'ont plus été synchronisés depuis, et rien dans la chaîne de production (CI, Docker, déploiement) ne les construit ni ne les exécute.

## Séparation frontend / backend

- **Ce monorepo (`robia-monorepo`)** contient les frontends : `apps/app-robia` (dashboard), `apps/vitrine-robia` (site vitrine), `apps/robia-mobile` (application mobile). Ces trois apps consomment l'API backend de production via `https://api.robiacopilot.site`.
- **`Robia-Back`** contient le backend NestJS, le moteur IA (`python-service`), le schéma et les migrations Prisma, et toute la chaîne de déploiement backend (Dockerfile, `docker-compose.production.yml`, scripts de déploiement).

## Où effectuer chaque catégorie de modification

| Type de changement | Dépôt |
| --- | --- |
| Correction ou évolution d'un endpoint NestJS | `Robia-Back` |
| Migration Prisma, modification du schéma de données | `Robia-Back` |
| Intégrations (Google Search Console, GA4, Google Business Profile, n8n) | `Robia-Back` |
| Billing / Stripe | `Robia-Back` |
| Moteur IA, agents, prompts, fournisseurs LLM (Groq, Claude) | `Robia-Back/python-service` |
| Dashboard (`app-robia`) | `robia-monorepo` |
| Site vitrine (`vitrine-robia`) | `robia-monorepo` |
| Application mobile (`robia-mobile`) | `robia-monorepo` |
| Documentation d'architecture du monorepo | `robia-monorepo` |

## Ce que cette décision ne couvre pas

- La suppression effective de `apps/backend` et `apps/ai-engine` : ce sont des copies historiques conservées pour l'instant, pas supprimées. Leur archivage ou leur suppression fait l'objet d'une tâche et d'une validation séparées.
- Toute migration de code, de données ou de configuration entre les deux dépôts.
- Le choix de l'hébergement ou du nom de domaine.

## Référence

Cette décision et son analyse détaillée (matrice complète module par module, migrations, dépendances, workflows CI/CD, Dockerfiles, tests, versions réellement utilisées par les frontends) ont été produites dans le cadre de la mission de coordination RC-01 entre les agents Claude et Codex sur ce projet.
