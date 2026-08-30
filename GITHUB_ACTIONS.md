# Déploiement GitHub Actions des frontends

Le workflow existant `Frontend production images` construit toujours les deux applications. Il s'exécute aussi sur les changements frontend fusionnés dans `main`. Un job séparé de déploiement dépend de la réussite du build.

## Protection de main

Le contrôle `build` s'exécute sur toutes les PR ciblant `main`, même si elles ne modifient que le mobile ou la documentation. Il peut ainsi devenir obligatoire sans rester en attente à cause d'un filtre de fichiers. Ce contrôle vérifie les builds web, pas la compilation ni les tests de l'application mobile ; ces PR consomment donc aussi un build web. Ne pas utiliser les directives de commit comme `[skip ci]` sur une PR soumise à ce contrôle obligatoire.

Dans la protection de `main`, rendre `build` obligatoire, mais pas `Deploy production over restricted SSH` : le déploiement est interdit sur les PR. Le filtrage des fichiers pour les événements `push` reste inchangé ; une modification exclusivement mobile ou documentaire ne déclenche pas de déploiement web automatique après fusion. Un lancement manuel sur `main` reste possible.

## Avant activation

1. Ajouter les secrets de dépôt `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` et `VPS_KNOWN_HOSTS`.
2. Installer le dispatcher à SHA fixé fourni par le dépôt backend : [procédure VPS](https://github.com/Robia-DIGIT/Robia-Back/blob/main/deploy/GITHUB_ACTIONS.md).
3. Garder la variable de dépôt `VPS_DEPLOY_ENABLED` absente ou à `false` jusqu'à cette installation. La présence des quatre secrets ne suffit pas à activer le déploiement.
4. Après fusion autorisée et contrôles verts, définir **la variable** `VPS_DEPLOY_ENABLED=true` dans `Settings → Secrets and variables → Actions → Variables`.
5. Lancer `Actions → Frontend production images → Run workflow`, branche `main`.

Le job transmet `deploy-frontend <GITHUB_SHA>` à la commande SSH forcée, avec vérification stricte de la clé d'hôte pré-enregistrée. Il ne s'exécute jamais sur une PR. Une brève interruption applicative est possible lors du remplacement des conteneurs.

Une fois activé, chaque push pertinent sur `main` déploie après le build CI. Le serveur refuse un SHA qui ne correspond plus au `main` récupéré : relancer le workflow sur le `main` actuel. Les fichiers React Native ne déclenchent pas de déploiement web à eux seuls.

Les deux applications restent privées sur Docker ; Caddy conserve seul les ports web publics. Le dispatcher attend des conteneurs sains et vérifie les réponses HTTPS de l'application, de la vitrine et de `www`. Aucun secret applicatif n'est ajouté au bundle Vite.

## Échec

Mettre `VPS_DEPLOY_ENABLED=false` pour suspendre les prochains déploiements (sans arrêter une exécution déjà lancée). Il n'y a pas de rollback automatique. Consulter les logs et `/srv/robia/deployments/frontend.last-successful-sha` avant toute intervention manuelle. Ne pas modifier le checkout VPS pendant un déploiement.

Protéger `main` et les workflows par revue et CI obligatoires. La clé forcée ne donne pas de shell direct, mais le code déployé garde les capacités Docker du compte VPS : les droits d'écriture sur ces dépôts doivent rester limités aux personnes de confiance.
