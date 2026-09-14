# Audit de maturité produit ROBIA — RC10 à RC18

Date : 14 septembre 2026.

## Références de code

- Backend canonique : `Robia-DIGIT/Robia-Back`.
- Frontends : `Robia-DIGIT/robia-monorepo`.
- Backend `main` audité : `c0b609faabd095ad349f84521fc39f45a13ccc5b`.
- Frontend `main` audité : `eed568acfa5b74d88f1ef46e6106e5eb0ba369b6`.
- Cette branche `rc18/hardening-audit` ajoute seulement du hardening et de la documentation. Elle n'est pas déployée en production.

## Résumé exécutif

ROBIA dispose désormais d'une chaîne produit cohérente allant de l'audit SEO aux recommandations et à l'exécution assistée. Les briques PageSpeed, Search Console, score déterministe, observabilité, isolation multi-tenant, explications dashboard et exécution humaine RC14 sont présentes dans le code canonique. RC18 ajoute Meta/Facebook/Instagram en lecture seule, sans influence sur le score SEO et sans capacité de publication.

La principale différence entre « code prêt » et « produit totalement exploitable » vient désormais des intégrations externes : Meta doit encore être configuré et déployé avec les secrets de production ; Google Business Profile n'est pas encore connecté ; GA4 reste un signal analytique séparé du score. Le prochain objectif doit être de consolider les signaux existants dans une expérience unique `Score → problèmes → opportunités → actions → résultats`, sans mélanger métriques de visibilité et métriques d'outcome.

## Matrice RC10 → RC18

| RC | Capacité | État code | État produit / production | Point restant |
| --- | --- | --- | --- | --- |
| RC10 | PageSpeed Insights backend | Terminé | Intégration validée et clé PageSpeed provisionnée | Continuer les tests réels sur plusieurs sites |
| RC11 | PageSpeed dashboard | Terminé | UI intégrée | Consolider dans le parcours d'analyse unique |
| RC12 | Score SEO V2 + règles déterministes | Terminé | Modèle actif | Garder GSC/GA4/Meta hors score sauf décision produit explicite future |
| RC13 | Google Search Console | Terminé | OAuth et propriété ROBIA validés | Étendre les tests multi-site et erreurs OAuth |
| RC14 | Exécution assistée | Terminé | Backend et frontend déployés | Étendre progressivement les actions, toujours avec approbation humaine |
| RC15 | Observabilité | Terminé | Logs structurés / redaction intégrés | Ajouter alerting opérationnel si nécessaire |
| RC16 | Multi-tenant | Terminé | Isolation organisation renforcée | Maintenir des tests négatifs à chaque nouvelle intégration |
| RC17 | Explications score / GSC dashboard | Terminé | UI intégrée | Uniformiser les explications avec opportunités/actions |
| RC18 | Meta read-only | Fusionné dans `main` | Pas encore configuré ni déployé en production | Configurer Meta App + secrets, déployer explicitement, smoke-test OAuth et isolation |

## État fonctionnel par domaine

### Audit SEO et score

État : **opérationnel**.

Le coeur du score reste déterministe avec les catégories technique, contenu, local et performance. Les données d'outcome externes — GSC, GA4 et désormais Meta — restent séparées du calcul du score. Cette séparation doit être préservée pour éviter qu'un résultat business ou une audience sociale soit interprété comme une qualité technique SEO.

### PageSpeed

État : **opérationnel**.

L'intégration Google PageSpeed est présente côté moteur et visible dans le produit. Elle doit être considérée comme une mesure de performance technique, pas comme une source unique de vérité sur la qualité SEO globale.

### Google Search Console

État : **connecté**.

L'OAuth et la sélection de propriété ont été validés. Les données GSC servent de signal de résultat et de compréhension de la visibilité réelle. Elles ne doivent pas être rétroinjectées mécaniquement dans `seo_score_v2`.

### Google Analytics 4

État : **connecté, hors score**.

GA4 est utile pour mesurer le comportement et la conversion, mais doit rester un signal d'outcome. Une future vue unifiée peut rapprocher les événements GA4 des actions ROBIA sans prétendre à une causalité avant mesure.

