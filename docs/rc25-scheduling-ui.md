# RC25 — Interface de planification (frontend)

Complète RC25 (moteur de planification côté `Robia-Back`, déjà déployé) côté
`app-robia` : rend les automatisations planifiées réellement utilisables par
un utilisateur non technique, sans toucher au moteur backend. Aucun
changement backend dans cette PR.

## Ce qui existait déjà, et n'a pas changé

- `Automation.nextRunAt`, `AutomationTrigger.cronExpression`,
  `AutomationTrigger.timezone` — déjà exposés par l'API RC25/RC25-hardening
  côté `Robia-Back`, jamais recalculés côté frontend.
- Le formulaire simple RC20 (`PageOpsAutomationForm`) — cette PR étend
  uniquement la section « Déclencheur », rien d'autre (étapes, conditions,
  validation d'approbation restent inchangés).

## Problème résolu

Avant cette PR, un déclenchement planifié exigeait de saisir une expression
cron brute à la main (`0 9 * * 1`), sans fuseau horaire configurable dans le
formulaire, et rien n'affichait la prochaine exécution (`nextRunAt`) ni le
fuseau de référence dans la liste ou le détail d'une automation — alors même
que le scheduler RC25 était déjà actif en production.

## Constructeur de planification (`src/lib/cron-schedule.ts`)

Module pur, sans appel réseau, qui ne fait jamais que de la génération / du
parsing / du formatage de texte — le calcul de la *vraie* prochaine
occurrence reste entièrement backend (`AutomationsService.resolveNextRunAt`
/ `cron-schedule.ts` côté `Robia-Back`), lu tel quel via
`Automation.nextRunAt`.

### Génération (`buildCronExpression`)

Trois préréglages, chacun une expression cron stricte à **5 champs**,
jamais un format à 6 champs (secondes) ni un raccourci `@daily`/`@weekly` :

| Fréquence | Expression générée |
|---|---|
| Quotidienne | `minute heure * * *` |
| Hebdomadaire | `minute heure * * jour` |
| Mensuelle | `minute heure jour-du-mois * *` |

`jour` suit la même convention que cron lui-même (0 = dimanche … 6 =
samedi). `jour-du-mois` est borné à **1–28** — jamais 29/30/31 — pour que
« le Nième jour de chaque mois » existe systématiquement, sans cas
particulier pour février ou les mois courts.

### Reconnaissance (`parseCronPreset`)

Ne reconnaît **que** les trois formes exactes ci-dessus (un entier simple
par champ — jamais une plage, une liste ou un pas). Toute expression qui ne
correspond pas exactement à l'une des trois — y compris une expression déjà
valide mais écrite à la main, ou par un outil antérieur — retourne `null`,
ce qui fait basculer l'édition en mode avancé plutôt que de la
réinterpréter (ou pire, la réécrire) silencieusement.

### Mode avancé

Toujours disponible, pour conserver l'accès aux expressions cron
existantes. Validation cliente minimale : exactement 5 champs
(`isFiveFieldCron`) — un contrôle rapide et convivial, jamais un substitut à
la validation backend (`validateTrigger()` côté `Robia-Back`), qui reste la
source de vérité finale.

### Fuseau horaire

`Intl.supportedValuesOf('timeZone')` (Node 18+/navigateurs récents) fournit
la liste, avec repli sur une courte liste statique si l'environnement ne la
supporte pas. `'UTC'` est explicitement forcé dans la liste : ce n'est pas
un nom de zone IANA canonique (`Intl.supportedValuesOf` ne renvoie que des
noms `Continent/Ville`), mais c'est la valeur par défaut du backend
(`AutomationsService.resolveTriggerTimezone()`) et le choix le plus évident
pour un utilisateur non technique.

`Intl.DateTimeFormat().resolvedOptions().timeZone` fournit le fuseau du
navigateur, utilisé comme valeur initiale — modifiable ensuite librement.

### Garantir que le fuseau courant est toujours une option (revue Codex)

`Intl.supportedValuesOf('timeZone')` est un instantané de la base IANA
canonique **de ce runtime précis** — rien ne garantit qu'elle contienne :

- le fuseau détecté du navigateur (`detectBrowserTimeZone()`) ;
- un fuseau déjà enregistré depuis un autre navigateur/OS ;
- un alias IANA que le backend accepte mais que ce runtime ne liste pas
  sous ce nom canonique.

Un `<select>` construit uniquement à partir de `listIanaTimeZones()`
pourrait donc silencieusement perdre la valeur courante au chargement — la
prochaine sauvegarde enregistrerait alors un fuseau différent sans que
l'utilisateur n'ait rien changé.

