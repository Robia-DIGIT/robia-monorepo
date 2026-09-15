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
  const [cronExpression, setCronExpression] = useState('')
  const [eventType, setEventType] = useState('')
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
        setCronExpression(automation.trigger.cronExpression ?? '')
        setEventType(automation.trigger.eventType ?? '')
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

  const buildPayload = (): CreateAutomationPayload | null => {
    if (!name.trim()) {
      setError('Le nom est obligatoire.')
      return null
    }
    if (triggerType === 'scheduled' && !cronExpression.trim()) {
      setError('Une expression cron est requise pour un déclenchement planifié.')
      return null
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
        cronExpression: triggerType === 'scheduled' ? cronExpression.trim() : undefined,
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
            <option value="scheduled">Planifié (préparé, pas encore exécuté automatiquement)</option>
            <option value="event">Événement</option>
          </select>
        </div>
        {triggerType === 'scheduled' && (
          <Input
            label="Expression cron"
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            placeholder="0 6 * * *"
          />
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
