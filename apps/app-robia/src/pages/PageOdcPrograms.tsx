import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'

import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '../components/ui'
import {
  closeOdcProgram,
  listOdcPrograms,
  odcProgramStatusLabel,
  openOdcProgram,
  type OdcProgram,
} from '../lib/api'

export default function PageOdcPrograms() {
  const [programs, setPrograms] = useState<OdcProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setPrograms(await listOdcPrograms())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les programmes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

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

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8">
      <PageHeader
        title="Candidatures ODC"
        subtitle="Programmes et dossiers. La décision d’acceptation reste humaine."
      />
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {loading ? (
        <Card className="p-8">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-100" />
        </Card>
      ) : programs.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="Aucun programme"
          description="Créez un appel à candidatures depuis l’API ODC (POST /odc/programs). Le formulaire de création arrive dans un lot suivant."
        />
      ) : (
        <div className="space-y-3">
          {programs.map((program) => {
            const status = odcProgramStatusLabel(program.status)
            return (
              <Card key={program.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
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
    </div>
  )
}
