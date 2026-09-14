import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Link2,
  LoaderCircle,
  RefreshCw,
  Share2,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import {
  disconnectMeta,
  getMetaAuthorizationUrl,
  getMetaPerformance,
  getMetaStatus,
  listMetaAssets,
  selectMetaAsset,
  type MetaAsset,
  type MetaPerformance,
  type MetaStatus,
} from "../lib/meta";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Une erreur inattendue est survenue.";

const formatNumber = (value: number | null) =>
  value === null
    ? "Non mesuré"
    : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);

const formatDate = (value: string | null) => {
  if (!value) return "Jamais";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="border-t-2 border-teal bg-white px-5 py-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-navy">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </article>
  );
}

export default function MetaDataPage() {
  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [assets, setAssets] = useState<MetaAsset[]>([]);
  const [performance, setPerformance] = useState<MetaPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextStatus = await getMetaStatus();
      setStatus(nextStatus);
      if (!nextStatus.connected) {
        setAssets([]);
        setPerformance(null);
        return;
      }
      setAssets(await listMetaAssets());
      if (nextStatus.selectedPageId) {
        try {
          setPerformance(await getMetaPerformance());
        } catch (performanceError) {
          setPerformance(null);
          setError(errorMessage(performanceError));
        }
      } else {
        setPerformance(null);
      }
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const connect = async () => {
    setBusy("connect");
    setError(null);
    try {
      const { url } = await getMetaAuthorizationUrl();
      window.location.assign(url);
    } catch (connectError) {
      setError(errorMessage(connectError));
      setBusy(null);
    }
  };

  const chooseAsset = async (pageId: string) => {
    setBusy(`asset:${pageId}`);
    setError(null);
    try {
      await selectMetaAsset(pageId);
      await load();
    } catch (selectError) {
      setError(errorMessage(selectError));
    } finally {
      setBusy(null);
    }
  };

  const refresh = async () => {
    setBusy("refresh");
    setError(null);
    try {
      setPerformance(await getMetaPerformance());
      await load();
    } catch (refreshError) {
      setError(errorMessage(refreshError));
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    if (!window.confirm("Déconnecter Meta de cette organisation ROBIA ?")) return;
    setBusy("disconnect");
    setError(null);
    try {
      await disconnectMeta();
      await load();
    } catch (disconnectError) {
      setError(errorMessage(disconnectError));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-full bg-slate-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal">
              <BarChart3 size={15} /> RC18 · Présence sociale
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-navy">Données Meta</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Facebook et Instagram professionnel en lecture seule. Les signaux Meta restent séparés du score SEO ROBIA.
            </p>
          </div>
          {status?.connected && (
            <div className="flex gap-2">
              {status.selectedPageId && (
                <button type="button" onClick={() => void refresh()} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm disabled:opacity-60">
                  {busy === "refresh" ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />} Actualiser
                </button>
              )}
              <button type="button" onClick={() => void disconnect()} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm disabled:opacity-60">
                <Unplug size={16} /> Déconnecter
              </button>
            </div>
          )}
        </header>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="border-t-2 border-teal bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-navy">Connexion Meta</h2>
                <p className="mt-1 text-sm text-muted">Connexion isolée par organisation, sans permission de publication.</p>
              </div>
              <ShieldCheck size={22} className="text-teal" />
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" /> Chargement…</div>
            ) : status?.connected ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Connecté</span>
                  <span className="rounded-full bg-slate-bg px-2.5 py-1 text-xs font-semibold text-muted">Lecture seule</span>
                  <span className="rounded-full bg-slate-bg px-2.5 py-1 text-xs font-semibold text-muted">Hors score SEO</span>
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs uppercase text-muted">Compte Meta</dt><dd className="mt-1 font-semibold text-dark">{status.metaUserName || status.metaUserId || "Compte connecté"}</dd></div>
                  <div><dt className="text-xs uppercase text-muted">Connecté le</dt><dd className="mt-1 font-semibold text-dark">{formatDate(status.connectedAt)}</dd></div>
                  <div><dt className="text-xs uppercase text-muted">Page active</dt><dd className="mt-1 font-semibold text-dark">{status.selectedPageName || "À sélectionner"}</dd></div>
                  <div><dt className="text-xs uppercase text-muted">Instagram lié</dt><dd className="mt-1 font-semibold text-dark">{status.selectedInstagramUsername ? `@${status.selectedInstagramUsername}` : "Non détecté"}</dd></div>
                </dl>
              </div>
            ) : (
              <button type="button" onClick={() => void connect()} disabled={busy !== null} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {busy === "connect" ? <LoaderCircle size={16} className="animate-spin" /> : <Link2 size={16} />} Connecter Meta
              </button>
            )}
          </div>
          <div className="border-t-2 border-orange bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy">Garanties RC18</h2>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <p>• Aucune publication ou modification automatique.</p>
              <p>• Aucun jeton Meta exposé au navigateur.</p>
              <p>• Une métrique absente reste « Non mesuré ».</p>
              <p>• Toute future écriture devra passer par l’approbation RC14.</p>
            </div>
          </div>
        </section>

        {status?.connected && (
          <section className="border-t-2 border-teal bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy">Pages Facebook accessibles</h2>
            <p className="mt-1 text-sm text-muted">Sélectionnez la Page utilisée comme source sociale pour cette organisation.</p>
            {assets.length === 0 ? (
              <p className="mt-5 rounded-lg bg-slate-bg px-4 py-5 text-sm text-muted">Aucune Page Facebook accessible retournée par Meta.</p>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {assets.map((asset) => (
                  <button type="button" key={asset.pageId} onClick={() => void chooseAsset(asset.pageId)} disabled={busy !== null || asset.selected} className={`rounded-xl border p-4 text-left transition ${asset.selected ? "border-teal bg-teal/5" : "border-border bg-white hover:border-teal/40"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div><div className="font-semibold text-dark">{asset.pageName}</div><div className="mt-1 text-xs text-muted">Page ID {asset.pageId}</div></div>
                      {asset.selected && <CheckCircle2 size={18} className="text-teal" />}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted"><Share2 size={14} /> {asset.instagramAccount?.username ? `Instagram @${asset.instagramAccount.username}` : "Aucun Instagram professionnel lié"}</div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {performance && (
          <>
            <section>
              <div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-lg font-bold text-navy">Facebook</h2><p className="text-sm text-muted">{performance.facebook.pageName || status?.selectedPageName}</p></div><p className="text-xs text-muted">Synchro : {formatDate(performance.lastSyncedAt)}</p></div>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Abonnés" value={formatNumber(performance.facebook.followersCount)} detail="Followers de la Page" />
                <MetricCard label="J’aime la Page" value={formatNumber(performance.facebook.fanCount)} detail="Fan count disponible" />
                <MetricCard label="Personnes qui en parlent" value={formatNumber(performance.facebook.talkingAboutCount)} detail="Signal public disponible" />
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2"><Share2 size={19} className="text-orange" /><h2 className="text-lg font-bold text-navy">Instagram professionnel</h2></div>
              {performance.instagram ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <MetricCard label="Abonnés Instagram" value={formatNumber(performance.instagram.followersCount)} detail={performance.instagram.username ? `@${performance.instagram.username}` : "Compte lié"} />
                    <MetricCard label="Comptes suivis" value={formatNumber(performance.instagram.followsCount)} detail="Follows count" />
                    <MetricCard label="Médias publiés" value={formatNumber(performance.instagram.mediaCount)} detail="Total retourné par Meta" />
                  </div>
                  <div className="border-t-2 border-orange bg-white p-6 shadow-sm">
                    <h3 className="font-bold text-navy">Médias récents</h3>
                    {performance.instagram.recentMedia.length === 0 ? (
                      <p className="mt-4 text-sm text-muted">Aucun média récent disponible avec les permissions actuelles.</p>
                    ) : (
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {performance.instagram.recentMedia.map((media, index) => (
                          <article key={media.id ?? `${media.timestamp ?? "media"}-${index}`} className="rounded-xl border border-border p-4">
                            <div className="flex items-start justify-between gap-2"><span className="text-xs font-bold uppercase text-orange">{media.mediaType || "Média"}</span><span className="text-[11px] text-muted">{formatDate(media.timestamp)}</span></div>
                            <p className="mt-3 line-clamp-3 text-sm text-dark">{media.caption || "Aucune légende disponible."}</p>
                            <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted"><span>{formatNumber(media.likeCount)} j’aime · {formatNumber(media.commentsCount)} commentaires</span>{media.permalink && <a href={media.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-teal hover:underline">Ouvrir <ExternalLink size={12} /></a>}</div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-white px-5 py-6 text-sm text-muted shadow-sm">Aucun compte Instagram professionnel lié à la Page sélectionnée.</div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
