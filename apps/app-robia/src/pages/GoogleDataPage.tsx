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
  getGoogleAnalyticsPerformance,
  getSearchConsoleAuthorizationUrl,
  getSearchConsolePerformance,
  getSearchConsoleStatus,
  listGoogleAnalyticsProperties,
  listSearchConsoleSites,
  selectGoogleAnalyticsProperty,
  selectSearchConsoleSite,
  type GoogleAnalyticsPageMetric,
  type GoogleAnalyticsDailyMetric,
  type GoogleAnalyticsPerformance,
  type GoogleAnalyticsProperty,
  type SearchConsoleMetric,
  type SearchConsolePerformance,
  type SearchConsoleSite,
  type SearchConsoleStatus,
} from "../lib/api";

const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Une erreur inattendue est survenue.";
const propertyLabel = (value: string) =>
  value.startsWith("sc-domain:") ? value.slice(10) : value;
const number = (value: number, digits = 0) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(
    value,
  );

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
      <p className="mt-3 text-3xl font-bold tracking-tight text-navy">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </article>
  );
}

function SearchTable({
  title,
  rows,
}: {
  title: string;
  rows: SearchConsoleMetric[];
}) {
  return (
    <section className="overflow-hidden border-t-2 border-teal bg-white shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-bold text-navy">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted">
          Aucune donnée disponible pour cette période.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-bg text-[10px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Élément</th>
                <th className="px-3 py-3 text-right">Clics</th>
                <th className="px-3 py-3 text-right">Impressions</th>
                <th className="px-5 py-3 text-right">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.key}>
                  <td
                    className="max-w-sm truncate px-5 py-3 font-medium text-dark"
                    title={row.key}
                  >
                    {row.key || "—"}
                  </td>
                  <td className="px-3 py-3 text-right">{number(row.clicks)}</td>
                  <td className="px-3 py-3 text-right">
                    {number(row.impressions)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {number(row.position, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AnalyticsPages({ rows }: { rows: GoogleAnalyticsPageMetric[] }) {
  return (
    <section className="overflow-hidden border-t-2 border-orange bg-white shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-bold text-navy">Pages les plus consultées</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted">
          Aucune donnée disponible pour cette période.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-bg text-[10px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Page</th>
                <th className="px-3 py-3 text-right">Vues</th>
                <th className="px-3 py-3 text-right">Utilisateurs</th>
                <th className="px-5 py-3 text-right">Sessions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.path}>
                  <td
                    className="max-w-xl truncate px-5 py-3 font-medium text-dark"
                    title={row.path}
                  >
                    {row.path || "—"}
                  </td>
                  <td className="px-3 py-3 text-right">{number(row.views)}</td>
                  <td className="px-3 py-3 text-right">
                    {number(row.activeUsers)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {number(row.sessions)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TrendChart({
  data,
  analytics = false,
}: {
  data: Array<SearchConsoleMetric | GoogleAnalyticsDailyMetric>;
  analytics?: boolean;
}) {
  if (data.length === 0)
    return (
      <p className="py-10 text-center text-sm text-muted">
        Google ne dispose pas encore de données pour cette période.
      </p>
    );
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 12, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey={analytics ? "date" : "key"}
            tick={{ fontSize: 10 }}
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 10 }} width={38} />
          <Tooltip />
          <Legend />
          {analytics ? (
            <>
              <Line
                type="monotone"
                dataKey="activeUsers"
                name="Utilisateurs actifs"
                stroke="#0F766E"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke="#F97316"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="views"
                name="Vues"
                stroke="#1D4ED8"
                strokeWidth={2}
                dot={false}
              />
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="clicks"
                name="Clics"
                stroke="#0F766E"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="impressions"
                name="Impressions"
                stroke="#F97316"
                strokeWidth={2}
                dot={false}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function GoogleDataPage() {
  const oauthResult = new URLSearchParams(window.location.search).get("google");
  const [status, setStatus] = useState<SearchConsoleStatus | null>(null);
  const [sites, setSites] = useState<SearchConsoleSite[]>([]);
  const [searchData, setSearchData] = useState<SearchConsolePerformance | null>(
    null,
  );
  const [analyticsProperties, setAnalyticsProperties] = useState<
    GoogleAnalyticsProperty[]
  >([]);
  const [analyticsData, setAnalyticsData] =
    useState<GoogleAnalyticsPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(
    oauthResult === "connected"
      ? "Compte Google connecté. Les propriétés accessibles ont été chargées."
      : "",
  );
  const [error, setError] = useState(
    oauthResult === "denied"
      ? "Autorisation Google annulée. Aucune donnée n’a été modifiée."
      : oauthResult === "error"
        ? "La connexion Google n’a pas pu être terminée. Réessayez."
        : "",
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const current = await getSearchConsoleStatus();
      setStatus(current);
      if (!current.connected) {
        setSites([]);
        setSearchData(null);
        setAnalyticsProperties([]);
        setAnalyticsData(null);
        return;
      }
      const [availableSites, availableAnalytics] = await Promise.all([
        listSearchConsoleSites(),
        current.analyticsAuthorized
          ? listGoogleAnalyticsProperties()
          : Promise.resolve([]),
      ]);
      setSites(availableSites);
      setAnalyticsProperties(availableAnalytics);
      const [search, analytics] = await Promise.all([
        current.selectedSiteUrl
          ? getSearchConsolePerformance()
          : Promise.resolve(null),
        current.analyticsAuthorized && current.selectedAnalyticsPropertyId
          ? getGoogleAnalyticsPerformance()
          : Promise.resolve(null),
      ]);
      setSearchData(search);
      setAnalyticsData(analytics);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (oauthResult)
      window.history.replaceState({}, "", window.location.pathname);
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, oauthResult]);

  async function connect() {
    setBusy(true);
    setError("");
    try {
      const { url } = await getSearchConsoleAuthorizationUrl();
      window.location.assign(url);
    } catch (reason) {
      setError(errorMessage(reason));
      setBusy(false);
    }
  }
  async function selectSite(siteUrl: string) {
    setBusy(true);
    setError("");
    try {
      await selectSearchConsoleSite(siteUrl);
      setNotice(
        `Propriété Search Console ${propertyLabel(siteUrl)} sélectionnée.`,
      );
      await load();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  async function selectAnalytics(property: GoogleAnalyticsProperty) {
    setBusy(true);
    setError("");
    try {
      await selectGoogleAnalyticsProperty(property.propertyId);
      setNotice(`Propriété Analytics ${property.displayName} sélectionnée.`);
      await load();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      const [search, analytics] = await Promise.all([
        status?.selectedSiteUrl
          ? getSearchConsolePerformance()
          : Promise.resolve(null),
        status?.analyticsAuthorized && status.selectedAnalyticsPropertyId
          ? getGoogleAnalyticsPerformance()
          : Promise.resolve(null),
      ]);
      setSearchData(search);
      setAnalyticsData(analytics);
      setNotice("Données Google actualisées.");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  async function disconnect() {
    if (
      !window.confirm(
        "Déconnecter Search Console et Analytics de cette organisation ?",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await disconnectSearchConsole();
      setNotice("Le compte Google a été déconnecté.");
      await load();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted">
        <LoaderCircle className="mr-2 animate-spin" size={18} />
        Chargement des données Google…
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl animate-slide-up p-5 md:p-6 lg:p-8">
      <header className="mb-7 flex flex-col justify-between gap-5 border-b border-border pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark">
            <BarChart3 size={15} /> Données Google
          </p>
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">
            Search Console et Analytics
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Suivez votre visibilité Google et l’utilisation du site avec des
            accès strictement en lecture seule.
          </p>
        </div>
        {status?.connected && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={
                busy ||
                (!status.selectedSiteUrl && !status.selectedAnalyticsPropertyId)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
              Actualiser
            </button>
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600"
            >
              <Unplug size={16} />
              Déconnecter
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white">
              <Search size={22} />
            </div>
            <h2 className="mt-5 text-xl font-bold text-navy">
              Connecter les services Google
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Autorisez ROBIA à consulter Search Console et Google Analytics.
              ROBIA ne peut ni modifier votre site, ni publier du contenu.
            </p>
            <button
              type="button"
              onClick={connect}
              disabled={busy}
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white"
            >
              <Link2 size={16} />
              Se connecter avec Google
            </button>
          </div>
          <aside className="border-t border-border bg-slate-bg p-7 lg:border-l lg:border-t-0">
            <ShieldCheck className="text-teal-dark" size={24} />
            <h3 className="mt-4 font-bold text-navy">Accès contrôlé</h3>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
              <li>Lecture seule Search Console et Analytics</li>
              <li>Jeton Google chiffré côté serveur</li>
              <li>Connexion isolée par organisation</li>
              <li>Déconnexion disponible à tout moment</li>
            </ul>
          </aside>
        </section>
      ) : (
        <>
          <section className="mb-8 flex flex-col gap-4 border-l-2 border-teal bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-teal-dark">
                Compte connecté
              </p>
              <p className="mt-1 font-semibold text-navy">
                {status.googleAccountEmail ?? "Compte Google autorisé"}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-teal-dark"
              >
                Search Console <ExternalLink size={15} />
              </a>
              <a
                href="https://analytics.google.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-teal-dark"
              >
                Google Analytics <ExternalLink size={15} />
              </a>
            </div>
          </section>
          <section className="mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-dark">
              Search Console
            </p>
            <h2 className="mb-4 mt-1 text-xl font-bold text-navy">
              Visibilité dans les résultats Google
            </h2>
            {sites.length > 0 && (
              <div className="mb-6 border-t-2 border-orange bg-white px-5 py-5 shadow-sm">
                <h3 className="font-bold text-navy">
                  Propriété Search Console
                </h3>
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
                      {site.siteUrl === status.selectedSiteUrl
                        ? " · active"
                        : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!status.selectedSiteUrl ? (
              <div className="border-l-2 border-orange bg-orange-light/30 px-5 py-5 text-sm text-orange-dark">
                Sélectionnez une propriété Search Console.
              </div>
            ) : (
              searchData && (
                <>
                  <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      label="Clics"
                      value={number(searchData.summary.clicks)}
                      detail="Visites issues de Google"
                    />
                    <MetricCard
                      label="Impressions"
                      value={number(searchData.summary.impressions)}
                      detail="Apparitions dans les résultats"
                    />
                    <MetricCard
                      label="CTR moyen"
                      value={`${number(searchData.summary.ctr * 100, 1)} %`}
                      detail="Clics divisés par impressions"
                    />
                    <MetricCard
                      label="Position moyenne"
                      value={number(searchData.summary.position, 1)}
                      detail="Plus proche de 1 = mieux"
                    />
                  </div>
                  <section className="mb-6 border-t-2 border-teal bg-white p-5 shadow-sm">
                    <h3 className="font-bold text-navy">
                      Évolution Search Console sur 28 jours
                    </h3>
                    <p className="mb-5 mt-1 text-xs text-muted">
                      Du {searchData.startDate} au {searchData.endDate}
                    </p>
                    <TrendChart data={searchData.daily} />
                  </section>
                  <div className="grid gap-6 xl:grid-cols-2">
                    <SearchTable
                      title="Requêtes principales"
                      rows={searchData.topQueries}
                    />
                    <SearchTable
                      title="Pages principales"
                      rows={searchData.topPages}
                    />
                  </div>
                </>
              )
            )}
          </section>
          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-dark">
              Google Analytics 4
            </p>
            <h2 className="mb-4 mt-1 text-xl font-bold text-navy">
              Audience et utilisation du site
            </h2>
            {!status.analyticsAuthorized ? (
              <div className="border-l-2 border-orange bg-white px-5 py-5 shadow-sm">
                <h3 className="font-bold text-navy">
                  Autorisation Analytics requise
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Reconnectez le même compte pour ajouter uniquement Analytics
                  en lecture seule. Search Console restera connecté.
                </p>
                <button
                  type="button"
                  onClick={connect}
                  disabled={busy}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white"
                >
                  <Link2 size={16} />
                  Autoriser Google Analytics
                </button>
              </div>
            ) : (
              <>
                {analyticsProperties.length > 0 ? (
                  <div className="mb-6 border-t-2 border-orange bg-white px-5 py-5 shadow-sm">
                    <h3 className="font-bold text-navy">
                      Propriété Google Analytics
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {analyticsProperties.map((property) => (
                        <button
                          type="button"
                          key={property.propertyId}
                          onClick={() => selectAnalytics(property)}
                          disabled={
                            busy ||
                            property.propertyId ===
                              status.selectedAnalyticsPropertyId
                          }
                          className={`rounded-lg border px-4 py-2.5 text-left text-sm font-semibold ${property.propertyId === status.selectedAnalyticsPropertyId ? "border-orange bg-orange-light/30 text-orange-dark" : "border-border text-navy hover:border-orange"}`}
                        >
                          {property.displayName}
                          <span className="block text-[10px] font-normal text-muted">
                            ID {property.propertyId}
                            {property.accountName
                              ? ` · ${property.accountName}`
                              : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 border-l-2 border-orange bg-orange-light/30 px-5 py-5 text-sm text-orange-dark">
                    Aucune propriété Google Analytics accessible.
                  </div>
                )}
                {!status.selectedAnalyticsPropertyId ? (
                  <div className="border-l-2 border-orange bg-orange-light/30 px-5 py-5 text-sm text-orange-dark">
                    Sélectionnez une propriété Google Analytics.
                  </div>
                ) : (
                  analyticsData && (
                    <>
                      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                          label="Utilisateurs actifs"
                          value={number(analyticsData.summary.activeUsers)}
                          detail="Audience active sur 28 jours"
                        />
                        <MetricCard
                          label="Sessions"
                          value={number(analyticsData.summary.sessions)}
                          detail="Sessions enregistrées"
                        />
                        <MetricCard
                          label="Vues"
                          value={number(analyticsData.summary.views)}
                          detail="Pages et écrans consultés"
                        />
                        <MetricCard
                          label="Taux d’engagement"
                          value={`${number(analyticsData.summary.engagementRate * 100, 1)} %`}
                          detail="Part des sessions engagées"
                        />
                      </div>
                      <section className="mb-6 border-t-2 border-orange bg-white p-5 shadow-sm">
                        <h3 className="font-bold text-navy">
                          Évolution Analytics sur 28 jours
                        </h3>
                        <p className="mb-5 mt-1 text-xs text-muted">
                          Du {analyticsData.startDate} au{" "}
                          {analyticsData.endDate}
                        </p>
                        <TrendChart data={analyticsData.daily} analytics />
                      </section>
                      <AnalyticsPages rows={analyticsData.topPages} />
                    </>
                  )
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