`ensureTimeZoneOption(zones, current)` (helper pur, `cron-schedule.ts`)
corrige ça : insère `current` en tête de liste s'il est absent, ne duplique
jamais s'il est déjà présent. Le formulaire ne rend **jamais** la liste de
base directement — toujours `ensureTimeZoneOption(BASE_IANA_TIME_ZONES,
timezone)`, recalculé à chaque rendu à partir de l'état React courant
(jamais une constante figée qui ignorerait la valeur courante) :

- À la création : `timezone` vaut le fuseau du navigateur détecté.
- À l'édition : `timezone` vaut `trigger.timezone` de l'automation
  chargée.
- Avec le repli statique (`Intl.supportedValuesOf` indisponible) : même
  garantie, `ensureTimeZoneOption` ne dépend pas de la source de la liste
  de base.

## Comportement du formulaire (`PageOpsAutomationForm`)

### Création

- Fréquence par défaut : Quotidienne, 09:00.
- Fuseau par défaut : celui du navigateur (`detectBrowserTimeZone()`).
- `timezone` n'est envoyé au backend **que** pour un déclenchement
  `scheduled` — jamais pour `event`/`manual` (le backend rejette
  explicitement un fuseau sur ces types).

### Édition — compatibilité avec les données existantes

Au chargement d'une automation `scheduled` existante :

1. `parseCronPreset(cronExpression)` est tenté.
2. Reconnu → la Fréquence, l'Heure, et le champ spécifique (Jour de la
   semaine / Jour du mois) affichent exactement les valeurs déjà stockées.
3. Non reconnu → la Fréquence bascule automatiquement sur *Avancée*, avec
   le texte cron original affiché **verbatim**, jamais modifié.
4. Le fuseau existant (`trigger.timezone`) est toujours préservé tel quel —
   jamais re-dérivé du navigateur une fois qu'un fuseau existe déjà.

Soumettre le formulaire **sans toucher** à la planification renvoie
exactement la même expression cron et le même fuseau qu'au chargement (pour
un préréglage reconnu, elle est régénérée par `buildCronExpression()` à
partir des valeurs affichées — un format canonique identique bit à bit tant
que l'utilisateur n'a rien changé ; pour une expression non reconnue restée
en mode avancé, c'est le texte brut original, jamais réécrit).

### Validation côté formulaire

- Heure : `<input type="time">` natif — ne peut pas représenter une heure
  invalide.
- Jour du mois : borné 1–28, contrôlé avant soumission.
- Mode avancé : rejeté si l'expression n'a pas exactement 5 champs, message
  explicite (jamais un @raccourci, jamais 6 champs).
- Toute erreur API (ex. rejet backend sur une combinaison de champs
  incohérente) est affichée telle quelle dans le bandeau d'erreur existant.
- Activer/désactiver l'automation reste un choix **explicite** et séparé
  (case à cocher « Activer cette automatisation ») — configurer une
  planification, à la création ou en édition, n'active jamais
  automatiquement l'automation.

## Visibilité opérationnelle (liste + détail)

Pour toute automation dont le trigger est `scheduled` :

- **Fréquence en langage humain** (`describeCronHuman`), ex. « Tous les
  jours à 09:30 », « Chaque mercredi à 06:00 », « Le 15 de chaque mois à
  08:00 » — ou l'expression brute préfixée si elle n'est pas un préréglage
  reconnu.
- **Fuseau horaire** affiché explicitement.
- **Prochaine exécution** (`Automation.nextRunAt`, jamais recalculée
  côté frontend) formatée en français **dans le fuseau de l'automation**
  (`Intl.DateTimeFormat('fr-FR', { timeZone })`), avec le fuseau toujours
  rappelé entre parenthèses — jamais une date nue qui laisserait croire
  qu'elle est dans le fuseau du visiteur.
- **« Non planifiée »** si `nextRunAt` est `null`.
- Dans le détail, une note explique que le scheduler ne vérifie les
  automatisations dues qu'environ une fois par minute — une exécution peut
  donc démarrer jusqu'à ~60 s après l'heure affichée. Réservée au détail
  (pas répétée sur chaque carte de la liste, pour ne pas la surcharger) —
  l'information elle-même (fréquence/fuseau/prochaine exécution) est,
  elle, présente aux deux endroits comme demandé.

Une automation `manual`/`event` n'affiche aucun de ces éléments — `nextRunAt`
n'a de sens que pour un déclenchement planifié.

