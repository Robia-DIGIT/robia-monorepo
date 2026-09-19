# RC28 — Visibilité frontend des reprises automatiques (backend RC27)

## Périmètre

Le backend (RC27, `Robia-Back`) ajoute des reprises automatiques bornées au
niveau de chaque étape d'un run d'automatisation : une erreur transitoire
replanifie une nouvelle tentative (`AutomationStepRun.status =
'retry_scheduled'`) au lieu de faire échouer tout le run immédiatement. Le
run parent reste `'running'` (« En cours ») tant que le budget de reprise de
l'étape n'est pas épuisé.

Avant RC28, le frontend ne connaissait pas cette valeur de statut : elle
serait tombée dans le cas `default` de `stepStatusLabel()` et se serait
affichée telle quelle (`retry_scheduled`), sans aucune explication pour un
utilisateur non technique voyant un run rester « En cours » plus longtemps
que d'habitude.

RC28 ajoute uniquement la visibilité correspondante — aucun changement de
comportement d'exécution, aucune nouvelle route, aucune action utilisateur
possible sur une reprise (elle est entièrement automatique côté backend).

## Contrat API (`api.ts`)

- `AutomationStepRunStatus` gagne `'retry_scheduled'`.
- `AutomationStepRun` gagne `attemptCount: number` et
  `nextAttemptAt: string | null` — déjà renvoyés par le backend (RC27)
  mais absents des types frontend.
- `stepStatusLabel()` traite `'retry_scheduled'` explicitement (badge orange
  « Nouvelle tentative programmée ») plutôt que de le laisser tomber dans le
  `default` — conformément à la convention du dépôt de toujours faire un
  `switch` exhaustif sur un enum backend à plus de deux valeurs.

## Écran (`PageOpsAutomationRun.tsx`)

- **Icône d'étape dédiée** : une étape `retry_scheduled` affiche une icône de
  rotation (orange), distincte du cercle vide (« en file ») et du spinner
  bleu (« en cours d'exécution ») — elle n'est ni l'un ni l'autre.
- **Nombre de tentatives** : affiché à côté du badge de statut, uniquement
  quand il dépasse 1 (`attemptCount > 1`) — une étape réussie du premier
  coup n'affiche rien de plus qu'avant.
- **Note sur la prochaine tentative** : sous l'étape elle-même, quand son
  statut est `retry_scheduled`, avec l'heure de la prochaine tentative si
  connue.
- **Dernière erreur, explicitement labellisée** : `« Dernière erreur : …»`
  pour une étape en attente de reprise — jamais présentée comme l'erreur
  finale d'un échec définitif.
- **Bandeau au niveau du run** : quand une étape est `retry_scheduled` (au
  plus une à la fois, les étapes s'exécutant strictement en séquence), un
  bandeau en tête de page nomme l'étape concernée, l'heure et le numéro de
  la prochaine tentative, et précise explicitement qu'aucune action n'est
  nécessaire — pour qu'un run resté « En cours » plus longtemps que
  d'habitude ne soit jamais lu comme bloqué.

## Tests

`PageOpsAutomationRun.test.tsx` (+4 scénarios) : étape en attente de reprise
avec badge/icône/heure/bandeau, absence du bandeau hors reprise, affichage du
nombre de tentatives uniquement au-delà de 1, absence de ce compteur pour une
réussite du premier coup. 175 tests au total (frontend `app-robia`).

## Hors périmètre

- Aucune action utilisateur sur une reprise (annuler, forcer, ...) — la
  politique de reprise reste entièrement backend (RC27).
- Aucun changement sur la liste des automatisations (`PageOpsAutomations.tsx`)
  ni sur le détail d'une automatisation (`PageOpsAutomationDetail.tsx`) :
  `retry_scheduled` est un statut d'*étape*, jamais un statut de *run* — le
  badge de run existant (« En cours ») reste exact sans modification.
