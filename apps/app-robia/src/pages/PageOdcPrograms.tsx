import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ClipboardList, GraduationCap, Plus, Workflow } from 'lucide-react'

import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '../components/ui'
import {
  closeOdcProgram,
  createAutomation,
  createOdcProgram,
  listAutomations,
  listOdcPrograms,
  odcProgramStatusLabel,
  openOdcProgram,
  setAutomationEnabled,
  type Automation,
  type OdcProgram,
} from '../lib/api'
import { ODC_DEFAULT_PROGRAM, ODC_DEFAULT_PROGRAM_SLUG } from '../lib/odc-default-program'
import { ODC_FORMATION_PROGRAM, ODC_FORMATION_PROGRAM_SLUG } from '../lib/odc-formation-program'
import {
  isFormationAutomation,
  isOdcAutomation,
  odcProgramKind,
  odcProgramKindLabel,
  ODC_TASK_TEMPLATES,
  templateAlreadyInstalled,
  type OdcTaskTemplate,
} from '../lib/odc-ops'

export default function PageOdcPrograms() {
  const [searchParams] = useSearchParams()
  const vue = searchParams.get('vue') === 'formation' ? 'formation' : 'appel'
  const [programs, setPrograms] = useState<OdcProgram[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [installingKey, setInstallingKey] = useState<string | null>(null)

  const visiblePrograms = useMemo(
    () => programs.filter((program) => odcProgramKind(program) === vue),
    [programs, vue],
  )
  const odcAutomations = useMemo(() => automations.filter(isOdcAutomation), [automations])
  const visibleTemplates = useMemo(
    () => ODC_TASK_TEMPLATES.filter((template) => template.domain === vue),
    [vue],
  )

  const hasDefaultProgram = programs.some((program) => program.slug === ODC_DEFAULT_PROGRAM_SLUG)
  const hasFormationProgram = programs.some((program) => program.slug === ODC_FORMATION_PROGRAM_SLUG)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [nextPrograms, nextAutomations] = await Promise.all([
        listOdcPrograms(),
        listAutomations().catch(() => [] as Automation[]),
      ])
      setPrograms(nextPrograms)
      setAutomations(nextAutomations)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les programmes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleCreateDefault = async () => {
    setCreating(true)
    setError('')
    try {
      const payload = vue === 'formation' ? ODC_FORMATION_PROGRAM : ODC_DEFAULT_PROGRAM
      const created = await createOdcProgram(payload)
      const opened = await openOdcProgram(created.id)
      setPrograms((current) => [opened, ...current.filter((item) => item.id !== opened.id)])
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Impossible de créer le programme.',
      )
    } finally {
      setCreating(false)
    }
  }

  const handleOpen = async (id: string) => {
    setBusyId(id)
    setError('')
    try {
      const updated = await openOdcProgram(id)
      setPrograms((current) => current.map((item) => (item.id === id ? updated : item)))
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'Impossible d’ouvrir ce programme.')
    } finally {
      setBusyId(null)
    }
  }

  const handleClose = async (id: string) => {
    setBusyId(id)
    setError('')
    try {
      const updated = await closeOdcProgram(id)
      setPrograms((current) => current.map((item) => (item.id === id ? updated : item)))
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : 'Impossible de fermer ce programme.')
    } finally {
      setBusyId(null)
    }
  }

  const handleInstallTemplate = async (template: OdcTaskTemplate) => {
    setInstallingKey(template.key)
    setError('')
    try {
      const created = await createAutomation(template.payload)
      setAutomations((current) => [created, ...current])
    } catch (installError) {
      setError(
        installError instanceof Error
          ? installError.message
          : 'Impossible d’installer cette tâche répétitive.',
      )
    } finally {
      setInstallingKey(null)
    }
  }

  const handleToggleAutomation = async (id: string, enabled: boolean) => {
    setBusyId(id)
    setError('')
    try {
      const updated = await setAutomationEnabled(id, enabled)
      setAutomations((current) => current.map((item) => (item.id === id ? updated : item)))
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Impossible de modifier la tâche.')
    } finally {
      setBusyId(null)
    }
  }

  const showCreateButton =
    vue === 'formation' ? !hasFormationProgram : !hasDefaultProgram

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8">
      <PageHeader
        title={vue === 'formation' ? 'Formation ODC' : 'Candidatures ODC'}
        subtitle={
          vue === 'formation'
            ? 'Cohortes et inscriptions. L’admission en session reste humaine.'
            : 'Appels et dossiers. La décision d’acceptation reste humaine.'
        }
        actions={
          !loading && visiblePrograms.length > 0 && showCreateButton ? (
            <Button
              size="sm"
              icon={<Plus size={14} />}
              loading={creating}
              onClick={() => void handleCreateDefault()}
              data-testid="odc-create-default-program"
            >
              {vue === 'formation' ? 'Créer la cohorte formation' : 'Créer le programme ODC'}
            </Button>
          ) : null
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-3" data-testid="odc-ops-roles">
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Candidatures ODC</p>
          <p className="mt-1 text-sm font-semibold text-navy">Appels et dossiers</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            CV, pièces, scoring proposé, emails un par un. Ici on lit et on décide.
            L’IA n’accepte ni ne refuse.
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Formation ODC</p>
          <p className="mt-1 text-sm font-semibold text-navy">Cohortes et inscriptions</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Même moteur que les candidatures, métier différent : sessions, parcours,
            admission en formation. Décision humaine.
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Ops RobIA</p>
          <p className="mt-1 text-sm font-semibold text-navy">Moteur de tâches</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Automatisations répétitives (résumé, pièces, revue). Toujours un brouillon
            à valider. Jamais `decide()`.
          </p>
        </Card>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {loading ? (
        <Card className="p-8">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-100" />
        </Card>
      ) : visiblePrograms.length === 0 ? (
        <EmptyState
          icon={vue === 'formation' ? <GraduationCap size={28} /> : <ClipboardList size={28} />}
          title={vue === 'formation' ? 'Aucune cohorte' : 'Aucun programme'}
          description={
            vue === 'formation'
              ? 'Un clic crée la cohorte Orange Formation 2026 (parcours, session, CV) et l’ouvre aux inscriptions.'
              : 'Un clic crée l’appel Orange Digital Center 2026 (champs, critères, pièces) et l’ouvre aux candidatures. La décision reste humaine.'
          }
          action={
            <Button
              icon={<Plus size={14} />}
              loading={creating}
              onClick={() => void handleCreateDefault()}
              data-testid="odc-create-default-program-empty"
            >
              {vue === 'formation' ? 'Créer la cohorte formation' : 'Créer le programme ODC'}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {visiblePrograms.map((program) => {
            const status = odcProgramStatusLabel(program.status)
            const kind = odcProgramKindLabel(odcProgramKind(program))
            return (
              <Card key={program.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <Badge variant={kind.variant}>{kind.label}</Badge>
                    </div>
                    <Link
                      to={`/odc/programmes/${program.id}`}
                      className="text-sm font-semibold text-navy hover:underline"
                    >
                      {program.name}
                    </Link>
                    {program.description && (
                      <p className="mt-1 text-xs leading-relaxed text-muted">{program.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {program.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="primary"
                        loading={busyId === program.id}
                        onClick={() => void handleOpen(program.id)}
                      >
                        Ouvrir
                      </Button>
                    )}
                    {program.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={busyId === program.id}
                        onClick={() => void handleClose(program.id)}
                      >
                        Fermer
                      </Button>
                    )}
                    <Link
                      to={`/odc/programmes/${program.id}`}
                      className="inline-flex h-8 items-center text-xs font-semibold text-electric hover:underline"
                    >
                      Kanban
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="mt-8 p-5" data-testid="odc-repetitive-tasks">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Workflow size={16} className="text-navy" />
              <h2 className="text-sm font-semibold text-navy">
                {vue === 'formation' ? 'Tâches répétitives formation' : 'Tâches répétitives ODC'}
              </h2>
            </div>
            <p className="text-xs text-muted">
              Moteur Ops, scope {vue === 'formation' ? 'COHORT' : 'PROGRAM'}. Visible ici pour ne pas
              les noyer avec les automations PME. Lancer = brouillon, jamais une décision.
            </p>
          </div>
          <Link to="/ops/automations" className="text-xs font-semibold text-electric hover:underline">
            Tout voir dans Ops
          </Link>
        </div>

        <div className="space-y-2">
          {visibleTemplates.map((template) => {
            const installed = templateAlreadyInstalled(template, automations)
            return (
              <div
                key={template.key}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-light px-3 py-2"
              >
                <div>
                  <p className="text-xs font-semibold text-navy">{template.label}</p>
                  <p className="text-[11px] text-muted">{template.hint}</p>
                </div>
                {installed ? (
                  <Badge variant="teal">Installée</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={installingKey === template.key}
                    onClick={() => void handleInstallTemplate(template)}
                    data-testid={`odc-install-task-${template.key}`}
                  >
                    Installer
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {odcAutomations.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-border-light pt-3">
            {odcAutomations
              .filter((automation) =>
                vue === 'formation' ? isFormationAutomation(automation) : !isFormationAutomation(automation),
              )
              .map((automation) => (
                <li key={automation.id} className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to={`/ops/automations/${automation.id}`}
                    className="text-xs font-semibold text-navy hover:underline"
                  >
                    {automation.name}
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={busyId === automation.id}
                    onClick={() => void handleToggleAutomation(automation.id, !automation.enabled)}
                  >
                    {automation.enabled ? 'Désactiver' : 'Activer'}
                  </Button>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
