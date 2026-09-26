# Intégration mobile ROBIA

Référence auditée : [Robia-Back `90669f2`](https://github.com/Robia-DIGIT/Robia-Back/tree/90669f2c23bcc0d10f584c62864f1579a1105c58). Mise à jour mobile : 25 septembre 2026. **22 contrôleurs NestJS, 129 routes HTTP déclarées.** Cet inventaire porte sur le code du dépôt, pas sur une certification du serveur déployé.

## Organisation des parcours

| Espace | Fonctionnalités |
| --- | --- |
| Accueil | Résultats du site choisi, priorités et raccourcis |
| Visibilité | Diagnostics et historique, concurrence, Search Console, Analytics, Facebook/Instagram, fiches Google, avis, performances locales, établissements, Intelligence |
| Activité | Opportunités, documents de tous les audits du site, plan d’action incluant les tâches internes, validations, automatisations et envois d’e-mails |
| Activité > Candidatures | Programmes, formulaire configurable, candidats, dossiers, fichiers, synthèses, propositions de notes, notes finales, décisions, historique et invitations |
| Profil | Profil, organisation, sites, connexions, abonnement, mot de passe et contact |

Les listes Opportunités, Documents et Plan d’action restent accessibles aux routes `/opportunities`, `/execution-pack` et `/progress`. Les quatre onglets Accueil, Visibilité, Activité et Profil utilisent le même navigateur avec pages adjacentes visibles pendant le glissement. Les candidatures sont une sous-section d’Activité. Le profil est accessible dans la barre du bas ; les en-têtes conservent leur structure sans raccourci de profil. L’application reste en portrait.

## Comportements intégrés

- Les documents sont chargés avec `website_id`, y compris ceux d’audits antérieurs, dans la limite serveur de 100 documents. Les documents d’une opportunité restent accessibles depuis son détail. L’éditeur envoie `expectedRevision` et conserve le brouillon si le serveur répond 409.
- Le plan d’action propose toute l’entreprise ou un site. Les tâches de revue de candidature et les tâches internes ne disparaissent plus derrière le filtre de site. Le PDF respecte la portée sélectionnée.
- Les établissements disposent de la recherche Places, du téléphone, de l’indication « principal », de la météo, de la suppression et de l’import CSV avec aperçu. Import : UTF-8, sept colonnes documentées dans le formulaire, 100 lignes au maximum, identifiants conservés pour la déduplication serveur.
- Les concurrents sont rattachés à un site. Leur audit, score, date et erreur éventuelle sont visibles ; un échec n’est jamais affiché comme une réussite.
- Les fiches Google peuvent être synchronisées, associées à un établissement ROBIA ou dissociées. Les avis incluent les réponses déjà publiées. Les performances présentent les totaux et le détail quotidien renvoyés par Google. Aucun bouton de publication d’avis n’est inventé.
- Les programmes permettent de définir questions, critères, coefficients, pièces attendues et formats. Le backend fige critères et types de pièces dès qu’un dossier existe ; l’éditeur respecte cette règle.
- Les dossiers prennent en charge tous les types de questions, soumission, pièces attendues, transfert/remplacement réel, téléchargement/partage, synthèse, notes proposées et finales, décision motivée, retrait et historique. Une proposition de note saisie par une personne envoie `proposedBy: reviewer`.
- L’envoi de fichier utilise un sélecteur natif, un multipart contenant uniquement `file` et `documentTypeId`, et une limite de 10 Mo. Le téléchargement authentifié vérifie le type de contenu. Aucun chemin de stockage serveur n’est construit ou transmis par le mobile.
- Les dossiers acceptés, refusés ou retirés restent en lecture seule. Une décision est possible uniquement depuis les états `in_review` et `waitlisted`. Les consignes de double revue et le seuil restent indicatifs : le serveur consulté ne les impose pas automatiquement.
- Les invitations sont préparées dans l’ordre choisi, puis envoyées une par une après confirmation explicite. Les envois ne sont jamais déclenchés à l’ouverture d’un écran.
- Les automatisations couvrent les huit actions autorisées, les déclenchements manuels, planifiés et les six événements effectivement émis. L’éditeur expose fuseau horaire, catégorie, conditions imbriquées, ordre des étapes et approbation préalable. Le backend contient désormais l’ordonnanceur et les écouteurs d’événements.
- Les boutons de vérification de dossier, résumé de complétude et tâche de revue passent par une automatisation manuelle, chemin exposé par le serveur pour ces trois opérations. Ils réutilisent une configuration compatible, sans conditions ni approbation préalable. Ils ne prennent aucune décision de candidature.
- Le suivi des e-mails affiche le statut réel, l’adresse masquée, les tentatives et l’erreur. La relance est disponible uniquement en `dead_letter` avec moins de cinq tentatives.

## Limites explicites et recette

- **OAuth Google/Meta/Business Profile** : le serveur lie l’autorisation à un cookie HttpOnly du navigateur. Le mobile ouvre l’espace web ROBIA avec le même compte, puis relit le statut. Aucun JWT n’est placé dans l’URL. Un parcours entièrement natif exige un ticket de connexion à usage unique et un retour mobile gérés côté serveur.
- **Webhooks et infrastructure** : `/billing/webhook`, `/` et `/health` ne deviennent pas des boutons métier. Les callbacks OAuth restent gérés par le serveur et le navigateur.
- **Chat et publication** : aucun contrôleur de conversation ni de publication WordPress/Content Studio n’existe dans cette révision. Le mobile ne simule pas ces services. Les approbations de documents enregistrent la validation, sans publication automatique.
- **Paramètres du programme** : les dates sont indicatives ; ouvrir/fermer utilise les commandes explicites. Le DTO serveur ne permet pas d’effacer une date ou un seuil existant avec une chaîne vide ; l’éditeur doit conserver ou modifier ces valeurs.
- **Validation sur appareil** : aucun appareil n’était connecté à `adb devices`. Le bundle Android ne remplace pas un APK signé ni une recette native. Vérifier avec un compte de test : session, fichiers PDF/JPEG/PNG/Word, partage, OAuth, calendriers, envois et facturation. Aucune mutation métier, aucun e-mail ni paiement de production n’a été exécuté pendant le développement.

## Vérification reproductible

- `npm test` : tests HTTP isolés, multipart, téléchargements, conflit de révision, règles de candidature, définition de programme, conditions et événements, import CSV, annulation du sélecteur, transitions et logo.
- `npm run typecheck` : TypeScript. Après ajout de routes, Expo doit régénérer `.expo/types/router.d.ts`.
- `node node_modules/eslint/bin/eslint.js app components src hooks tests --max-warnings 0`.
- `node node_modules/expo/bin/cli export --platform android --output-dir .expo/integration-check --no-minify`.
- Base API : `EXPO_PUBLIC_API_URL`, sinon `https://api.robiacopilot.site`. L’organisation est déterminée par le serveur via le Bearer. Les ressources sont séparées par session et rechargées au retour sur écran.

## Inventaire des routes

Les équivalents fonctionnels sont précisés : `/auth/me` et `/users/me` exposent l’identité, la restauration de session utilise `/users/me`. La route de métadonnées ODC marque uniquement une pièce attendue ; le transfert réel utilise `/documents/upload`.

### action-execution

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/action-items/action-execution.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/actions/:id/submit` | Travail → Plan d’action → Détail |
| POST | `/actions/:id/approve` | Travail → Plan d’action → Détail |
| POST | `/actions/:id/reject` | Travail → Plan d’action → Détail |
| POST | `/actions/:id/execution-attempts` | Travail → Plan d’action → Détail |
| GET | `/actions/:id/history` | Travail → Plan d’action → Détail |

### action-items

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/action-items/action-items.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/actions/generate` | Travail → Plan d’action / Opportunités |
| GET | `/actions` | Travail → Plan d’action / Opportunités |
| GET | `/actions/export` | Travail → Plan d’action / Opportunités |
| PATCH | `/actions/:id/status` | Travail → Plan d’action / Opportunités |
| POST | `/actions/plan` | Travail → Plan d’action / Opportunités |
| PATCH | `/actions/:id/due-date` | Travail → Plan d’action / Opportunités |

### app

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/app.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| GET | `/` | Infrastructure serveur |
| GET | `/health` | Infrastructure serveur |

### audits

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/audits/audits.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/audits/run` | Visibilité → Diagnostics |
| POST | `/audits/run-site` | Visibilité → Diagnostics |
| GET | `/audits` | Visibilité → Diagnostics |
| GET | `/audits/latest` | Visibilité → Diagnostics |
| GET | `/audits/:id` | Visibilité → Diagnostics |

### auth

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/auth/auth.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/auth/register` | Connexion / Mot de passe / Session |
| POST | `/auth/login` | Connexion / Mot de passe / Session |
| POST | `/auth/forgot-password` | Connexion / Mot de passe / Session |
| POST | `/auth/reset-password` | Connexion / Mot de passe / Session |
| GET | `/auth/me` | Identité ; équivalent /users/me utilisé par la session |
| POST | `/auth/logout` | Connexion / Mot de passe / Session |

### billing

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/billing/billing.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| GET | `/billing/subscription` | Entreprise → Abonnement |
| POST | `/billing/checkout-session` | Entreprise → Abonnement |
| POST | `/billing/portal-session` | Entreprise → Abonnement |
| POST | `/billing/webhook` | Stripe → serveur uniquement |

### competitors

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/competitors/competitors.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/competitors` | Visibilité → Concurrents |
| GET | `/competitors` | Visibilité → Concurrents |
| POST | `/competitors/:id/run` | Visibilité → Concurrents |
| DELETE | `/competitors/:id` | Visibilité → Concurrents |

### documents

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/documents/documents.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/documents/generate` | Travail → Documents / Opportunités |
| GET | `/documents` | Travail → Documents / Opportunités |
| GET | `/documents/:id` | Travail → Documents / Opportunités |
| PATCH | `/documents/:id` | Travail → Documents / Opportunités |

### google-business-profile

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/integrations/google-business-profile.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| GET | `/integrations/google/business-profile/authorize` | Connexion via le navigateur (voir limite OAuth) |
| GET | `/integrations/google/business-profile/callback` | Connexion via le navigateur (voir limite OAuth) |
| GET | `/integrations/google/business-profile/status` | Visibilité → Fiches Google et avis |
| GET | `/integrations/google/business-profile/locations` | Visibilité → Fiches Google et avis |
| POST | `/integrations/google/business-profile/sync` | Visibilité → Fiches Google et avis |
| POST | `/integrations/google/business-profile/locations/:id/link` | Visibilité → Fiches Google et avis |
| DELETE | `/integrations/google/business-profile/locations/:id/link` | Visibilité → Fiches Google et avis |
| GET | `/integrations/google/business-profile/locations/:id/reviews` | Visibilité → Fiches Google et avis |
| POST | `/integrations/google/business-profile/locations/:id/reviews/sync` | Visibilité → Fiches Google et avis |
| GET | `/integrations/google/business-profile/locations/:id/performance` | Visibilité → Fiches Google et avis |
| DELETE | `/integrations/google/business-profile` | Visibilité → Fiches Google et avis |

### google-search-console

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/integrations/google-search-console.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| GET | `/integrations/google/search-console/authorize` | Connexion via le navigateur (voir limite OAuth) |
| GET | `/integrations/google/search-console/callback` | Connexion via le navigateur (voir limite OAuth) |
| GET | `/integrations/google/search-console/status` | Entreprise → Connexions / Visibilité → Performances |
| GET | `/integrations/google/search-console/sites` | Entreprise → Connexions / Visibilité → Performances |
| POST | `/integrations/google/search-console/site` | Entreprise → Connexions / Visibilité → Performances |
| GET | `/integrations/google/search-console/performance` | Entreprise → Connexions / Visibilité → Performances |
| GET | `/integrations/google/search-console/analytics/properties` | Entreprise → Connexions / Visibilité → Performances |
| POST | `/integrations/google/search-console/analytics/property` | Entreprise → Connexions / Visibilité → Performances |
| GET | `/integrations/google/search-console/analytics/performance` | Entreprise → Connexions / Visibilité → Performances |
| DELETE | `/integrations/google/search-console` | Entreprise → Connexions / Visibilité → Performances |

### meta

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/integrations/meta.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| GET | `/integrations/meta/authorize` | Connexion via le navigateur (voir limite OAuth) |
| GET | `/integrations/meta/callback` | Connexion via le navigateur (voir limite OAuth) |
| GET | `/integrations/meta/status` | Entreprise → Connexions / Visibilité → Réseaux sociaux |
| GET | `/integrations/meta/assets` | Entreprise → Connexions / Visibilité → Réseaux sociaux |
| POST | `/integrations/meta/assets/select` | Entreprise → Connexions / Visibilité → Réseaux sociaux |
| GET | `/integrations/meta/performance` | Entreprise → Connexions / Visibilité → Réseaux sociaux |
| DELETE | `/integrations/meta` | Entreprise → Connexions / Visibilité → Réseaux sociaux |

### intelligence

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/intelligence/intelligence.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| GET | `/intelligence/status` | Visibilité → Analyse approfondie |
| GET | `/intelligence/findings` | Visibilité → Analyse approfondie |

### locations

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/locations/locations.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| GET | `/locations/search-places` | Visibilité → Mes établissements |
| POST | `/locations` | Visibilité → Mes établissements |
| POST | `/locations/legacy-import` | Visibilité → Mes établissements |
| GET | `/locations` | Visibilité → Mes établissements |
| GET | `/locations/:id` | Visibilité → Mes établissements |
| DELETE | `/locations/:id` | Visibilité → Mes établissements |
| GET | `/locations/:id/weather` | Visibilité → Mes établissements |

### notifications

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/notifications/notifications.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| GET | `/ops/notifications` | Travail → Suivi des envois |
| GET | `/ops/notifications/:id` | Travail → Suivi des envois |
| POST | `/ops/notifications/:id/retry` | Travail → Suivi des envois |

### odc

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/odc/odc.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/odc/programs` | Candidatures → Programme / Dossier / Invitations |
| GET | `/odc/programs` | Candidatures → Programme / Dossier / Invitations |
| GET | `/odc/programs/:id` | Candidatures → Programme / Dossier / Invitations |
| GET | `/odc/programs/:id/applications` | Candidatures → Programme / Dossier / Invitations |
| PATCH | `/odc/programs/:id` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/programs/:id/open` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/programs/:id/close` | Candidatures → Programme / Dossier / Invitations |
| GET | `/odc/programs/:id/outreach` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/programs/:id/outreach` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/outreach/:id/send` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/outreach/:id/skip` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/applicants` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/programs/:id/applications` | Candidatures → Programme / Dossier / Invitations |
| GET | `/odc/applications/:id` | Candidatures → Programme / Dossier / Invitations |
| GET | `/odc/applications/:id/history` | Candidatures → Programme / Dossier / Invitations |
| PATCH | `/odc/applications/:id` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/applications/:id/documents` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/applications/:id/documents/upload` | Candidatures → Programme / Dossier / Invitations |
| GET | `/odc/documents/:documentId/file` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/applications/:id/submit` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/applications/:id/propose-summary` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/applications/:id/propose-scores` | Candidatures → Programme / Dossier / Invitations |
| PATCH | `/odc/applications/:id/scores` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/applications/:id/decide` | Candidatures → Programme / Dossier / Invitations |
| POST | `/odc/applications/:id/withdraw` | Candidatures → Programme / Dossier / Invitations |

### opportunities

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/opportunities/opportunities.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/opportunities/generate` | Travail → Opportunités / Diagnostics |
| POST | `/opportunities/generate-site` | Travail → Opportunités / Diagnostics |
| GET | `/opportunities` | Travail → Opportunités / Diagnostics |
| GET | `/opportunities/:id` | Travail → Opportunités / Diagnostics |
| PATCH | `/opportunities/:id/status` | Travail → Opportunités / Diagnostics |

### automations

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/ops-automation/automations.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/ops/automations` | Travail → Automatisations / Dossier → Revue |
| GET | `/ops/automations` | Travail → Automatisations / Dossier → Revue |
| GET | `/ops/automations/:id` | Travail → Automatisations / Dossier → Revue |
| PATCH | `/ops/automations/:id` | Travail → Automatisations / Dossier → Revue |
| PATCH | `/ops/automations/:id/enabled` | Travail → Automatisations / Dossier → Revue |
| POST | `/ops/automations/:id/run` | Travail → Automatisations / Dossier → Revue |
| GET | `/ops/automations/:id/runs` | Travail → Automatisations / Dossier → Revue |
| GET | `/ops/automations/runs/:runId` | Travail → Automatisations / Dossier → Revue |
| POST | `/ops/automations/runs/:runId/approve` | Travail → Automatisations / Dossier → Revue |
| POST | `/ops/automations/runs/:runId/reject` | Travail → Automatisations / Dossier → Revue |

### organizations

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/organizations/organizations.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/organizations` | Entreprise → Paramètres |
| GET | `/organizations/current` | Entreprise → Paramètres |
| PATCH | `/organizations/current` | Entreprise → Paramètres |

### prospects

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/prospects/prospects.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/prospects` | Entreprise → Nous contacter |

### users

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/users/users.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| GET | `/users/me` | Entreprise → Paramètres / Session |
| PATCH | `/users/me` | Entreprise → Paramètres / Session |

### validation-logs

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/validation-logs/validation-logs.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/validations` | Travail → Documents / Validations |
| GET | `/validations` | Travail → Documents / Validations |

### websites

[Contrôleur audité](https://github.com/Robia-DIGIT/Robia-Back/blob/90669f2c23bcc0d10f584c62864f1579a1105c58/src/websites/websites.controller.ts)

| Méthode | Route | Parcours |
| --- | --- | --- |
| POST | `/websites` | Entreprise → Sites internet |
| GET | `/websites` | Entreprise → Sites internet |
| GET | `/websites/:id` | Entreprise → Sites internet |
| DELETE | `/websites/:id` | Entreprise → Sites internet |
| PATCH | `/websites/:id/restore` | Entreprise → Sites internet |
