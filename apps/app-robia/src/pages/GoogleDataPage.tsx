import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Link2,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  disconnectSearchConsole,
  getSearchConsoleAuthorizationUrl,
  getSearchConsolePerformance,
  getSearchConsoleStatus,
  listSearchConsoleSites,
  selectSearchConsoleSite,
  type SearchConsoleMetric,
  type SearchConsolePerformance,
  type SearchConsoleSite,
  type SearchConsoleStatus,
} from "../lib/api";

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Une erreur inattendue est survenue.";
}

function propertyLabel(siteUrl: string) {
  return siteUrl.startsWith("sc-domain:")
    ? siteUrl.slice("sc-domain:".length)
    : siteUrl;
}

function number(value: number, digits = 0) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: digits,
  }).format(value);
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="border-t-2 border-teal bg-white px-5 py-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-navy">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </article>
  );
}

function RankingTable({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: SearchConsoleMetric[];
  emptyLabel: string;
}) {
  return (
    <section className="overflow-hidden border-t-2 border-teal bg-white shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-bold text-navy">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-bg text-[10px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-bold">Élément</th>
                <th className="px-3 py-3 text-right font-bold">Clics</th>
                <th className="px-3 py-3 text-right font-bold">Impressions</th>
                <th className="px-5 py-3 text-right font-bold">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="max-w-sm truncate px-5 py-3 font-medium text-dark" title={row.key}>
                    {row.key || "—"}
                  </td>
                  <td className="px-3 py-3 text-right text-dark">{number(row.clicks)}</td>
                  <td className="px-3 py-3 text-right text-dark">{number(row.impressions)}</td>
                  <td className="px-5 py-3 text-right text-dark">{number(row.position, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function GoogleDataPage() {
  const oauthResult = new URLSearchParams(window.location.search).get("google");
  const [status, setStatus] = useState<SearchConsoleStatus | null>(null);
  const [sites, setSites] = useState<SearchConsoleSite[]>([]);
  const [performance, setPerformance] =
    useState<SearchConsolePerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(() =>
    oauthResult === "connected"
      ? "Compte Google connecté. Les propriétés accessibles ont été chargées."
      : "",
  );
  const [error, setError] = useState(() => {
    if (oauthResult === "denied") {
      return "Autorisation Google annulée. Aucune donnée n’a été enregistrée.";
    }
    if (oauthResult === "error") {
      return "La connexion Google n’a pas pu être terminée. Réessayez.";
    }
    return "";
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const currentStatus = await getSearchConsoleStatus();
      setStatus(currentStatus);
      if (!currentStatus.connected) {
        setSites([]);
        setPerformance(null);
        return;
      }

      const availableSites = await listSearchConsoleSites();
      setSites(availableSites);
      if (currentStatus.selectedSiteUrl) {
        setPerformance(await getSearchConsolePerformance());
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
    if (oauthResult) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, oauthResult]);

  async function connect() {
    setBusy(true);
    setError("");
    try {
      const { url } = await getSearchConsoleAuthorizationUrl();
      window.location.assign(url);
    } catch (connectError) {
      setError(errorMessage(connectError));
      setBusy(false);
    }
  }

  async function selectSite(siteUrl: string) {
    setBusy(true);
    setError("");
    try {
      await selectSearchConsoleSite(siteUrl);
      setNotice(`Propriété ${propertyLabel(siteUrl)} sélectionnée.`);
      await load();
    } catch (selectionError) {
      setError(errorMessage(selectionError));
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setBusy(true);
    setError("");
    try {
      setPerformance(await getSearchConsolePerformance());
      setNotice("Données Search Console actualisées.");
    } catch (refreshError) {
      setError(errorMessage(refreshError));
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Déconnecter Search Console de cette organisation ?")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await disconnectSearchConsole();
      setNotice("Search Console a été déconnecté de cette organisation.");
      await load();
    } catch (disconnectError) {
      setError(errorMessage(disconnectError));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted">
        <LoaderCircle className="mr-2 animate-spin" size={18} />
        Chargement des données Google…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl animate-slide-up p-5 md:p-6 lg:p-8">
      <header className="mb-7 flex flex-col justify-between gap-5 border-b border-border pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark">
            <BarChart3 size={15} /> Données Google
          </p>
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">
            Performance dans Google Search
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Mesurez les recherches, clics et positions de votre site avec un accès Search Console strictement en lecture seule.
          </p>
        </div>
        {status?.connected && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={busy || !status.selectedSiteUrl}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
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
        <div role="status" className="mb-5 flex items-start gap-2 border-l-2 border-teal bg-teal-light px-4 py-3 text-sm text-teal-dark">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-5 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!status?.connected ? (
        <section className="grid overflow-hidden border-t-2 border-teal bg-white shadow-sm lg:grid-cols-[1fr_340px]">
          <div className="p-7 lg:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white">
              <Search size={22} />
            </div>
            <h2 className="mt-5 text-xl font-bold text-navy">Connecter Google Search Console</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Autorisez ROBIA à consulter les propriétés Search Console de votre compte. ROBIA ne peut ni modifier votre site, ni publier du contenu.
            </p>
            <button
              type="button"
              onClick={connect}
              disabled={busy}
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Link2 size={16} />}
              Se connecter avec Google
            </button>
          </div>
          <aside className="border-t border-border bg-slate-bg p-7 lg:border-l lg:border-t-0">
            <ShieldCheck className="text-teal-dark" size={24} />
            <h3 className="mt-4 font-bold text-navy">Accès contrôlé</h3>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
              <li>Lecture seule Search Console</li>
              <li>Jeton Google chiffré côté serveur</li>
              <li>Connexion isolée par organisation</li>
              <li>Déconnexion disponible à tout moment</li>
            </ul>
          </aside>
        </section>
      ) : (
        <>
          <section className="mb-6 flex flex-col gap-4 border-l-2 border-teal bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-teal-dark">Compte connecté</p>
              <p className="mt-1 font-semibold text-navy">{status.googleAccountEmail ?? "Compte Google autorisé"}</p>
            </div>
            <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-teal-dark">
              Ouvrir Search Console <ExternalLink size={15} />
            </a>
          </section>

          {sites.length > 0 && (
            <section className="mb-6 border-t-2 border-orange bg-white px-5 py-5 shadow-sm">
              <h2 className="font-bold text-navy">Propriété analysée</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {sites.map((site) => (
                  <button
                    type="button"
                    key={site.siteUrl}
                    onClick={() => selectSite(site.siteUrl)}
                    disabled={busy || site.siteUrl === status.selectedSiteUrl}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-semibold ${site.siteUrl === status.selectedSiteUrl ? "border-teal bg-teal-light text-teal-dark" : "border-border text-navy hover:border-teal"}`}
                  >
                    {propertyLabel(site.siteUrl)}
                    {site.siteUrl === status.selectedSiteUrl ? " · active" : ""}
                  </button>
                ))}
              </div>
            </section>
          )}

          {!status.selectedSiteUrl ? (
            <div className="border-l-2 border-orange bg-orange-light/30 px-5 py-5 text-sm text-orange-dark">
              Sélectionnez une propriété Search Console pour charger ses données.
            </div>
          ) : performance ? (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Clics" value={number(performance.summary.clicks)} detail="Visites issues de Google" />
                <MetricCard label="Impressions" value={number(performance.summary.impressions)} detail="Apparitions dans les résultats" />
                <MetricCard label="CTR moyen" value={`${number(performance.summary.ctr * 100, 1)} %`} detail="Clics divisés par impressions" />
                <MetricCard label="Position moyenne" value={number(performance.summary.position, 1)} detail="Plus proche de 1 = mieux" />
              </div>

              <section className="mb-6 border-t-2 border-teal bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-navy">Évolution sur 28 jours</h2>
                    <p className="mt-1 text-xs text-muted">Du {performance.startDate} au {performance.endDate}</p>
                  </div>
                  <p className="text-xs text-muted">Dernière synchronisation : {new Date(performance.lastSyncedAt).toLocaleString("fr-FR")}</p>
                </div>
                {performance.daily.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted">Google ne dispose pas encore de données pour cette période.</p>
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performance.daily} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="key" tick={{ fontSize: 10 }} minTickGap={24} />
                        <YAxis yAxisId="clicks" tick={{ fontSize: 10 }} width={38} />
                        <YAxis yAxisId="impressions" orientation="right" tick={{ fontSize: 10 }} width={48} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="clicks" type="monotone" dataKey="clicks" name="Clics" stroke="#0F766E" strokeWidth={2} dot={false} />
                        <Line yAxisId="impressions" type="monotone" dataKey="impressions" name="Impressions" stroke="#F97316" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              <div className="grid gap-6 xl:grid-cols-2">
                <RankingTable title="Requêtes principales" rows={performance.topQueries} emptyLabel="Aucune requête disponible pour cette période." />
                <RankingTable title="Pages principales" rows={performance.topPages} emptyLabel="Aucune page disponible pour cette période." />
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