### Google Business Profile

État : **non connecté**.

L'API a été activée côté projet Google, mais l'accès/quota reste un point externe à résoudre. Aucune métrique GBP ne doit être inventée ou simulée dans le produit. Le futur lot GBP devra commencer en lecture seule et respecter l'isolation organisationnelle avant toute capacité d'écriture.

### Meta / Facebook / Instagram — RC18

État : **code fusionné, configuration production en attente**.

RC18 fournit :

- OAuth Meta lié à l'organisation et à l'utilisateur ;
- chiffrement AES-256-GCM des jetons persistés ;
- lecture des Pages Facebook accessibles ;
- détection d'un compte Instagram professionnel lié ;
- lecture des métriques disponibles et de médias récents ;
- absence de permissions de publication ;
- aucun effet sur `seo_score_v2` ;
- déconnexion et statut par organisation.

Avant production : configurer l'application Meta, renseigner les secrets, appliquer la migration, déployer explicitement puis tester le parcours `connect → callback → status → assets → select → performance → disconnect`.

### Opportunités et exécution RC14

État : **opérationnel**.

Le parcours cible est :

`problème/recommandation → draft action → submit → approbation/rejet humain → tentative d'exécution assistée → preuve → éventuelle vérification → historique`

Aucune nouvelle intégration externe ne doit contourner ce modèle pour écrire ou publier automatiquement.

## Hardening RC18 ouvert dans cette branche

Cette branche ajoute deux protections avant le futur déploiement Meta :

1. tests backend dédiés à l'isolation par organisation, au binding owner OAuth et à l'absence de jetons dans les réponses d'assets ;
2. feedback utilisateur explicite pour les retours OAuth `connected`, `denied` et `error` sur le dashboard.

Ces changements doivent passer CI et revue avant toute fusion.

## Risques / points à traiter

| Priorité | Sujet | Risque | Action |
| --- | --- | --- | --- |
| P0 | Secrets Meta | Connexion impossible ou exposition si mauvaise manipulation | Configurer uniquement sur VPS / secrets autorisés, jamais dans Git |
| P0 | Migration RC18 | Backend déployé sans table Meta | Vérifier la migration Prisma pendant le déploiement |
| P0 | Isolation multi-tenant | Accès croisé entre organisations | Conserver tests négatifs et smoke tests cross-org |
| P1 | Meta App Review / accès | OAuth limité aux rôles/testeurs | Vérifier le mode de l'application et les accès requis avant ouverture utilisateurs |
| P1 | GBP | Trou majeur dans la proposition Local SEO | Résoudre quota/accès puis implémenter lecture seule |
| P1 | UX fragmentée | Sources Google/Meta perçues comme modules séparés | Unifier le dashboard autour du parcours problème → action → résultat |
| P2 | Attribution business | Risque de revendiquer un uplift non prouvé | Mesurer avant toute revendication causale |

## Séquence recommandée

1. Faire valider les PR de hardening RC18.
2. Configurer Meta App et les secrets production sur ordinateur/VPS.
3. Autoriser explicitement le déploiement RC18.
4. Exécuter le smoke test Meta complet et les cas négatifs multi-tenant.
5. Démarrer RC19 : convertir les signaux Meta en contexte/recommandations, toujours hors score et sans publication automatique.
6. Lancer le lot Google Business Profile en lecture seule.
7. Faire un test end-to-end complet de ROBIA avant bêta.

## Critère de passage bêta

ROBIA peut être considéré prêt pour une bêta contrôlée lorsque :

- l'audit et le score fonctionnent de bout en bout ;
- PageSpeed, GSC et GA4 sont stables ;
- RC14 conserve une approbation humaine avant toute action externe ;
- RC18 Meta passe les tests OAuth, isolation, données manquantes et déconnexion ;
- aucune donnée GBP ou Meta n'est simulée ;
- les déploiements production restent explicitement autorisés ;
- les parcours critiques ont un test de non-régression et un comportement d'erreur compréhensible.
