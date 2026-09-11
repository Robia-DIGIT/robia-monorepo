> ⚠️ **Copie historique non canonique — ne pas utiliser pour les développements ou déploiements de production.**
>
> Le moteur IA de production est **`python-service`** dans le dépôt séparé **[`Robia-DIGIT/Robia-Back`](https://github.com/Robia-DIGIT/Robia-Back)**. Ce dossier (`apps/ai-engine`) n'a pas de Dockerfile, n'a aucun test, et il lui manque des modules présents dans `python-service` (règles d'audit, fournisseur Claude, fabrique de fournisseurs LLM) ainsi que les dépendances `anthropic` et `playwright` — il ne peut donc pas effectuer de crawl ni utiliser Claude.
>
> Toute correction ou évolution du moteur IA doit être réalisée dans `Robia-Back/python-service`, pas ici. Détails : [`docs/architecture/source-of-truth.md`](../../docs/architecture/source-of-truth.md).

---

# ROBIA — AI Engine (copie historique)

Ce dossier contenait un premier essai de moteur IA FastAPI dans le monorepo. Il n'est plus maintenu à jour depuis la mise en place du dépôt backend séparé `Robia-Back`, qui héberge désormais la version canonique sous `python-service/`.
