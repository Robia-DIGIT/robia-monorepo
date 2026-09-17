import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '../components/ui'
import {
  formatOdcScore,
  getOdcProgram,
  listOdcApplications,
  listOdcOutreach,
  odcApplicationStatusLabel,
  odcProgramStatusLabel,
  queueOdcOutreach,
  sendOdcOutreach,
  skipOdcOutreach,
  type OdcApplication,
  type OdcApplicationStatus,
  type OdcOutreach,
  type OdcProgram,
} from '../lib/api'

const KANBAN_COLUMNS: OdcApplicationStatus[] = [
  'draft',
  'submitted',
  'screening',
  'incomplete',
  'in_review',
  'waitlisted',
  'accepted',
  'rejected',
  'withdrawn',
]

const SELECTABLE: OdcApplicationStatus[] = ['in_review', 'waitlisted']

function hasCv(application: OdcApplication, program: OdcProgram | null): boolean {
  const documents = application.documents ?? []
  if (!program) {
    return documents.some((document) => document.status === 'received')
  }
  const cvTypes = program.docTypes.filter(
    (type) => type.key === 'cv' || type.key === 'pitch_deck',
  )
  const targetIds = cvTypes.length > 0 ? cvTypes.map((type) => type.id) : null
  return documents.some(
    (document) =>
      document.status === 'received' &&
      (targetIds === null || targetIds.includes(document.documentTypeId)),
  )
}

