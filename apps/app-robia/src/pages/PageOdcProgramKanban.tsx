import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Alert, Badge, Card, EmptyState, PageHeader } from '../components/ui'
import {
  formatOdcScore,
  getOdcProgram,
  listOdcApplications,
  odcApplicationStatusLabel,
  odcProgramStatusLabel,
  type OdcApplication,
  type OdcApplicationStatus,
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

export default function PageOdcProgramKanban() {
  const { id = '' } = useParams()
  const [program, setProgram] = useState<OdcProgram | null>(null)
  const [applications, setApplications] = useState<OdcApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    Promise.all([getOdcProgram(id), listOdcApplications(id)])
      .then(([nextProgram, nextApplications]) => {
        if (!mounted) return
        setProgram(nextProgram)
        setApplications(nextApplications)
      })
      .catch((loadError: unknown) => {
        if (!mounted) return
        setError(loadError instanceof Error ? loadError.message : 'Impossible de charger ce programme.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
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
        subtitle="Kanban des candidatures. L’IA ne décide pas."
        badge={programStatus ? <Badge variant={programStatus.variant}>{programStatus.label}</Badge> : undefined}
      />
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
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
