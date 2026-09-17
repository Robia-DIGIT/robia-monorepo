import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Alert, Badge, Button, Card, PageHeader } from '../components/ui'
import {
  decideOdcApplication,
  formatOdcScore,
  getOdcApplication,
  odcApplicationStatusLabel,
  type OdcApplication,
  type OdcDecision,
} from '../lib/api'

const DECIDABLE = new Set(['in_review', 'waitlisted'])

export default function PageOdcApplication() {
  const { id = '' } = useParams()
  const [application, setApplication] = useState<OdcApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingDecision, setPendingDecision] = useState<OdcDecision | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setApplication(await getOdcApplication(id))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger ce dossier.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [id])

  const openDecide = (decision: OdcDecision) => {
    setPendingDecision(decision)
    setReason('')
    setModalOpen(true)
  }

  const confirmDecide = async () => {
    if (!pendingDecision || !reason.trim()) return
    setBusy(true)
    setError('')
    try {
      const updated = await decideOdcApplication(id, {
        decision: pendingDecision,
        decisionReason: reason.trim(),
      })
      setApplication(updated)
      setModalOpen(false)
      setPendingDecision(null)
    } catch (decideError) {
      setError(decideError instanceof Error ? decideError.message : 'La décision a échoué.')
    } finally {
      setBusy(false)
    }
  }

  if (loading && !application) {
    return (
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <Card className="p-8">
          <div className="h-8 w-72 animate-pulse rounded-lg bg-slate-100" />
        </Card>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        {error && <Alert variant="error">{error}</Alert>}
      </div>
    )
  }

  const status = odcApplicationStatusLabel(application.status)
  const canDecide = DECIDABLE.has(application.status)
  const answers = application.answers ?? {}
  const events = application.events ?? []
  const program = application.program

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-8">
      <Link
        to={program ? `/odc/programmes/${program.id}` : '/odc/programmes'}
        className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-electric hover:underline"
      >
        <ArrowLeft size={14} /> Kanban
      </Link>
      <PageHeader
        title={application.applicant?.displayName ?? 'Candidature'}
        subtitle={program?.name}
        badge={<Badge variant={status.variant}>{status.label}</Badge>}
      />

      <div
        className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        data-testid="odc-human-decision-banner"
      >
        La décision est humaine. L’IA peut proposer un résumé ou un score, elle n’accepte ni ne refuse un dossier.
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-navy">Scores</h2>
          <p className="text-sm text-muted">
            Proposé : {formatOdcScore(application.proposedTotal)}
          </p>
          <p className="mt-1 text-sm font-semibold text-navy">
            Figé : {formatOdcScore(application.finalTotal)}
          </p>
          {application.summaryDraft && (
            <p className="mt-3 text-xs leading-relaxed text-muted">{application.summaryDraft}</p>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-navy">Pièces et manques</h2>
          {(application.missing ?? []).length > 0 ? (
            <ul className="list-disc pl-4 text-sm text-orange">
              {(application.missing ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Aucun champ manquant signalé.</p>
          )}
          <ul className="mt-3 space-y-1 text-xs text-muted">
            {(application.documents ?? []).map((doc) => (
              <li key={doc.id}>
                {doc.originalName} — {doc.status}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h2 className="mb-3 text-sm font-semibold text-navy">Réponses</h2>
        {program?.fields?.length ? (
          <dl className="space-y-3">
            {program.fields.map((field) => {
              const value = answers[field.key]
              const display =
                value === undefined || value === null || value === ''
                  ? 'Non renseigné'
                  : String(value)
              return (
                <div key={field.id}>
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">{field.label}</dt>
                  <dd className="mt-1 text-sm text-dark">{display}</dd>
                </div>
              )
            })}
          </dl>
        ) : (
          <p className="text-sm text-muted">Pas de champs sur ce programme.</p>
        )}
      </Card>

      {canDecide && (
        <Card className="mt-4 p-5">
          <h2 className="mb-3 text-sm font-semibold text-navy">Décider</h2>
          <p className="mb-3 text-xs text-muted">Un motif est obligatoire. Aucune publication automatique.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={() => openDecide('accepted')}>
              Accepter
            </Button>
            <Button size="sm" variant="outline" onClick={() => openDecide('waitlisted')}>
              Liste d’attente
            </Button>
            <Button size="sm" variant="danger" onClick={() => openDecide('rejected')}>
              Refuser
            </Button>
          </div>
        </Card>
      )}

      <Card className="mt-4 p-5">
        <h2 className="mb-3 text-sm font-semibold text-navy">Historique</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted">Aucun événement.</p>
        ) : (
          <ol className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="text-xs text-muted">
                {new Date(event.createdAt).toLocaleString('fr-FR')} — {event.eventType}
                {event.fromStatus && event.toStatus ? ` (${event.fromStatus} → ${event.toStatus})` : ''}
              </li>
            ))}
          </ol>
        )}
      </Card>

      {modalOpen && pendingDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4" data-testid="odc-decide-modal">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-base font-semibold text-navy">Confirmer la décision</h3>
            <p className="mt-1 text-sm text-muted">
              {pendingDecision === 'accepted' && 'Accepter ce dossier'}
              {pendingDecision === 'rejected' && 'Refuser ce dossier'}
              {pendingDecision === 'waitlisted' && 'Placer en liste d’attente'}
              . Le motif est obligatoire.
            </p>
            <textarea
              className="mt-3 w-full rounded-lg border border-border-light p-3 text-sm"
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Motif (obligatoire)"
              data-testid="odc-decide-reason"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button
                size="sm"
                variant="primary"
                loading={busy}
                disabled={!reason.trim()}
                onClick={() => void confirmDecide()}
              >
                Confirmer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