export default function PageOdcProgramKanban() {
  const { id = '' } = useParams()
  const [program, setProgram] = useState<OdcProgram | null>(null)
  const [applications, setApplications] = useState<OdcApplication[]>([])
  const [outreach, setOutreach] = useState<OdcOutreach[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [nextProgram, nextApplications, nextOutreach] = await Promise.all([
        getOdcProgram(id),
        listOdcApplications(id),
        listOdcOutreach(id).catch(() => [] as OdcOutreach[]),
      ])
      setProgram(nextProgram)
      setApplications(nextApplications)
      setOutreach(nextOutreach)
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger ce programme.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const byStatus = useMemo(() => {
    const map = new Map<OdcApplicationStatus, OdcApplication[]>()
    for (const status of KANBAN_COLUMNS) map.set(status, [])
    for (const application of applications) {
      const column = map.get(application.status)
      if (column) column.push(application)
    }
    return map
  }, [applications])

  const queuedIds = useMemo(() => new Set(outreach.map((row) => row.applicationId)), [outreach])
  const nextOutreach = outreach.find((row) => row.isNext) ?? null

  const toggle = (applicationId: string) => {
    setSelected((current) =>
      current.includes(applicationId)
        ? current.filter((item) => item !== applicationId)
        : [...current, applicationId],
    )
  }

  const handleQueue = async () => {
    if (selected.length === 0) return
    setBusy(true)
    setError('')
    try {
      setOutreach(await queueOdcOutreach(id, selected))
      setSelected([])
    } catch (queueError: unknown) {
      setError(queueError instanceof Error ? queueError.message : 'Impossible de préparer les emails.')
    } finally {
      setBusy(false)
    }
  }

  const handleSend = async () => {
    if (!nextOutreach) return
    setBusy(true)
    setError('')
    try {
      await sendOdcOutreach(nextOutreach.id)
      setOutreach(await listOdcOutreach(id))
    } catch (sendError: unknown) {
      setError(sendError instanceof Error ? sendError.message : 'Envoi impossible.')
      setOutreach(await listOdcOutreach(id).catch(() => outreach))
    } finally {
      setBusy(false)
    }
  }

  const handleSkip = async () => {
    if (!nextOutreach) return
    setBusy(true)
    setError('')
    try {
      await skipOdcOutreach(nextOutreach.id)
      setOutreach(await listOdcOutreach(id))
    } catch (skipError: unknown) {
      setError(skipError instanceof Error ? skipError.message : 'Impossible d’ignorer ce dossier.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] p-6 lg:p-8">
        <Card className="p-8">
          <div className="h-8 w-72 animate-pulse rounded-lg bg-slate-100" />
        </Card>
      </div>
    )
  }

  const programStatus = program ? odcProgramStatusLabel(program.status) : null

  return (
    <div className="mx-auto max-w-[1400px] p-6 lg:p-8">
      <Link to="/odc/programmes" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-electric hover:underline">
        <ArrowLeft size={14} /> Programmes
      </Link>
      <PageHeader
        title={program?.name ?? 'Programme'}
        subtitle="Trier les CV, sélectionner, envoyer un email à la fois. L’IA ne décide pas."
        badge={programStatus ? <Badge variant={programStatus.variant}>{programStatus.label}</Badge> : undefined}
      />
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {applications.length > 0 && (
        <Card className="mb-6 overflow-hidden p-0" data-testid="odc-cv-ranking">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light px-4 py-3">
            <p className="text-sm font-semibold text-navy">Tri des dossiers (score figé d’abord)</p>
            <Button
              size="sm"
              disabled={selected.length === 0}
              loading={busy}
              onClick={() => void handleQueue()}
              data-testid="odc-queue-emails"
            >
              Préparer les emails ({selected.length})
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-bg/80 text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Sel.</th>
                  <th className="px-4 py-2 font-medium">Rang</th>
                  <th className="px-4 py-2 font-medium">Candidat</th>
                  <th className="px-4 py-2 font-medium">Score</th>
                  <th className="px-4 py-2 font-medium">CV</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Email file</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application, index) => {
                  const status = odcApplicationStatusLabel(application.status)
                  const selectable = SELECTABLE.includes(application.status) && !queuedIds.has(application.id)
                  const outreachRow = outreach.find((row) => row.applicationId === application.id)
                  return (
                    <tr key={application.id} className="border-t border-border-light">
                      <td className="px-4 py-2">
                        {selectable ? (
                          <input
                            type="checkbox"
                            checked={selected.includes(application.id)}
                            onChange={() => toggle(application.id)}
                            data-testid={`odc-select-${application.id}`}
                          />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-muted">{index + 1}</td>
                      <td className="px-4 py-2">
                        <Link to={`/odc/candidatures/${application.id}`} className="font-semibold text-navy hover:underline">
                          {application.applicant?.displayName ?? 'Candidat'}
                        </Link>
                      </td>
                      <td className="px-4 py-2">{formatOdcScore(application.finalTotal)}</td>
                      <td className="px-4 py-2">{hasCv(application, program) ? 'Oui' : 'Non'}</td>
                      <td className="px-4 py-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {outreachRow ? outreachRow.status : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {outreach.length > 0 && (
        <Card className="mb-6 p-4" data-testid="odc-outreach-queue">
          <p className="mb-3 text-sm font-semibold text-navy">Envoi un par un</p>
          {nextOutreach ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-light bg-white p-3">
              <div>
                <p className="text-sm font-semibold text-navy">{nextOutreach.applicantName}</p>
                <p className="text-[11px] text-muted">
                  Destinataire {nextOutreach.recipientMasked} · modèle {nextOutreach.templateKey}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" loading={busy} onClick={() => void handleSend()} data-testid="odc-send-next">
                  Envoyer cet email
                </Button>
                <Button size="sm" variant="outline" loading={busy} onClick={() => void handleSkip()} data-testid="odc-skip-next">
                  Passer
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">File terminée. Le kanban garde le statut de chaque dossier.</p>
          )}
          <ol className="mt-3 space-y-1 text-xs text-muted">
            {outreach.map((row) => (
              <li key={row.id}>
                {row.sortOrder}. {row.applicantName} — {row.status}
                {row.isNext ? ' (prochain)' : ''}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {!error && applications.length === 0 ? (
        <EmptyState
          icon={<span />}
          title="Aucune candidature"
          description="Les dossiers apparaîtront ici dès qu’ils seront créés pour ce programme."
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((status) => {
            const meta = odcApplicationStatusLabel(status)
            const cards = byStatus.get(status) ?? []
            return (
              <section
                key={status}
                className="w-56 shrink-0 rounded-xl border border-border-light bg-slate-bg/60 p-3"
                data-testid={`odc-column-${status}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <span className="text-[11px] text-muted">{cards.length}</span>
                </div>
                <div className="space-y-2">
                  {cards.map((application) => (
                    <Link
                      key={application.id}
                      to={`/odc/candidatures/${application.id}`}
                      className="block rounded-lg border border-border-light bg-white p-3 hover:border-teal"
                    >
                      <p className="text-sm font-semibold text-navy">
                        {application.applicant?.displayName ?? 'Candidat'}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        Score : {formatOdcScore(application.finalTotal)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
