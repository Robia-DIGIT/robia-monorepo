import { useEffect, useState } from 'react'
import { ArrowRight, Bot, MapPin, Radar, Sparkles } from 'lucide-react'
import { Button, EmptyState } from '../components/ui'
import WebsiteSelector from '../components/WebsiteSelector'
import { useWebsiteContext } from '../components/WebsiteContext'
import { getCurrentOrganization, auditScore, getLatestAudit, type Organization } from '../lib/api'

const quickActions = ['Rédiger une fiche Google Business', 'Répondre à un avis client', 'Optimiser la balise title', 'Générer un plan de contenu local']

export default function PageIA() {
  const { activeWebsite, activeWebsiteId } = useWebsiteContext()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [contextError, setContextError] = useState(false)

  useEffect(() => {
    let active = true
    const loadData = async () => {
      setLoading(true); setContextError(false)
      try {
        const org = await getCurrentOrganization()
        if (!active) return
        setOrganization(org)
        const audit = activeWebsiteId ? await getLatestAudit(activeWebsiteId).catch(() => null) : null
        if (active) setLastScore(audit ? auditScore(audit) : null)
      } catch { if (active) setContextError(true) }
      finally { if (active) setLoading(false) }
    }
    void loadData()
    return () => { active = false }
  }, [activeWebsiteId])

  return <div className="mx-auto max-w-7xl animate-slide-up p-5 md:p-6 lg:p-8">
    <header className="mb-7 border-b border-border pb-6"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark"><Radar size={15} /> Copilot contextuel ROBIA</p><h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">Demander, comprendre, puis agir</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Le Copilot utilisera uniquement le contexte de l’entreprise et du site actifs pour produire des recommandations utiles.</p></div><Button variant="primary" size="sm" icon={<Sparkles size={14} />} disabled title="Bientôt disponible">Copilot bientôt disponible</Button></div></header>

    <div className="mb-7 flex flex-col gap-3 border-l-2 border-teal bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><MapPin size={17} className="shrink-0 text-teal-dark" /><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Contexte transmis au Copilot</p><p className="truncate text-sm font-bold text-navy">{organization?.name ?? 'Entreprise'} · {activeWebsite?.url ?? 'Aucun site sélectionné'}</p></div></div><WebsiteSelector className="w-full sm:w-auto sm:min-w-72" /></div>

    <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
      <section className="flex min-h-130 flex-col border-t-2 border-teal bg-white">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-teal"><Bot size={18} /></div><div><h2 className="text-sm font-bold text-navy">ROBIA Copilot</h2><p className="text-[11px] text-muted">Conseils fondés sur vos signaux réels</p></div><span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-orange-dark">À venir</span></div>
        <div className="flex flex-1 items-center justify-center p-6"><EmptyState icon={<Bot size={28} />} title="Le dialogue arrive prochainement" description="Les contextes entreprise, site et score sont déjà préparés. L’interface sera activée lorsque l’endpoint conversationnel sera disponible." /></div>
        <div className="border-t border-border p-4"><div className="flex gap-2"><input disabled placeholder="Posez une question sur votre visibilité locale…" className="min-h-11 flex-1 rounded-lg border border-border bg-slate-bg px-4 text-sm text-muted" /><button disabled className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy text-white opacity-45"><ArrowRight size={17} /></button></div></div>
      </section>

      <aside className="space-y-7">
        <section className="border-t border-border pt-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Contexte disponible</p>{loading ? <div className="mt-4 h-16 animate-pulse bg-border-light" /> : contextError ? <p className="mt-4 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700">Impossible de charger le contexte.</p> : <div className="mt-4 divide-y divide-border"><div className="flex justify-between py-3 text-sm"><span className="text-muted">Entreprise</span><span className="font-bold text-navy">{organization?.name}</span></div><div className="flex justify-between py-3 text-sm"><span className="text-muted">Ville</span><span className="font-bold text-navy">{organization?.city ?? 'Non définie'}</span></div><div className="flex justify-between py-3 text-sm"><span className="text-muted">Score</span><span className="font-bold text-teal-dark">{lastScore != null ? `${lastScore}/100` : 'Sans audit'}</span></div></div>}</section>
        <section className="border-t border-border pt-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Demandes suggérées</p><div className="mt-3 divide-y divide-border">{quickActions.map((action) => <button key={action} type="button" disabled className="flex w-full cursor-not-allowed items-center justify-between py-3 text-left text-sm font-semibold text-dark/55"><span>{action}</span><ArrowRight size={14} /></button>)}</div><p className="mt-3 text-[10px] leading-4 text-muted">Ces actions seront activées avec le service de génération documentaire.</p></section>
      </aside>
    </div>
  </div>
}