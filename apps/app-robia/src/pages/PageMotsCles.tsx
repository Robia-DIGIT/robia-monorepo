import { useCallback, useEffect, useState } from 'react'
import { Link2, RefreshCw, Search, Target, TrendingUp } from 'lucide-react'

import { Badge, Button, Card, EmptyState } from '../components/ui'
import {
  getSearchConsolePerformance,
  getSearchConsoleStatus,
  type SearchConsoleMetric,
  type SearchConsoleStatus,
} from '../lib/api'

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Une erreur inattendue est survenue.'

const percent = (value: number) => `${(value * 100).toFixed(1)} %`
const number = (value: number) => new Intl.NumberFormat('fr-FR').format(Math.round(value))

type OpportunityTier = 'quick_win' | 'a_developper' | 'fort' | 'hors_top20' | 'position_inconnue'

// Google ne classe pas nativement une requête comme "opportunité" — ce sont
// les mêmes clics/impressions/position bruts que Search Console renvoie déjà
// (voir SearchConsoleMetric), juste triés par potentiel de gain plutôt que
// par volume brut. Une position 4-10 est la plus rentable à travailler :
// déjà visible, un petit gain suffit souvent à atteindre le top 3. Une
// position 11-20 (page 2) demande plus d'effort mais reste atteignable.
// Position 1-3 est déjà acquise. Au-delà de 20 (hors des deux premières
// pages), la requête est quasiment invisible — distinct d'une position
// forte, jamais confondu avec elle. `position` vient d'une réponse HTTP
// JSON, donc le typage TS ne garantit rien à l'exécution : une valeur
// manquante, NaN ou négative doit être son propre palier plutôt que de
// tomber, par accident, dans "Position forte".
export function opportunityTier(position: number): OpportunityTier {
  if (!Number.isFinite(position) || position <= 0) return 'position_inconnue'
  if (position <= 3) return 'fort'
  if (position <= 10) return 'quick_win'
  if (position <= 20) return 'a_developper'
  return 'hors_top20'
}

const TIER_META: Record<OpportunityTier, { label: string; badge: 'orange' | 'blue' | 'teal' | 'gray' | 'red'; description: string }> = {
  quick_win: {
    label: 'Gain rapide',
    badge: 'orange',
    description: 'Déjà en page 1 (position 4 à 10) — un petit effort suffit souvent à passer dans le top 3.',
  },
  a_developper: {
    label: 'À développer',
    badge: 'blue',
    description: 'En page 2 (position 11 à 20) — un contenu plus complet peut la faire remonter en page 1.',
  },
  fort: {
    label: 'Position forte',
    badge: 'teal',
    description: 'Déjà dans le top 3 — à surveiller, pas prioritaire.',
  },
  hors_top20: {
    label: 'Hors Top 20',
    badge: 'gray',
    description: "Au-delà de la position 20 — quasiment invisible, un travail de fond peut être nécessaire avant d'y revenir.",
  },
  position_inconnue: {
    label: 'Position inconnue',
    badge: 'red',
    description: "Google n'a pas fourni de position exploitable pour cette requête sur la période.",
  },
}

function KeywordRow({ query }: { query: SearchConsoleMetric }) {
  const tier = opportunityTier(query.position)
  const meta = TIER_META[tier]
  return (
    <article className="flex flex-col gap-3 border-l-2 border-border px-4 py-3.5 transition-colors hover:border-orange hover:bg-orange-light/10 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge variant={meta.badge}>{meta.label}</Badge>
          <span className="truncate text-sm font-bold text-navy">{query.key}</span>
        </div>
        <p className="text-xs text-muted">{meta.description}</p>
      </div>
      <div className="grid shrink-0 grid-cols-4 gap-4 text-right sm:gap-6">
        <div><p className="text-[10px] uppercase tracking-wide text-muted">Position</p><p className="text-sm font-bold text-dark">{Number.isFinite(query.position) && query.position > 0 ? query.position.toFixed(1) : '—'}</p></div>
        <div><p className="text-[10px] uppercase tracking-wide text-muted">Impressions</p><p className="text-sm font-bold text-dark">{number(query.impressions)}</p></div>
        <div><p className="text-[10px] uppercase tracking-wide text-muted">Clics</p><p className="text-sm font-bold text-dark">{number(query.clicks)}</p></div>
        <div><p className="text-[10px] uppercase tracking-wide text-muted">CTR</p><p className="text-sm font-bold text-dark">{percent(query.ctr)}</p></div>
      </div>
    </article>
  )
}

