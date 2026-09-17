import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

import { Button, Card, Input } from '../components/ui'
import {
  AUTOMATION_ACTION_TYPES,
  createAutomation,
  getAutomation,
  updateAutomation,
  type AutomationStep,
  type AutomationTriggerType,
  type ConditionLeaf,
  type ConditionNode,
  type CreateAutomationPayload,
} from '../lib/api'
import {
  MAX_DAY_OF_MONTH,
  MIN_DAY_OF_MONTH,
  WEEKDAY_OPTIONS,
  buildCronExpression,
  detectBrowserTimeZone,
  ensureTimeZoneOption,
  isFiveFieldCron,
  listIanaTimeZones,
  parseCronPreset,
  type ScheduleFrequency,
} from '../lib/cron-schedule'

// RC-20: "formulaire simple", pas un éditeur visuel — cette liste couvre
// exactement les champs allowlistés par condition-engine.ts côté backend
// (qui reste la seule source de vérité ; le backend revalide tout).
const CONDITION_FIELDS: Array<{ field: string; label: string; type: 'number' | 'string' }> = [
  { field: 'audit.ageDays', label: 'Âge du dernier audit (jours)', type: 'number' },
  { field: 'audit.status', label: 'Statut du dernier audit', type: 'string' },
  { field: 'audit.globalScore', label: 'Score global du dernier audit', type: 'number' },
  { field: 'integration.googleSearchConsole.status', label: 'Statut Google Search Console', type: 'string' },
  { field: 'integration.meta.status', label: 'Statut Meta', type: 'string' },
  { field: 'opportunity.count', label: "Nombre d'opportunités ouvertes", type: 'number' },
  { field: 'opportunity.highPriorityCount', label: 'Opportunités à impact élevé', type: 'number' },
  { field: 'website.count', label: 'Nombre de sites connectés', type: 'number' },
]

const OPERATORS_BY_TYPE: Record<'number' | 'string', Array<{ op: string; label: string }>> = {
  number: [
    { op: 'eq', label: '= égal à' },
    { op: 'ne', label: '≠ différent de' },
    { op: 'gt', label: '> supérieur à' },
    { op: 'gte', label: '≥ supérieur ou égal à' },
    { op: 'lt', label: '< inférieur à' },
    { op: 'lte', label: '≤ inférieur ou égal à' },
    { op: 'exists', label: 'est renseigné' },
    { op: 'notExists', label: "n'est pas renseigné" },
  ],
  string: [
    { op: 'eq', label: '= égal à' },
    { op: 'ne', label: '≠ différent de' },
    { op: 'exists', label: 'est renseigné' },
    { op: 'notExists', label: "n'est pas renseigné" },
  ],
}

function isSimpleLeaf(node: ConditionNode | null | undefined): node is ConditionLeaf {
  return !!node && typeof (node as ConditionLeaf).field === 'string'
}

interface StepFormValue {
  actionType: string
  inputText: string
}

function stepsToFormValues(steps: AutomationStep[]): StepFormValue[] {
  if (steps.length === 0) {
    return [{ actionType: AUTOMATION_ACTION_TYPES[0].type, inputText: '' }]
  }
  return steps.map((step) => ({
    actionType: step.actionType,
    inputText: step.input ? JSON.stringify(step.input, null, 2) : '',
  }))
}

// The form's own schedule "mode" — a superset of ScheduleFrequency (which
// only covers the three generated presets) with 'advanced' added for the
// raw-cron fallback.
type ScheduleMode = ScheduleFrequency | 'advanced'

