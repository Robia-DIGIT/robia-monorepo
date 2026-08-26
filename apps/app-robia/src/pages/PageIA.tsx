import { useEffect, useState } from 'react'
import { Bot, Sparkles } from 'lucide-react'
import { Button, Card, EmptyState, PageHeader } from '../components/ui'
import { getCurrentOrganization, auditScore, getLatestAudit, listWebsites, type Organization } from '../lib/api'

const quickActions = [
  'Rédiger une fiche Google Business',
  'Répondre à un avis client',
  'Optimiser la balise title',
  'Générer un plan de contenu local',
]

export default function PageIA() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [contextError, setContextError] = useState(false)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      try {
        const org = await getCurrentOrganization()
        if (!active) return
        setOrganization(org)
      } catch {
        if (active) setContextError(true)
        if (active) setLoading(false)
        return
      }

      // Score is a nice-to-have on top of the org context — a failure here
      // shouldn't discard the organization we already successfully loaded.
      try {
        const websites = await listWebsites()
        const websiteId = websites[0]?.id
        const audit = websiteId ? await getLatestAudit(String(websiteId)) : null
        if (active) setLastScore(audit ? auditScore(audit) : null)
      } catch {
        // silently skip the score — the org context alone is still useful
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [])

  const contextHint = organization
    ? `${organization.name} · ${organization.city ?? 'Ville inconnue'}${lastScore != null ? ` · score SEO: ${lastScore}/100` : ''}`
    : 'Connectez une organisation pour activer le contexte.'

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-slide-up">
      <PageHeader
        title="Assistant IA"
        subtitle="Conversations intelligentes pour booster votre visibilité"
        badge={<span className="bg-orange-light text-[#C2410C] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#FDBA74]/60">Fonctionnalité à venir</span>}
        actions={<Button variant="primary" size="sm" icon={<Sparkles size={14} />} disabled title="Bientôt disponible">Prochainement</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 min-h-140 flex flex-col items-center justify-center text-center">
          <EmptyState
            icon={<Bot size={36} color="#14B8A6" strokeWidth={1.5} />}
            title="Chat IA — À venir"
            description="L'assistant conversationnel de ROBIA sera fonctionnelle lors de sa prochaine itération. En attendant, utilisez les modules d'analyse, d'opportunités et d'exécution déjà connectés pour piloter votre visibilité."
          />
          <div className="mt-8 w-full max-w-xl text-sm text-muted rounded-2xl bg-slate-bg/60 border border-border p-4 text-left">
            <div className="text-xs uppercase tracking-wide text-muted mb-2">Contexte disponible (en attente de endpoint)</div>
            {loading ? (
              <div className="space-y-2 animate-pulse" aria-busy="true" aria-live="polite">
                <span className="sr-only">Chargement du contexte…</span>
                <div className="h-4 w-3/4 rounded bg-border" />
              </div>
            ) : contextError ? (
              <div className="text-[#C2410C]">Impossible de charger le contexte de l'organisation. Réessayez plus tard.</div>
            ) : (
              <div>{contextHint}</div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-dark mb-4">Historique des conversations</h3>
            <EmptyState
              icon={<Sparkles size={18} />}
              title="Aucune conversation"
              description="L'historique sera stocké côté backend (endpoint `/ai/chat` ou équivalent à spécifier)."
            />
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dark">Actions rapides IA</h3>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">Bientôt</span>
            </div>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Disponible dès que /documents/generate sera exploité"
                  className="w-full rounded-xl bg-slate-bg/60 border border-border p-3 text-left text-sm text-dark/60 font-medium cursor-not-allowed"
                >
                  {action}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted mt-3">Ces actions seront implémentées dès que le endpoint `/documents/generate` sera exploité au clic.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}