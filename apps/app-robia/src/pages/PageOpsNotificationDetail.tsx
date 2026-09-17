import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'

import { Badge, Button, Card } from '../components/ui'
import {
  getNotificationDelivery,
  notificationStatusLabel,
  notificationTemplateLabel,
  retryNotificationDelivery,
  type NotificationDelivery,
} from '../lib/api'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm text-dark">{value}</dd>
    </div>
  )
}

export default function PageOpsNotificationDetail() {
  const { id = '' } = useParams()
  const [delivery, setDelivery] = useState<NotificationDelivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      setDelivery(await getNotificationDelivery(id))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger cette notification.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleRetry = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      setDelivery(await retryNotificationDelivery(id))
      setMessage('La notification a été replacée dans la file d’envoi.')
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Impossible de relancer cette notification.')
    } finally {
      setBusy(false)
    }
  }

  if (loading && !delivery) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Card className="p-8"><div className="h-8 w-72 bg-slate-100 rounded-lg animate-pulse" /></Card>
      </div>
    )
  }

  if (!delivery) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Card role="alert" className="p-6 text-sm text-red-700 bg-red-50 border-red-200">
          {error || 'Notification introuvable.'}
        </Card>
      </div>
    )
  }

  const status = notificationStatusLabel(delivery.status)
  const retryAllowed = delivery.status === 'dead_letter' && delivery.attemptCount < 5

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-slide-up">
      <Link to="/ops/notifications" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy">
        <ArrowLeft size={14} /> Retour aux notifications
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="gray">{delivery.channel.toUpperCase()}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-navy">{notificationTemplateLabel(delivery.templateKey)}</h1>
          <p className="mt-1 text-sm text-muted">Destinataire {delivery.recipientMasked}</p>
        </div>
        {retryAllowed && (
          <Button variant="primary" size="sm" icon={<RefreshCw size={14} />} loading={busy} onClick={() => void handleRetry()}>
            Relancer l’envoi
          </Button>
        )}
      </div>

      {error && <Card role="alert" className="mb-6 p-4 text-sm text-red-700 bg-red-50 border-red-200">{error}</Card>}
      {message && <Card role="status" className="mb-6 p-4 text-sm text-emerald-700 bg-emerald-50 border-emerald-200">{message}</Card>}

      <Card className="p-5">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Tentatives utilisées" value={`${delivery.attemptCount} sur 5`} />
          <Field label="Créée le" value={formatDate(delivery.createdAt)} />
          <Field label="Dernière mise à jour" value={formatDate(delivery.updatedAt)} />
          <Field label="Prochaine tentative" value={delivery.status === 'retry_scheduled' || delivery.status === 'pending' ? formatDate(delivery.nextAttemptAt) : '—'} />
          <Field label="Acceptée par le serveur email" value={formatDate(delivery.sentAt)} />
          <Field label="Identifiant fournisseur" value={delivery.providerMessageId ?? '—'} />
        </dl>

        {delivery.lastError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">Dernière erreur</p>
            <p className="mt-1 break-words text-sm text-red-700">{delivery.lastError}</p>
          </div>
        )}

        {delivery.status === 'dead_letter' && delivery.attemptCount >= 5 && (
          <p className="mt-6 rounded-lg border border-border bg-slate-bg p-4 text-xs text-muted">
            Le plafond de cinq tentatives est atteint. Cette livraison ne peut plus être relancée automatiquement ou manuellement.
          </p>
        )}
      </Card>
    </div>
  )
}