// Base list only — never rendered as-is. The runtime's own canonical IANA
// database (or its static fallback) doesn't change during the page's
// lifetime, so computing it once here is safe; what's rendered is always
// ensureTimeZoneOption(BASE_IANA_TIME_ZONES, <the live current value>),
// computed fresh from state on every render (see the timezone <select>
// below) — never this constant directly, which on its own can't guarantee
// the current create-time browser zone or an existing automation's own
// timezone is actually present (Codex review fix).
const BASE_IANA_TIME_ZONES = listIanaTimeZones()

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function timeToInputValue(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`
}

function parseTimeInputValue(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

export default function PageOpsAutomationForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>('manual')
  const [eventType, setEventType] = useState('')

  // RC-25 frontend scheduling UI — only meaningful while triggerType ===
  // 'scheduled'. 'advanced' keeps raw cron-expression access for anything
  // the three presets can't (or shouldn't silently try to) represent.
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('daily')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [scheduleWeekday, setScheduleWeekday] = useState(1) // Lundi
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState(1)
  const [advancedCron, setAdvancedCron] = useState('')
  const [timezone, setTimezone] = useState<string>(() => detectBrowserTimeZone())

  const [requiresApproval, setRequiresApproval] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [steps, setSteps] = useState<StepFormValue[]>(stepsToFormValues([]))

  const [conditionEnabled, setConditionEnabled] = useState(false)
  const [conditionField, setConditionField] = useState(CONDITION_FIELDS[0].field)
  const [conditionOperator, setConditionOperator] = useState('gt')
  const [conditionValue, setConditionValue] = useState('')
  const [complexConditions, setComplexConditions] = useState<ConditionNode | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    getAutomation(id)
      .then((automation) => {
        setName(automation.name)
        setDescription(automation.description ?? '')
        setTriggerType(automation.trigger.type)
        setEventType(automation.trigger.eventType ?? '')

        if (automation.trigger.type === 'scheduled') {
          // Never silently rewritten: an existing cron this UI can't
          // recognize as one of its own three presets opens the advanced
          // editor with the exact original text, untouched.
          const cron = automation.trigger.cronExpression ?? ''
          const parsed = parseCronPreset(cron)
          if (parsed) {
            setScheduleMode(parsed.frequency)
            setScheduleTime(timeToInputValue(parsed.hour, parsed.minute))
            if (parsed.frequency === 'weekly' && parsed.weekday !== undefined) {
              setScheduleWeekday(parsed.weekday)
            }
            if (parsed.frequency === 'monthly' && parsed.dayOfMonth !== undefined) {
              setScheduleDayOfMonth(parsed.dayOfMonth)
            }
          } else {
            setScheduleMode('advanced')
            setAdvancedCron(cron)
          }
          // Preserve the existing timezone exactly — never re-derived from
          // the browser once a scheduled trigger already has one.
          setTimezone(automation.trigger.timezone ?? 'UTC')
        }

        setRequiresApproval(automation.requiresApproval)
        setEnabled(automation.enabled)
        setSteps(stepsToFormValues(automation.steps))
        if (isSimpleLeaf(automation.conditions)) {
          setConditionEnabled(true)
          setConditionField(automation.conditions.field)
          setConditionOperator(automation.conditions.operator)
          setConditionValue(
            automation.conditions.value === undefined ? '' : String(automation.conditions.value),
          )
        } else if (automation.conditions) {
          setComplexConditions(automation.conditions)
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Impossible de charger cette automatisation.')
      })
      .finally(() => setLoading(false))
  }, [id])

  const selectedFieldType = CONDITION_FIELDS.find((f) => f.field === conditionField)?.type ?? 'string'

  const handleAddStep = () => {
    setSteps((current) => [...current, { actionType: AUTOMATION_ACTION_TYPES[0].type, inputText: '' }])
  }

  const handleRemoveStep = (index: number) => {
    setSteps((current) => current.filter((_, i) => i !== index))
  }

  const handleStepChange = (index: number, patch: Partial<StepFormValue>) => {
    setSteps((current) => current.map((step, i) => (i === index ? { ...step, ...patch } : step)))
  }

  // Resolves the schedule builder's current state into a strict 5-field
  // cron expression, or sets a user-facing error and returns null. Kept
  // separate from buildPayload() so the same validation the submit path
  // uses is trivially unit-testable in isolation if needed.
  const resolveScheduleCron = (): string | null => {
    if (scheduleMode === 'advanced') {
      const trimmed = advancedCron.trim()
      if (!trimmed) {
        setError('Une expression cron est requise pour un déclenchement planifié.')
        return null
      }
      if (!isFiveFieldCron(trimmed)) {
        setError(
          "L'expression cron avancée doit comporter exactement 5 champs (minute heure jour-du-mois mois jour-de-semaine) — les raccourcis (@daily, ...) et le format à 6 champs (avec secondes) ne sont pas acceptés.",
        )
        return null
      }
      return trimmed
    }

    const parsedTime = parseTimeInputValue(scheduleTime)
    if (!parsedTime) {
      setError('Renseignez une heure valide pour la planification.')
      return null
    }
    if (scheduleMode === 'monthly' && (scheduleDayOfMonth < MIN_DAY_OF_MONTH || scheduleDayOfMonth > MAX_DAY_OF_MONTH)) {
      setError(`Le jour du mois doit être compris entre ${MIN_DAY_OF_MONTH} et ${MAX_DAY_OF_MONTH}.`)
      return null
    }
    return buildCronExpression(scheduleMode, {
      hour: parsedTime.hour,
      minute: parsedTime.minute,
      weekday: scheduleWeekday,
      dayOfMonth: scheduleDayOfMonth,
    })
  }

  const buildPayload = (): CreateAutomationPayload | null => {
    if (!name.trim()) {
      setError('Le nom est obligatoire.')
      return null
    }
    let resolvedCron: string | undefined
    if (triggerType === 'scheduled') {
      const cron = resolveScheduleCron()
      if (!cron) return null
      resolvedCron = cron
    }
    if (triggerType === 'event' && !eventType.trim()) {
      setError("Un type d'événement est requis pour un déclenchement événementiel.")
      return null
    }
    if (steps.length === 0) {
      setError('Ajoutez au moins une étape.')
      return null
    }

    const parsedSteps: AutomationStep[] = []
    for (const step of steps) {
      let input: Record<string, unknown> | undefined
      if (step.inputText.trim()) {
        try {
          input = JSON.parse(step.inputText) as Record<string, unknown>
        } catch {
          setError(`L'entrée JSON de l'étape "${step.actionType}" est invalide.`)
          return null
        }
      }
      parsedSteps.push({ actionType: step.actionType, input })
    }

    let conditions: ConditionNode | undefined
    if (complexConditions) {
      conditions = complexConditions
    } else if (conditionEnabled) {
      const needsValue = conditionOperator !== 'exists' && conditionOperator !== 'notExists'
      if (needsValue && !conditionValue.trim()) {
        setError('Renseignez une valeur pour la condition, ou choisissez « est renseigné ».')
        return null
      }
      const value = needsValue
        ? selectedFieldType === 'number'
          ? Number(conditionValue)
          : conditionValue
        : undefined;
      conditions = {
        field: conditionField,
        operator: conditionOperator as ConditionLeaf['operator'],
        ...(value !== undefined ? { value } : {}),
      }
    }

    return {
      name: name.trim(),
      description: description.trim() || undefined,
      trigger: {
        type: triggerType,
        cronExpression: triggerType === 'scheduled' ? resolvedCron : undefined,
        // Only ever sent for a scheduled trigger — the backend's own
        // validateTrigger() rejects any timezone on event/manual.
        timezone: triggerType === 'scheduled' ? timezone : undefined,
        eventType: triggerType === 'event' ? eventType.trim() : undefined,
      },
      conditions,
      steps: parsedSteps,
      requiresApproval,
      enabled,
    }
  }

  const handleSubmit = async () => {
    setError('')
    const payload = buildPayload()
    if (!payload) return

    setSaving(true)
    try {
      const automation = isEdit && id ? await updateAutomation(id, payload) : await createAutomation(payload)
      navigate(`/ops/automations/${automation.id}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible d'enregistrer l'automatisation.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <Card className="p-8">
          <div className="h-8 w-72 bg-slate-100 rounded-lg" />
        </Card>
      </div>
    )
  }

  // Recomputed from the live `timezone` state on every render (Codex
  // review fix) — never a static, one-time list. Guarantees the currently
  // selected value (the detected browser zone on create, or an existing
  // automation's own trigger.timezone on edit) is always a selectable
  // option, even if the runtime's own canonical IANA list doesn't happen
  // to contain it.
  const timeZoneOptions = ensureTimeZoneOption(BASE_IANA_TIME_ZONES, timezone)

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto animate-slide-up">
      <Link to="/ops/automations" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy">
        <ArrowLeft size={14} /> Retour aux automatisations
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-navy">
        {isEdit ? "Modifier l'automatisation" : 'Nouvelle automatisation'}
      </h1>

      {error && (
        <div className="mb-6">
          <Card className="p-4 text-sm text-red-700 bg-red-50 border-red-200">{error}</Card>
        </div>
      )}

      <Card className="mb-5 p-5 space-y-4">
        <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Régénérer les opportunités après un audit" />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dark">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
      </Card>

      <Card className="mb-5 p-5 space-y-4">
        <h2 className="text-sm font-bold text-navy">Déclencheur</h2>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dark">Type</label>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as AutomationTriggerType)}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="manual">Manuel</option>
            <option value="scheduled">Planifié</option>
            <option value="event">Événement</option>
          </select>
        </div>
        {triggerType === 'scheduled' && (
          <div className="space-y-4 rounded-xl border border-border p-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">Fréquence</label>
              <select
                aria-label="Fréquence"
                value={scheduleMode}
                onChange={(e) => setScheduleMode(e.target.value as ScheduleMode)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
                <option value="advanced">Avancée (expression cron)</option>
              </select>
            </div>

            {scheduleMode === 'advanced' ? (
              <Input
                label="Expression cron (5 champs)"
                aria-label="Expression cron (5 champs)"
                value={advancedCron}
                onChange={(e) => setAdvancedCron(e.target.value)}
                placeholder="0 6 * * *"
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  type="time"
                  label="Heure"
                  aria-label="Heure"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
                {scheduleMode === 'weekly' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark">Jour de la semaine</label>
                    <select
                      aria-label="Jour de la semaine"
                      value={scheduleWeekday}
                      onChange={(e) => setScheduleWeekday(Number(e.target.value))}
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
                    >
                      {WEEKDAY_OPTIONS.map((w) => (
                        <option key={w.value} value={w.value}>
                          {w.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {scheduleMode === 'monthly' && (
                  <Input
                    type="number"
                    label={`Jour du mois (${MIN_DAY_OF_MONTH}–${MAX_DAY_OF_MONTH})`}
                    aria-label="Jour du mois"
                    min={MIN_DAY_OF_MONTH}
                    max={MAX_DAY_OF_MONTH}
                    value={scheduleDayOfMonth}
                    onChange={(e) => setScheduleDayOfMonth(Number(e.target.value))}
                  />
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">Fuseau horaire</label>
              <select
                aria-label="Fuseau horaire"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                {timeZoneOptions.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-muted">
                Pré-rempli avec le fuseau de votre navigateur — modifiable si l'automatisation doit suivre un autre
                fuseau que le vôtre.
              </p>
            </div>
          </div>
        )}
        {triggerType === 'event' && (
          <Input
            label="Type d'événement"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="audit.completed"
          />
        )}
      </Card>

      <Card className="mb-5 p-5 space-y-4">
        <h2 className="text-sm font-bold text-navy">Condition (optionnelle)</h2>
        {complexConditions ? (
          <div>
            <p className="mb-2 text-xs text-muted">
              Cette automatisation a une condition composée (ET/OU/NON) créée en dehors de ce formulaire simple — elle
              sera conservée telle quelle.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-slate-bg px-3 py-2 text-xs text-dark">
              {JSON.stringify(complexConditions, null, 2)}
            </pre>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setComplexConditions(null)}>
              Supprimer cette condition
            </Button>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm text-dark">
              <input type="checkbox" checked={conditionEnabled} onChange={(e) => setConditionEnabled(e.target.checked)} />
              Ajouter une condition
            </label>
            {conditionEnabled && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <select
                  value={conditionField}
                  onChange={(e) => setConditionField(e.target.value)}
                  className="rounded-xl border border-border px-3 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
                >
                  {CONDITION_FIELDS.map((f) => (
                    <option key={f.field} value={f.field}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <select
                  value={conditionOperator}
                  onChange={(e) => setConditionOperator(e.target.value)}
                  className="rounded-xl border border-border px-3 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
                >
                  {OPERATORS_BY_TYPE[selectedFieldType].map((o) => (
                    <option key={o.op} value={o.op}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {conditionOperator !== 'exists' && conditionOperator !== 'notExists' && (
                  <input
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    placeholder="Valeur"
                    className="rounded-xl border border-border px-3 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                )}
              </div>
            )}
          </>
        )}
      </Card>

      <Card className="mb-5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy">Étapes</h2>
          <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={handleAddStep}>
            Ajouter une étape
          </Button>
        </div>
        {steps.map((step, index) => (
          <div key={index} className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <select
                value={step.actionType}
                onChange={(e) => handleStepChange(index, { actionType: e.target.value })}
                className="flex-1 rounded-xl border border-border px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                {AUTOMATION_ACTION_TYPES.map((action) => (
                  <option key={action.type} value={action.type}>
                    {action.label}
                  </option>
                ))}
              </select>
              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
                  aria-label="Supprimer l'étape"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <textarea
              value={step.inputText}
              onChange={(e) => handleStepChange(index, { inputText: e.target.value })}
              placeholder='Entrée JSON optionnelle, ex. { "websiteId": "..." }'
              rows={2}
              className="w-full rounded-xl border border-border px-3 py-2 font-mono text-xs focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </div>
        ))}
      </Card>

      <Card className="mb-6 p-5 space-y-3">
        <label className="flex items-center gap-2 text-sm text-dark">
          <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} />
          Validation humaine requise avant exécution
        </label>
        <label className="flex items-center gap-2 text-sm text-dark">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Activer cette automatisation
        </label>
      </Card>

      <div className="flex gap-2">
        <Button variant="primary" loading={saving} onClick={() => void handleSubmit()}>
          {isEdit ? 'Enregistrer' : "Créer l'automatisation"}
        </Button>
        <Button variant="outline" onClick={() => navigate('/ops/automations')}>
          Annuler
        </Button>
      </div>
    </div>
  )
}
