# Intégration mobile ROBIA — bilan et contrats

Référence backend : [Robia-DIGIT/Robia-Back, f3c7d5e](https://github.com/Robia-DIGIT/Robia-Back/tree/f3c7d5e2379d3a91b941cff3de3c88ee50666511). Inventaire au 15/09/2026, 18 contrôleurs NestJS et 84 routes déclarées. Le code contient deux routes Intelligence de plus que le premier inventaire de 82 routes.

## Parcours disponibles

- Compte : inscription (name, company, email, password), connexion, session SecureStore, profil, organisation et réinitialisation de mot de passe.
- Sites : ajout, sélection, archivage, restauration et historique par site.
- Diagnostic : audits, suivi de leur statut, scores réellement disponibles, contrôles, recommandations et opportunités des anciens audits.
- Production : sept types de documents, édition avec protection du brouillon, approbation/rejet et partage du texte.
- Actions : génération, planification à l’échelle de l’organisation, statuts, échéances, soumission, approbation/rejet, preuves d’exécution et historique ; export PDF natif.
- Établissements : recherche Google Places, création, horaires et météo lorsque des coordonnées existent.
- Mesures : propriétés Search Console/Analytics, pages Facebook, audience et vue Intelligence.
- Facturation : consultation de l’abonnement, Checkout mensuel/annuel et portail sécurisé dans le navigateur.
- Automatisations : création, nom, activation, lancement manuel, historique, approbation/rejet des exécutions.
- Contact : formulaire envoyé à /prospects uniquement à la demande de l’utilisateur.

Les écrans, types et services existants au début de cette intervention ont été conservés et complétés. Les états manquants ne sont pas remplacés par de fausses données.

## Limites nécessitant du travail serveur ou une recette réelle

1. **OAuth natif Google/Meta** : /authorize pose un cookie HttpOnly dans son client HTTP et /callback exige le même cookie dans le navigateur. Le stockage natif et le Custom Tab ne partagent pas ce cookie de manière portable. Le mobile ouvre donc l’espace web /analyse avec le même compte ; il relit /status au retour. Aucun JWT n’est placé dans une URL. Pour un parcours entièrement natif, prévoir un ticket à usage unique créé avec le Bearer mobile, consommé dans le navigateur pour poser le cookie, puis un retour robiamobile:// validé côté serveur. Les deux /authorize et les deux /callback restent pilotés par le parcours web.
2. **Automatisations planifiées/événementielles** : le module persiste les déclencheurs et expose emitEvent en interne, mais le module consulté ne branche ni ordonnanceur ni émission depuis Audits/Meta. La configuration est possible ; son exécution automatique est signalée indisponible. Le lancement manuel fonctionne via /:id/run, sauf les étapes exigeant un événement absent. Il faut brancher ces déclenchements serveur pour une automatisation autonome.
3. **Facturation** : /billing/webhook est appelé par Stripe, jamais par l’APK. Les clés, tarifs, retours et activation sont gérés côté serveur. Le mobile ne considère pas le retour du navigateur comme une preuve de paiement : il relit /billing/subscription. Recette Checkout/portail en mode test à réaliser. Fiscalité : les éventuelles taxes et immatriculations Stripe Tax restent à configurer côté serveur selon les marchés concernés.
4. **Chat** : aucun endpoint de conversation n’est présent dans les contrôleurs consultés. Le copilote mobile affiche les données du compte et propose les prochaines actions ; il ne simule pas de réponses IA.
5. **Recette appareil** : aucun appareil Android n’était connecté à adb. Export Metro/Hermes Android vérifié ; ce résultat est un bundle, pas un APK signé. Les parcours authentifiés, OAuth, PDF partagé et paiement doivent être vérifiés sur appareil avec un compte de test. Aucune inscription, mutation métier ni transaction de production n’a été exécutée durant les tests.
6. **Concurrence d’édition** : le brouillon résiste aux actualisations ; un changement distant observé est signalé. Le backend n’expose pas de version conditionnelle/ETag : une protection atomique contre deux sauvegardes simultanées nécessite son support côté serveur.

## Vérifications

- `npm run test:api` : tests HTTP isolés (pas de réseau), timeout, annulation, erreurs NestJS, absence de rejeu des mutations, PDF, contrats Meta et audits.
- `npm run typecheck` : vérification TypeScript.
- `node node_modules/eslint/bin/eslint.js app components src --max-warnings 0`.
- `node node_modules/expo/bin/cli export --platform android --output-dir .verification/android`.
- Base API : `EXPO_PUBLIC_API_URL`, défaut `https://api.robiacopilot.site`. Cette valeur est incluse dans le bundle à sa génération. Aucune clé serveur ne doit y être ajoutée.
- Les accès protégés portent `Authorization: Bearer <token>`. L’organisation est déduite par le serveur, jamais choisie dans le corps d’une requête mobile.

## Inventaire HTTP

La colonne « Entrée » indique le DTO serveur (modèle de validation) ou les paramètres d’URL. Les liens pointent vers le code exact consulté. Présence d’une route ne signifie pas validation fonctionnelle contre le serveur déployé.

### Infrastructure

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/app.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| GET | `/` | — | Infrastructure serveur |
| GET | `/health` | — | Infrastructure serveur |

### auth

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/auth/auth.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| POST | `/auth/register` | RegisterDto | auth.tsx / password.tsx / session.tsx |
| POST | `/auth/login` | LoginDto | auth.tsx / password.tsx / session.tsx |
| POST | `/auth/forgot-password` | ForgotPasswordDto | auth.tsx / password.tsx / session.tsx |
| POST | `/auth/reset-password` | ResetPasswordDto | auth.tsx / password.tsx / session.tsx |
| GET | `/auth/me` | — | auth.tsx / password.tsx / session.tsx |
| POST | `/auth/logout` | — | auth.tsx / password.tsx / session.tsx |

### users

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/users/users.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| GET | `/users/me` | — | settings.tsx / session.tsx |
| PATCH | `/users/me` | UpdateProfileDto | settings.tsx / session.tsx |

### audits

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/audits/audits.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| POST | `/audits/run` | RunAuditDto | audit.tsx / history.tsx / audit-detail.tsx / data.tsx |
| POST | `/audits/run-site` | RunSiteAuditDto | audit.tsx / history.tsx / audit-detail.tsx / data.tsx |
| GET | `/audits` | Query : website_id | audit.tsx / history.tsx / audit-detail.tsx / data.tsx |
| GET | `/audits/latest` | Query : website_id | audit.tsx / history.tsx / audit-detail.tsx / data.tsx |
| GET | `/audits/:id` | Identifiant dans le chemin | audit.tsx / history.tsx / audit-detail.tsx / data.tsx |

### billing

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/billing/billing.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| GET | `/billing/subscription` | — | billing.tsx |
| POST | `/billing/checkout-session` | CreateCheckoutSessionDto | billing.tsx |
| POST | `/billing/portal-session` | — | billing.tsx |
| POST | `/billing/webhook` | — | Stripe → serveur uniquement |

### websites

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/websites/websites.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| POST | `/websites` | CreateWebsiteDto | websites.tsx / data.tsx |
| GET | `/websites` | Query : include_archived? | websites.tsx / data.tsx |
| GET | `/websites/:id` | Identifiant dans le chemin | websites.tsx / data.tsx |
| DELETE | `/websites/:id` | Identifiant dans le chemin | websites.tsx / data.tsx |
| PATCH | `/websites/:id/restore` | Identifiant dans le chemin | websites.tsx / data.tsx |

### prospects

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/prospects/prospects.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| POST | `/prospects` | CreateProspectDto | support.tsx |

### locations

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/locations/locations.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| GET | `/locations/search-places` | Query : query (SearchPlacesDto) | locations.tsx |
| POST | `/locations` | CreateLocationDto | locations.tsx |
| GET | `/locations` | — | locations.tsx |
| GET | `/locations/:id` | Identifiant dans le chemin | locations.tsx |
| GET | `/locations/:id/weather` | Identifiant dans le chemin | locations.tsx |

### documents

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/documents/documents.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| POST | `/documents/generate` | GenerateDocumentDto | opportunity.tsx / document.tsx / data.tsx |
| GET | `/documents` | Query : opportunity_id | opportunity.tsx / document.tsx / data.tsx |
| GET | `/documents/:id` | Identifiant dans le chemin | opportunity.tsx / document.tsx / data.tsx |
| PATCH | `/documents/:id` | UpdateDocumentDto ; Identifiant dans le chemin | opportunity.tsx / document.tsx / data.tsx |

### intelligence

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/intelligence/intelligence.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| GET | `/intelligence/status` | — | intelligence.tsx |
| GET | `/intelligence/findings` | Query : auditId? | intelligence.tsx |

### opportunities

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/opportunities/opportunities.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| POST | `/opportunities/generate` | GenerateOpportunitiesDto | opportunities.tsx / opportunity.tsx / audit-detail.tsx |
| POST | `/opportunities/generate-site` | GenerateOpportunitiesDto | opportunities.tsx / opportunity.tsx / audit-detail.tsx |
| GET | `/opportunities` | Query : audit_id | opportunities.tsx / opportunity.tsx / audit-detail.tsx |
| GET | `/opportunities/:id` | Identifiant dans le chemin | opportunities.tsx / opportunity.tsx / audit-detail.tsx |
| PATCH | `/opportunities/:id/status` | UpdateOpportunityStatusDto ; Identifiant dans le chemin | opportunities.tsx / opportunity.tsx / audit-detail.tsx |

### organizations

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/organizations/organizations.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| POST | `/organizations` | CreateOrganizationDto | settings.tsx / session.tsx / audit.tsx |
| GET | `/organizations/current` | — | settings.tsx / session.tsx / audit.tsx |
| PATCH | `/organizations/current` | UpdateOrganizationDto | settings.tsx / session.tsx / audit.tsx |

### actions

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/action-items/action-execution.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| POST | `/actions/:id/submit` | Identifiant dans le chemin | action.tsx |
| POST | `/actions/:id/approve` | Identifiant dans le chemin | action.tsx |
| POST | `/actions/:id/reject` | RejectActionDto ; Identifiant dans le chemin | action.tsx |
| POST | `/actions/:id/execution-attempts` | RecordActionExecutionDto ; Identifiant dans le chemin | action.tsx |
| GET | `/actions/:id/history` | Identifiant dans le chemin | action.tsx |

### validations

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/validation-logs/validation-logs.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| POST | `/validations` | CreateValidationLogDto | document.tsx / validations.tsx |
| GET | `/validations` | — | document.tsx / validations.tsx |

### integrations/meta

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/integrations/meta.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| GET | `/integrations/meta/authorize` | — | Parcours navigateur OAuth — limite native décrite ci-dessus |
| GET | `/integrations/meta/callback` | Query : code, state, error | Parcours navigateur OAuth — limite native décrite ci-dessus |
| GET | `/integrations/meta/status` | — | integrations.tsx |
| GET | `/integrations/meta/assets` | — | integrations.tsx |
| POST | `/integrations/meta/assets/select` | SelectMetaPageDto | integrations.tsx |
| GET | `/integrations/meta/performance` | — | integrations.tsx |
| DELETE | `/integrations/meta` | — | integrations.tsx |

### actions

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/action-items/action-items.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| POST | `/actions/generate` | Query : opportunity_id | progress.tsx / action.tsx / export.ts / data.tsx |
| GET | `/actions` | Query : website_id? | progress.tsx / action.tsx / export.ts / data.tsx |
| GET | `/actions/export` | Query : website_id? | progress.tsx / action.tsx / export.ts / data.tsx |
| PATCH | `/actions/:id/status` | UpdateActionStatusDto ; Identifiant dans le chemin | progress.tsx / action.tsx / export.ts / data.tsx |
| POST | `/actions/plan` | — | progress.tsx / action.tsx / export.ts / data.tsx |
| PATCH | `/actions/:id/due-date` | UpdateDueDateDto ; Identifiant dans le chemin | progress.tsx / action.tsx / export.ts / data.tsx |

### ops/automations

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/ops-automation/automations.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| POST | `/ops/automations` | CreateAutomationDto | automations.tsx |
| GET | `/ops/automations` | — | automations.tsx |
| GET | `/ops/automations/:id` | Identifiant dans le chemin | automations.tsx |
| PATCH | `/ops/automations/:id` | UpdateAutomationDto ; Identifiant dans le chemin | automations.tsx |
| PATCH | `/ops/automations/:id/enabled` | SetAutomationEnabledDto ; Identifiant dans le chemin | automations.tsx |
| POST | `/ops/automations/:id/run` | Identifiant dans le chemin | automations.tsx |
| GET | `/ops/automations/:id/runs` | Identifiant dans le chemin | automations.tsx |
| GET | `/ops/automations/runs/:runId` | Identifiant dans le chemin | automations.tsx |
| POST | `/ops/automations/runs/:runId/approve` | ReviewAutomationRunDto ; Identifiant dans le chemin | automations.tsx |
| POST | `/ops/automations/runs/:runId/reject` | ReviewAutomationRunDto ; Identifiant dans le chemin | automations.tsx |

### integrations/google/search-console

[Contrôleur source](https://github.com/Robia-DIGIT/Robia-Back/blob/f3c7d5e2379d3a91b941cff3de3c88ee50666511/src/integrations/google-search-console.controller.ts)

| Méthode | Route | Entrée | Usage |
| --- | --- | --- | --- |
| GET | `/integrations/google/search-console/authorize` | — | Parcours navigateur OAuth — limite native décrite ci-dessus |
| GET | `/integrations/google/search-console/callback` | Query : code, state, error | Parcours navigateur OAuth — limite native décrite ci-dessus |
| GET | `/integrations/google/search-console/status` | — | integrations.tsx / reports.tsx |
| GET | `/integrations/google/search-console/sites` | — | integrations.tsx / reports.tsx |
| POST | `/integrations/google/search-console/site` | SelectSearchConsoleSiteDto | integrations.tsx / reports.tsx |
| GET | `/integrations/google/search-console/performance` | — | integrations.tsx / reports.tsx |
| GET | `/integrations/google/search-console/analytics/properties` | — | integrations.tsx / reports.tsx |
| POST | `/integrations/google/search-console/analytics/property` | SelectGoogleAnalyticsPropertyDto | integrations.tsx / reports.tsx |
| GET | `/integrations/google/search-console/analytics/performance` | — | integrations.tsx / reports.tsx |
| DELETE | `/integrations/google/search-console` | — | integrations.tsx / reports.tsx |


## Résultat des contrôles de cette intervention

- 15 tests API : réussis.
- TypeScript : aucune erreur.
- ESLint sur app, components et src : aucune erreur ni avertissement ; corrections finales audit/session revérifiées.
- Export Android Metro/Hermes : réussi (1403 modules). Aucun APK signé produit.
- GET https://api.robiacopilot.site/health : réponse status=ok, service=robia-backend.
- Aucun appareil connecté à adb : recette tactile, partage natif et parcours authentifiés non effectués.