export default function PageMotsCles() {
  const [status, setStatus] = useState<SearchConsoleStatus | null>(null)
  const [queries, setQueries] = useState<SearchConsoleMetric[] | null>(null)
  const [period, setPeriod] = useState<{ startDate: string; endDate: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const current = await getSearchConsoleStatus()
      setStatus(current)
      if (!current.connected || !current.selectedSiteUrl) {
        setQueries(null)
        setPeriod(null)
        return
      }
      const performance = await getSearchConsolePerformance()
      setQueries(performance.topQueries)
      setPeriod({ startDate: performance.startDate, endDate: performance.endDate })
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleRefresh = async () => {
    setBusy(true)
    setError('')
    try {
      const performance = await getSearchConsolePerformance()
      setQueries(performance.topQueries)
      setPeriod({ startDate: performance.startDate, endDate: performance.endDate })
    } catch (refreshError) {
      setError(errorMessage(refreshError))
    } finally {
      setBusy(false)
    }
  }

  const sorted = (queries ?? [])
    .slice()
    .sort((left, right) => {
      const order: Record<OpportunityTier, number> = {
        quick_win: 0,
        a_developper: 1,
        hors_top20: 2,
        fort: 3,
        position_inconnue: 4,
      }
      const tierDiff = order[opportunityTier(left.position)] - order[opportunityTier(right.position)]
      if (tierDiff !== 0) return tierDiff
      return right.impressions - left.impressions
    })
  const quickWinCount = sorted.filter((q) => opportunityTier(q.position) === 'quick_win').length

  if (loading) {
    return <div className="mx-auto max-w-7xl p-5 md:p-6 lg:p-8"><Card className="p-8"><div className="h-8 w-80 rounded-lg bg-slate-100" /></Card></div>
  }

  return (
    <div className="mx-auto max-w-7xl animate-slide-up p-5 md:p-6 lg:p-8">
      <header className="mb-7 border-b border-border pb-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark"><Target size={15} /> Opportunités mots-clés</p>
            <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">Quels mots-clés faire progresser ?</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Données réelles Google Search Console, triées par potentiel de gain plutôt que par volume — les requêtes déjà en page 1 ou 2 sont les plus rapides à améliorer.</p>
          </div>
          {status?.connected && status.selectedSiteUrl && (
            <Button variant="primary" size="sm" icon={<RefreshCw size={14} className={busy ? 'animate-spin' : ''} />} loading={busy} onClick={handleRefresh}>Actualiser</Button>
          )}
        </div>
      </header>

      {status?.connected && status.selectedSiteUrl && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(31,58,95,0.04)]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-light text-teal-dark"><Search size={16} /></div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Propriété Search Console analysée</p>
            <p className="truncate text-sm font-bold text-navy">{status.selectedSiteUrl}</p>
          </div>
        </div>
      )}

      {error && <div className="mb-6 rounded-r-xl border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">{error}</div>}

      {!status?.connected || !status.selectedSiteUrl ? (
        <Card className="p-8">
          <EmptyState
            icon={<Search size={18} />}
            title="Search Console non connecté"
            description="Connectez Google Search Console pour voir les vraies opportunités de mots-clés de votre site."
            action={<Button variant="primary" icon={<Link2 size={14} />} onClick={() => { window.location.href = '/google-data' }}>Connecter Google Search Console</Button>}
          />
        </Card>
      ) : sorted.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Search size={18} />}
            title="Aucune requête disponible"
            description="Aucune donnée de recherche n'est encore remontée par Google pour ce site."
          />
        </Card>
      ) : (
        <>
          {period && <p className="mb-4 text-xs text-muted">Période analysée : du {period.startDate} au {period.endDate} — {quickWinCount} gain{quickWinCount > 1 ? 's' : ''} rapide{quickWinCount > 1 ? 's' : ''} identifié{quickWinCount > 1 ? 's' : ''}.</p>}
          <Card className="divide-y divide-border overflow-hidden">
            {sorted.map((query) => <KeywordRow key={query.key} query={query} />)}
          </Card>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted"><TrendingUp size={13} /> Limité aux 10 requêtes les plus actives sur la période — la couverture s'élargira avec le volume de trafic du site.</p>
        </>
      )}
    </div>
  )
}
