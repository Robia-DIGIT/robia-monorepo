import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, ChevronRight, RefreshCw } from 'lucide-react'

import { Badge, Button, Card, EmptyState, PageHeader } from '../components/ui'
import {
  listNotificationDeliveries,
  notificationStatusLabel,
  notificationTemplateLabel,
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
  })
}

export default function PageOpsNotifications() {
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      setDeliveries(await listNotificationDeliveries())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    listNotificationDeliveries()
      .then((data) => {
        if (!cancelled) setDeliveries(data)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les notifications.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-slide-up">
      <PageHeader
        title="Notifications"
        subtitle="Suivez les emails préparés par vos automatisations et intervenez sur les échecs."
        actions={
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} loading={loading} onClick={() => void loadData()}>
            Actualiser
          </Button>
        }
      />

      <Card className="mb-6 p-4 text-xs leading-relaxed text-muted bg-slate-bg">
        Le statut « Accepté par le serveur email » confirme la prise en charge par le fournisseur SMTP. Il ne confirme
        pas l'ouverture ni la réception dans la boîte du destinataire.
      </Card>

      {error && (
        <Card role="alert" className="mb-6 p-4 text-sm text-red-700 bg-red-50 border-red-200">
          {error}
        </Card>
      )}

      {loading && deliveries.length === 0 ? (
        <Card className="p-8">
          <div className="h-8 w-72 bg-slate-100 rounded-lg animate-pulse" />
        </Card>
      ) : deliveries.length === 0 ? (
        <EmptyState
          icon={<BellRing size={18} />}
          title="Aucune notification"
          description="Les emails produits par les automatisations apparaîtront ici."
        />
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery) => {
            const status = notificationStatusLabel(delivery.status)
            return (
              <Link key={delivery.id} to={`/ops/notifications/${delivery.id}`} className="block">
                <Card className="p-4" hover>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Badge variant="gray">{delivery.channel.toUpperCase()}</Badge>
                      </div>
                      <p className="truncate text-sm font-semibold text-navy">
                        {notificationTemplateLabel(delivery.templateKey)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Destinataire {delivery.recipientMasked} · créée le {formatDate(delivery.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-muted">{delivery.attemptCount}/5 tentative(s)</span>
                      <ChevronRight size={17} className="text-muted" aria-hidden="true" />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
