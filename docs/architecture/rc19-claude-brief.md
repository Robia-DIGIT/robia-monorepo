# RC19 — Brief d'implémentation pour Claude

## Objectif

Transformer les signaux Meta RC18 en contexte produit et recommandations ROBIA, sans modifier `seo_score_v2`, sans publication automatique et sans dupliquer la logique d'intégration Meta déjà présente dans `Robia-Back`.

## Règles de gouvernance

- Backend canonique : `Robia-DIGIT/Robia-Back`.
- Frontend canonique : `Robia-DIGIT/robia-monorepo/apps/app-robia`.
- Ne pas modifier `apps/backend` ni `apps/ai-engine` du monorepo : copies historiques.
- Aucun merge dans `main` sans autorisation explicite Romeo/Landry.
- Aucun déploiement sans autorisation explicite Romeo/Landry.
- Ne jamais committer de secret Meta.
- Ne demander aucune permission de publication dans RC19.
- Ne pas ajouter `pages_manage_posts`, `instagram_content_publish` ou permission d'écriture équivalente.
- Meta reste `readOnly: true` et `scoreInfluence: false`.
- Toute future écriture devra passer par le workflow humain RC14.

## État de départ

RC18 est fusionné dans `main` côté backend et frontend mais n'est pas encore configuré/déployé en production. Le backend expose :

- `GET /integrations/meta/authorize`
- `GET /integrations/meta/callback`
- `GET /integrations/meta/status`
- `GET /integrations/meta/assets`
- `POST /integrations/meta/assets/select`
- `GET /integrations/meta/performance`
- `DELETE /integrations/meta`

Le frontend possède `/meta-data` avec connexion, sélection de Page, métriques Facebook/Instagram, médias récents et déconnexion.

## Mission RC19

Construire une couche de lecture/interprétation des signaux sociaux existants afin que ROBIA puisse expliquer ce qu'il observe et proposer des opportunités, sans transformer les métriques Meta en score SEO.

### 1. Modèle de signaux

Créer des signaux déterministes et explicables à partir des données réellement disponibles. Exemples autorisés :

- `META_PAGE_NOT_SELECTED`
- `META_INSTAGRAM_NOT_LINKED`
- `META_NO_RECENT_MEDIA`
- `META_LOW_RECENT_ACTIVITY`
- `META_PROFILE_DATA_INCOMPLETE`

Ne pas créer de seuil arbitraire présenté comme vérité métier. Si un seuil est utilisé, le documenter, le rendre testable et le présenter comme heuristique.

### 2. Données manquantes

- Une valeur absente reste `null` / `Non mesuré`.
- Ne jamais convertir une donnée absente en zéro.
- Ne jamais inventer un engagement, une audience, une croissance ou une performance.
- Une absence de compte Instagram lié peut produire un signal factuel, pas une conclusion commerciale non prouvée.

### 3. Opportunités ROBIA

Les signaux Meta peuvent alimenter des recommandations/opportunités séparées du score SEO. Chaque opportunité doit contenir au minimum :

- source = `meta` ;
- signal/règle déclenchée ;
- preuve factuelle disponible ;
- recommandation ;
- niveau de confiance ou nature heuristique si pertinent ;
- `scoreInfluence: false`.

Ne pas déduire de revenu perdu ni d'uplift sans mesure réelle.

### 4. Intégration RC14

Lorsqu'une recommandation Meta peut devenir une action :

`signal Meta → opportunité → draft action RC14 → submit → approbation humaine → exécution future autorisée → preuve`

Pour RC19, l'action peut rester un draft/checklist interne. Ne pas implémenter de publication Facebook/Instagram.

### 5. Dashboard

Faire évoluer l'expérience pour rapprocher Meta du parcours principal :

`Score → problèmes → opportunités → actions → résultats`

Conserver `/meta-data` comme écran de connexion/source, mais afficher les insights utiles dans le contexte des opportunités plutôt que comme silo analytique isolé.

### 6. Tests obligatoires

Backend :

- isolation organisationnelle ;
- signaux déterministes ;
- données nulles non transformées en zéro ;
- aucune modification de `seo_score_v2` ;
- aucune permission/action de publication ;
- aucune fuite de token.

Frontend :

- rendu d'un signal Meta ;
- rendu `Non mesuré` ;
- Page sans Instagram ;
- aucune CTA de publication ;
- indication visible `Hors score SEO`.

## Hors périmètre RC19

- publication automatique ;
- création/modification de post Meta ;
- réponses aux commentaires/messages ;
- publicité Meta Ads ;
- attribution de ventes à Meta ;
- changement du score SEO ;
- connexion Google Business Profile ;
- déploiement production.

## Livrables attendus

1. Une branche dédiée par dépôt touché.
2. Tests verts.
3. Une PR backend si le backend change.
4. Une PR frontend si le dashboard change.
5. Description PR expliquant les règles déclenchées et ce qui reste hors score.
6. Aucun merge/deploy : attendre Romeo/Landry.

## Critère de fin

RC19 est prêt pour review lorsque ROBIA peut transformer les données Meta réellement présentes en signaux explicables et opportunités utiles, tout en garantissant que Meta reste en lecture seule, hors score SEO et sans action publique automatique.
