# RC29b — UI ODC candidatures

Front du domaine RC29 (Back déjà sur `main` + déployé).

## Écrans
- `/odc/programmes` liste
- `/odc/programmes/:id` kanban (9 colonnes, `switch` exhaustif des statuts)
- `/odc/candidatures/:id` dossier + bandeau « décision humaine » + modal motif obligatoire

## Contrat
- Score `null` → « Non figé », jamais 0
- `decide()` seulement depuis `in_review` / `waitlisted`
- Dépend de `GET /odc/programs/:id` et `GET /odc/programs/:id/applications` (PR Back rc29.1)

PR draft. Pas de merge / deploy sans feu vert.
