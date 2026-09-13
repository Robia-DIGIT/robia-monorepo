import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  Heart,
  Image,
  Instagram,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Share2,
  ShieldCheck,
  Unplug,
  Users,
} from 'lucide-react'
import {
  disconnectMeta,
  getMetaAuthorizationUrl,
  getMetaPerformance,
  getMetaStatus,
  listMetaAssets,
  selectMetaPage,
  type MetaAsset,
  type MetaPerformance,
  type MetaStatus,
} from '../lib/meta'

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Une erreur inattendue est survenue.'

const formatNumber = (value: number | null) =>
  value === null
    ? 'Non mesuré'
    : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Jamais'

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users
  label: string
  value: string
  detail: string
}) {
  return (
    <article className="border-t-2 border-teal bg-white px-5 py-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <Icon size={17} className="text-teal" />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-navy">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </article>
  )
}

export default function MetaDataPage() {
  const oauthResult = new URLSearchParams(window.location.search).get('meta')
  const [status, setStatus] = useState<MetaStatus | null>(null)
  const [assets, setAssets] = useState<MetaAsset[]>([])
  const [performance, setPerformance] = useState<MetaPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(
    oauthResult === 'connected'
      ? 'Compte Meta connecté. Les actifs accessibles ont été chargés.'
      : '',
  )
  const [error, setError] = useState(
    oauthResult === 'denied'
      ? 'Autorisation Meta annulée. Aucune donnée n’a été modifiée.'
      : oauthResult === 'error'
        ? 'La connexion Meta n’a pas pu être terminée. Réessayez.'
        : '',
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const current = await getMetaStatus()
      setStatus(current)
      if (!current.connected) {
        setAssets([])
        setPerformance(null)
        return
      }

      const availableAssets = await listMetaAssets()
      setAssets(availableAssets)
      if (current.selectedPageId) {
        setPerformance(await getMetaPerformance())
      } else {
        setPerformance(null)
      }
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (oauthResult) window.history.replaceState({}, '', window.location.pathname)
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load, oauthResult])

  async function connect() {
    setBusy(true)
    setError('')
    try {
      const { url } = await getMetaAuthorizationUrl()
      window.location.assign(url)
    } catch (reason) {
      setError(errorMessage(reason))
      setBusy(false)
    }
  }

  async function selectPage(pageId: string) {
    if (!pageId) return
    setBusy(true)
    setError('')
    try {
      const selected = await selectMetaPage(pageId)
      setNotice(`Page Facebook ${selected.pageName} sélectionnée.`)
      await load()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function refresh() {
    setBusy(true)
    setError('')
    try {
      setPerformance(await getMetaPerformance())
      setNotice('Données Meta actualisées.')
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    if (!window.confirm('Déconnecter Meta de cette organisation ?')) return
    setBusy(true)
    setError('')
    try {
      await disconnectMeta()
      setNotice('Le compte Meta a été déconnecté.')
      await load()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted">
        <LoaderCircle className="mr-2 animate-spin" size={18} />
        Chargement des données Meta…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl animate-slide-up p-5 md:p-6 lg:p-8">
      <header className="mb-7 flex flex-col justify-between gap-5 border-b border-border pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark">
            <Share2 size={15} /> Présence sociale
          </p>
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">
            Facebook & Instagram
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Connectez les actifs Meta de l’organisation en lecture seule pour suivre leur présence et leurs signaux réels.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-light px-3 py-1.5 text-teal-dark">
              <ShieldCheck size={14} /> Lecture seule
            </span>
            <span className="rounded-full bg-slate-bg px-3 py-1.5 text-muted">
              Hors score SEO
            </span>
          </div>
        </div>
        {status?.connected && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={busy || !status.selectedPageId}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-40"
            >
              <Unplug size={16} /> Déconnecter
            </button>
          </div>
        )}
      </header>

      {notice && (
        <div
          role="status"
          className="mb-5 flex items-start gap-2 border-l-2 border-teal bg-teal-light px-4 py-3 text-sm text-teal-dark"
        >
          <CheckCircle2 size={17} />
          {notice}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mb-5 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!status?.connected ? (
        <section className="grid overflow-hidden border-t-2 border-teal bg-white shadow-sm lg:grid-cols-[1fr_340px]">
          <div className="p-7 lg:p-10">
            <h2 className="text-xl font-bold text-navy">Connecter Meta</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              ROBIA demandera uniquement les autorisations nécessaires pour lister vos Pages Facebook et lire les informations des comptes Instagram professionnels associés.
            </p>
            <button
              type="button"
              onClick={connect}
              disabled={busy}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
            >
              {busy ? <LoaderCircle size={17} className="animate-spin" /> : <Share2 size={17} />}
              Connecter Facebook & Instagram
            </button>
          </div>
          <aside className="border-t border-border bg-slate-bg p-7 lg:border-l lg:border-t-0">
            <ShieldCheck className="text-teal" size={24} />
            <h3 className="mt-4 font-bold text-navy">Aucune publication automatique</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              RC18 ne publie, ne modifie et ne supprime aucun contenu sur Meta. Les écritures futures devront passer par une validation humaine explicite.
            </p>
          </aside>
        </section>
      ) : (
        <div className="space-y-6">
          <section className="border-t-2 border-teal bg-white p-5 shadow-sm md:p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Compte connecté</p>
                <h2 className="mt-2 text-xl font-bold text-navy">{status.metaUserName || 'Compte Meta'}</h2>
                <p className="mt-2 text-sm text-muted">
                  Dernière synchronisation : {formatDate(status.lastSyncedAt)}
                </p>
              </div>
              <label className="block text-sm font-semibold text-dark">
                Page Facebook analysée
                <select
                  value={status.selectedPageId ?? ''}
                  onChange={(event) => void selectPage(event.target.value)}
                  disabled={busy || assets.length === 0}
                  className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-medium text-dark outline-none focus:border-teal disabled:opacity-50"
                >
                  <option value="">Sélectionner une Page</option>
                  {assets.map((asset) => (
                    <option key={asset.pageId} value={asset.pageId}>
                      {asset.pageName}{asset.instagramAccount?.username ? ` · @${asset.instagramAccount.username}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {assets.length === 0 && (
              <p className="mt-5 border-l-2 border-orange bg-orange/5 px-4 py-3 text-sm text-muted">
                Aucune Page Facebook accessible n’a été retournée par Meta pour ce compte.
              </p>
            )}
          </section>

          {!status.selectedPageId ? (
            <section className="border border-dashed border-border bg-white px-6 py-10 text-center text-sm text-muted">
              Sélectionnez une Page Facebook pour charger les métriques disponibles.
            </section>
          ) : performance ? (
            <>
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Share2 size={17} className="text-teal" />
                  <h2 className="font-bold text-navy">Facebook · {performance.facebook.pageName || status.selectedPageName}</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard icon={Users} label="Abonnés" value={formatNumber(performance.facebook.followersCount)} detail="Valeur fournie par Meta" />
                  <MetricCard icon={Heart} label="Fans" value={formatNumber(performance.facebook.fanCount)} detail="Valeur fournie par Meta" />
                  <MetricCard icon={MessageCircle} label="En parlent" value={formatNumber(performance.facebook.talkingAboutCount)} detail="Valeur fournie par Meta" />
                </div>
              </section>

              {performance.instagram ? (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Instagram size={17} className="text-teal" />
                    <h2 className="font-bold text-navy">Instagram · @{performance.instagram.username || status.selectedInstagramUsername || 'compte professionnel'}</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <MetricCard icon={Users} label="Abonnés" value={formatNumber(performance.instagram.followersCount)} detail="Compte professionnel lié" />
                    <MetricCard icon={Users} label="Abonnements" value={formatNumber(performance.instagram.followsCount)} detail="Valeur fournie par Meta" />
                    <MetricCard icon={Image} label="Publications" value={formatNumber(performance.instagram.mediaCount)} detail="Valeur fournie par Meta" />
                  </div>

                  <div className="mt-5 overflow-hidden border-t-2 border-teal bg-white shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                      <h3 className="font-bold text-navy">Médias Instagram récents</h3>
                      <p className="mt-1 text-xs text-muted">Jusqu’à 10 éléments lorsque Meta les rend disponibles.</p>
                    </div>
                    {performance.instagram.recentMedia.length === 0 ? (
                      <p className="px-5 py-8 text-sm text-muted">Aucun média récent disponible avec les autorisations actuelles.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {performance.instagram.recentMedia.map((media, index) => (
                          <article key={media.id ?? `${media.timestamp ?? 'media'}-${index}`} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-wide text-teal-dark">{media.mediaType || 'Média Instagram'}</p>
                              <p className="mt-1 line-clamp-2 text-sm text-dark">{media.caption || 'Sans légende'}</p>
                              <p className="mt-2 text-xs text-muted">
                                {media.timestamp ? formatDate(media.timestamp) : 'Date non disponible'} · {formatNumber(media.likeCount)} j’aime · {formatNumber(media.commentsCount)} commentaires
                              </p>
                            </div>
                            {media.permalink && (
                              <a
                                href={media.permalink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-teal-dark hover:underline"
                              >
                                Voir sur Instagram <ExternalLink size={14} />
                              </a>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                <section className="border-l-2 border-orange bg-white px-5 py-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Instagram size={20} className="mt-0.5 text-orange" />
                    <div>
                      <h2 className="font-bold text-navy">Instagram non mesuré</h2>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        Aucun compte Instagram professionnel lié à la Page sélectionnée n’a été retourné par Meta.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              <p className="text-xs text-muted">Dernière synchronisation Meta : {formatDate(performance.lastSyncedAt)}</p>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