### Un fuseau non reconnu ne doit jamais faire planter la page (revue Codex)

`formatInstantInTimeZone()` appelle `Intl.DateTimeFormat` avec le fuseau
reçu — un fuseau que le backend accepte, ou qu'un navigateur plus récent
connaît, peut être inconnu d'un navigateur plus ancien et lever une
`RangeError`. Corrigé : l'erreur est rattrapée, jamais laissée remonter
jusqu'à faire planter la liste ou le détail. Le repli :

- affiche l'instant en **UTC** ;
- l'indique explicitement comme un repli, et rappelle le fuseau
  initialement demandé (ex. `21/09/2026 06:00 UTC (repli : fuseau
  « Foo/Bar » non reconnu par ce navigateur)`) — jamais une heure UTC
  présentée silencieusement comme si elle correspondait au fuseau
  d'origine.

Une date ISO invalide (`nextRunAt` corrompu) est traitée de la même façon
défensive : `Date invalide`, jamais une exception. `formatNextRunAt(null,
timezone)` continue de renvoyer `« Non planifiée »`, inchangé.

`automationTriggerLabel()` (badge partagé liste/détail) utilise désormais
`describeCronHuman()` au lieu d'afficher l'expression cron brute.

## Contrat API (`src/lib/api.ts`)

Aucun changement backend dans cette PR — uniquement le frontend qui
rattrape un contrat déjà exposé :

- `AutomationTrigger.timezone: string | null` — champ ajouté (manquant
  jusqu'ici côté frontend). Non-null uniquement pour `type: 'scheduled'`,
  toujours `null` pour `event`/`manual` — reflète l'invariant appliqué
  côté backend (`AutomationsService.resolveTriggerTimezone()`, migration
  `20260917090000_automation_trigger_timezone_invariant`).
- `CreateAutomationPayload.trigger.timezone?: string` — champ ajouté,
  envoyé uniquement pour `type: 'scheduled'`.

## Fichiers créés

- `apps/app-robia/src/lib/cron-schedule.ts` (+ `.test.ts`, 38 tests)
- `docs/rc25-scheduling-ui.md`

## Fichiers modifiés

- `apps/app-robia/src/lib/api.ts` — `AutomationTrigger.timezone`,
  `CreateAutomationPayload.trigger.timezone`, `automationTriggerLabel()`
  utilise `describeCronHuman()`.
- `apps/app-robia/src/pages/PageOpsAutomationForm.tsx` (+ `.test.tsx`) —
  constructeur de planification (fréquence/heure/jour/fuseau), validation,
  compatibilité d'édition, préservation d'une expression non reconnue.
- `apps/app-robia/src/pages/PageOpsAutomations.tsx` (+ `.test.tsx`) —
  fréquence/fuseau/prochaine exécution sur la carte d'une automation
  planifiée.
- `apps/app-robia/src/pages/PageOpsAutomationDetail.tsx` (+ `.test.tsx`) —
  fréquence/fuseau/prochaine exécution + note sur la résolution du
  scheduler.

## Ce qui reste hors-scope

- RC27 (retries automatiques au niveau step) — chantier suivant, sur une
  branche séparée.
- Aucun changement au moteur de planification backend lui-même (hors
  scope explicite de cette PR).

## Corrections de revue (Codex, sur cette PR)

1. **Le fuseau courant pouvait manquer du `<select>`** — voir « Garantir
   que le fuseau courant est toujours une option » sous « Fuseau
   horaire ». Nouveau helper `ensureTimeZoneOption()`, utilisé à la place
   d'une constante globale figée.
2. **Un fuseau non reconnu par ce navigateur pouvait faire planter la
   liste/le détail** — voir « Un fuseau non reconnu ne doit jamais faire
   planter la page » sous « Visibilité opérationnelle ». Repli explicite
   sur UTC, jamais silencieux ; date ISO invalide gérée de la même façon.

## Tests exécutés

```
pnpm --filter app-robia test     → 19 fichiers, 171 tests, tous passants
                                    (38 dans cron-schedule.test.ts,
                                    20 nouveaux dans PageOpsAutomationForm,
                                    2 nouveaux dans PageOpsAutomations,
                                    4 nouveaux dans PageOpsAutomationDetail)
pnpm --filter app-robia build    → tsc -b + vite build : succès
pnpm --filter app-robia lint     → oxlint : aucune nouvelle erreur/warning
                                    (avertissements pré-existants inchangés)
docker compose
  -f docker-compose.frontend.production.yml
  config --quiet                 → configuration valide
```
