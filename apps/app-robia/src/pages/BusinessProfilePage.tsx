import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, Check, ChevronDown, ChevronRight, ChevronUp, CircleAlert, Clock, ExternalLink, Eye, Globe, Link2, MapPin, Navigation, Plus, Radar, RefreshCw, Star, Store, Tag, Trash2, Unplug } from "lucide-react";
import {
  createBusinessLocation, deleteBusinessLocation, disconnectGoogleBusinessProfile,
  getCurrentOrganization, getGoogleBusinessProfileAuthorizationUrl, getGoogleBusinessProfilePerformance, getGoogleBusinessProfileStatus,
  importLegacyBusinessLocations,
  linkGoogleBusinessProfileLocation, listBusinessLocations, listGoogleBusinessProfileLocations, listGoogleBusinessProfileReviews,
  syncGoogleBusinessProfileLocations, syncGoogleBusinessProfileReviews, unlinkGoogleBusinessProfileLocation,
  type BusinessLocation, type GoogleBusinessProfileLocation, type GoogleBusinessProfilePerformance, type GoogleBusinessProfileReviewsEnvelope, type GoogleBusinessProfileStatus, type Organization,
} from "../lib/api";
import { clearLegacyBusinessProfile, readBusinessLocations } from "../lib/business-profile";

const EMPTY_LOCATION = { name: "", address: "", city: "", country: "Madagascar", phone: "" };
type LocationForm = typeof EMPTY_LOCATION;
const DISCONNECTED: GoogleBusinessProfileStatus = { connected: false, googleAccountEmail: null, connectedAt: null, lastSyncedAt: null, lastSyncAttemptAt: null, lastSyncStatus: "never", locationCount: 0, stale: false };

function Step({ number, title, active, done }: { number: number; title: string; active: boolean; done: boolean }) {
  return <div className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-teal text-white" : active ? "bg-navy text-white" : "bg-border-light text-muted"}`}>{done ? <Check size={14} /> : number}</span><span className={`text-xs font-semibold ${active ? "text-navy" : "text-muted"}`}>{title}</span></div>;
}

function googleAddress(value: Record<string, unknown> | null) {
  if (!value) return "Adresse non fournie par Google";
  const lines = Array.isArray(value.addressLines) ? value.addressLines.filter((item): item is string => typeof item === "string") : [];
  const suffix = [value.postalCode, value.locality, value.administrativeArea, value.regionCode].filter((item): item is string => typeof item === "string" && Boolean(item));
  return [...lines, ...suffix].join(", ") || "Adresse non fournie par Google";
}

/** Google's own Location.metadata.mapsUri — a direct link to the fiche on Google Maps, when Google provides one. */
function googleMapsUri(value: Record<string, unknown> | null) {
  const uri = value?.mapsUri;
  return typeof uri === "string" && uri.length > 0 ? uri : null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

function dayLabel(value: unknown): string {
  return typeof value === "string" ? (DAY_LABELS[value] ?? value) : "";
}

function formatClock(value: unknown): string {
  const time = value as { hours?: unknown; minutes?: unknown } | null | undefined;
  const hours = typeof time?.hours === "number" ? time.hours : 0;
  const minutes = typeof time?.minutes === "number" ? time.minutes : 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

interface RegularHourPeriod {
  openDay?: unknown;
  openTime?: unknown;
  closeDay?: unknown;
  closeTime?: unknown;
}

/** One line per period, e.g. "Lundi · 09:00 – 18:00" — grouped by their natural order in Google's own periods array. */
function formatRegularHours(value: Record<string, unknown> | null): { day: string; range: string }[] {
  const periods = Array.isArray(value?.periods) ? (value.periods as RegularHourPeriod[]) : [];
  return periods.map((period) => {
    const sameDay = period.closeDay === undefined || period.closeDay === period.openDay;
    const closeSuffix = sameDay ? "" : ` (${dayLabel(period.closeDay)})`;
    return {
      day: dayLabel(period.openDay),
      range: `${formatClock(period.openTime)} – ${formatClock(period.closeTime)}${closeSuffix}`,
    };
  });
}

function formatDateParts(value: unknown): string {
  const date = value as { year?: unknown; month?: unknown; day?: unknown } | null | undefined;
  if (typeof date?.year !== "number" || typeof date.month !== "number" || typeof date.day !== "number") return "";
  return `${String(date.day).padStart(2, "0")}/${String(date.month).padStart(2, "0")}/${date.year}`;
}

interface SpecialHourPeriod {
  startDate?: unknown;
  closed?: boolean;
  openTime?: unknown;
  closeTime?: unknown;
}

function formatSpecialHours(value: Record<string, unknown> | null): { date: string; label: string }[] {
  const periods = Array.isArray(value?.specialHourPeriods) ? (value.specialHourPeriods as SpecialHourPeriod[]) : [];
  return periods
    .map((period) => ({
      date: formatDateParts(period.startDate),
      label: period.closed ? "Fermé" : `${formatClock(period.openTime)} – ${formatClock(period.closeTime)}`,
    }))
    .filter((period) => period.date);
}

const MORE_HOURS_LABELS: Record<string, string> = {
  DELIVERY: "Livraison",
  DRIVE_THROUGH: "Drive",
  PICKUP: "Retrait",
  TAKEOUT: "À emporter",
  KITCHEN: "Cuisine",
  ONLINE_SERVICE_HOURS: "Service en ligne",
  ACCESS: "Accès",
  SENIOR_HOURS: "Horaires seniors",
};

function moreHoursLabel(id: unknown): string {
  return typeof id === "string" ? (MORE_HOURS_LABELS[id] ?? id) : "Horaires additionnels";
}

const SERVICE_AREA_LABELS: Record<string, string> = {
  CUSTOMER_LOCATION_ONLY: "Se déplace chez le client (pas de fiche visible en boutique)",
  CUSTOMER_AND_BUSINESS_LOCATION: "Se déplace chez le client et accueille sur place",
};

function formatServiceArea(value: Record<string, unknown> | null): { label: string | null; placeNames: string[] } | null {
  if (!value) return null;
  const businessType = value.businessType;
  const label = typeof businessType === "string" ? (SERVICE_AREA_LABELS[businessType] ?? businessType) : null;
  const places = value.places as { placeInfos?: { placeName?: unknown }[] } | undefined;
  const placeNames = Array.isArray(places?.placeInfos)
    ? places.placeInfos.map((place) => place.placeName).filter((name): name is string => typeof name === "string")
    : [];
  return { label, placeNames };
}

const OPEN_STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouvert",
  CLOSED_TEMPORARILY: "Fermé temporairement",
  CLOSED_PERMANENTLY: "Fermé définitivement",
};

function formatReviewDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("fr-FR");
}

/** A real timestamp (has its own time-of-day and zone), so converting to the
 * viewer's local time and formatting it is correct — unlike a bare "YYYY-MM-DD"
 * calendar date (see formatIsoDate below), there is no ambiguous day to shift. */
function formatDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("fr-FR");
}

/** RC-40 fix — parses a bare "YYYY-MM-DD" calendar date (Google's Performance
 * API day/period format) directly from its digits, never through `new
 * Date(string)`: that path treats the string as UTC midnight and then renders
 * it in the viewer's local timezone, which can shift the displayed day
 * backward or forward for negative-UTC-offset viewers. Returns "" for
 * anything that doesn't match, rather than crashing. */
function formatIsoDate(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/** RC-40 fix — Google's own avis, read-only: no reply UI is ever rendered
 * here. averageRating/totalReviewCount come straight from the backend
 * envelope (Google's own aggregate), never recomputed from the reviews
 * shown below. */
function ReviewsSection({ locationId }: { locationId: string }) {
  const [data, setData] = useState<GoogleBusinessProfileReviewsEnvelope | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await listGoogleBusinessProfileReviews(locationId)); }
    catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }, [locationId]);

  useEffect(() => { void load(); }, [load]);

  async function sync() {
    setLoading(true); setError("");
    try { await syncGoogleBusinessProfileReviews(locationId); await load(); }
    catch (err) { setError(errorMessage(err)); setLoading(false); }
  }

  const reviews = data?.reviews ?? [];
  const hasFreshData = data !== null && data.lastSyncedAt !== null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted"><Star size={12} />Avis Google</p>
        <button type="button" disabled={loading} onClick={() => void sync()} className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-dark disabled:opacity-50 hover:underline">
          <RefreshCw size={11} />Synchroniser les avis
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {loading && !data && <p className="text-xs text-muted">Chargement des avis…</p>}
      {data && !hasFreshData && (
        <p className="mb-2 text-xs text-muted">Avis jamais synchronisés ou expirés — cliquez sur « Synchroniser les avis ».</p>
      )}
      {data && hasFreshData && (data.totalReviewCount ?? 0) === 0 && (
        <p className="mb-2 text-xs text-muted">Aucun avis pour cette fiche.</p>
      )}
      {data && hasFreshData && (data.totalReviewCount ?? 0) > 0 && (
        <p className="mb-2 text-xs text-dark">
          <strong className="text-navy">{data.averageRating !== null ? `${data.averageRating.toFixed(1)}/5` : "—"}</strong>
          {" · "}{data.totalReviewCount} avis Google
          {data.totalReviewCount !== reviews.length && ` (${reviews.length} affiché${reviews.length > 1 ? "s" : ""})`}
        </p>
      )}
      {hasFreshData && (
        <p className="mb-2 text-[10px] text-muted">Dernière synchronisation : {formatDateTime(data!.lastSyncedAt)}</p>
      )}
      {reviews.length > 0 && (
        <ul className="max-h-56 space-y-3 overflow-y-auto pr-1">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-border/60 pb-2 last:border-0">
              <div className="flex items-center gap-2">
                {review.starRating !== null && <span className="text-[11px] font-bold text-orange-dark">{"★".repeat(review.starRating)}{"☆".repeat(5 - review.starRating)}</span>}
                <span className="text-xs font-semibold text-navy">{review.reviewerDisplayName ?? "Client Google"}</span>
                <span className="text-[10px] text-muted">{formatReviewDate(review.createTime)}</span>
              </div>
              {review.comment && <p className="mt-1 text-xs leading-relaxed text-dark">{review.comment}</p>}
              {review.replyComment && (
                <p className="mt-1.5 border-l-2 border-teal/40 pl-2 text-[11px] leading-relaxed text-muted">
                  <strong className="text-navy">Réponse du propriétaire :</strong> {review.replyComment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** RC-40 — live 30-day read from the Performance API; nothing persisted, matches the existing GA4 performance pattern. */
function PerformanceSection({ locationId }: { locationId: string }) {
  const [performance, setPerformance] = useState<GoogleBusinessProfilePerformance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDaily, setShowDaily] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try { setPerformance(await getGoogleBusinessProfilePerformance(locationId)); }
    catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted"><Eye size={12} />Performances (30 jours)</p>
        <button type="button" disabled={loading} onClick={() => void load()} className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-dark disabled:opacity-50 hover:underline">
          <RefreshCw size={11} />{performance ? "Actualiser" : "Charger"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {loading && !performance && <p className="text-xs text-muted">Chargement des statistiques…</p>}
      {!performance && !loading && !error && <p className="text-xs text-muted">Non chargées — Google n'est interrogé qu'à la demande.</p>}
      {performance && (
        <>
          <p className="mb-1.5 text-[10px] text-muted">
            Période : {formatIsoDate(performance.startDate)} → {formatIsoDate(performance.endDate)}
            {" · "}Récupéré le {formatDateTime(performance.syncedAt)}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-dark sm:grid-cols-3">
            <p><strong className="text-navy">{performance.summary.impressions}</strong> impressions</p>
            <p><strong className="text-navy">{performance.summary.calls}</strong> appels</p>
            <p><strong className="text-navy">{performance.summary.websiteClicks}</strong> clics site</p>
            <p><strong className="text-navy">{performance.summary.directionRequests}</strong> itinéraires</p>
            <p><strong className="text-navy">{performance.summary.conversations}</strong> messages</p>
          </div>
          <button type="button" onClick={() => setShowDaily((current) => !current)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-navy hover:underline">
            {showDaily ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {showDaily ? "Masquer le détail quotidien" : "Voir le détail quotidien"}
          </button>
          {showDaily && (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1 text-[11px] text-dark">
              {performance.daily.map((day) => (
                <li key={day.date} className="flex justify-between gap-2">
                  <span className="text-muted">{formatIsoDate(day.date)}</span>
                  <span>{day.impressions} impr. · {day.calls} appels · {day.websiteClicks} clics · {day.directionRequests} itin.</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function GoogleLocationCard({
  item,
  robiaLocations,
  busy,
  onMap,
}: {
  item: GoogleBusinessProfileLocation;
  robiaLocations: BusinessLocation[];
  busy: boolean;
  onMap: (googleLocationId: string, robiaLocationId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const mapsUri = googleMapsUri(item.metadata);
  const regularHours = formatRegularHours(item.regularHours);
  const specialHours = formatSpecialHours(item.specialHours);
  const moreHours = item.moreHours ?? [];
  const serviceArea = formatServiceArea(item.serviceArea);

  return (
    <article className="py-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-navy">{item.title}</h3>
            {item.openStatus && (
              <span className={`text-[10px] font-bold uppercase tracking-wide ${item.openStatus === "OPEN" ? "text-teal-dark" : "text-red-600"}`}>
                {OPEN_STATUS_LABELS[item.openStatus] ?? item.openStatus}
              </span>
            )}
            {item.primaryCategory && <span className="text-[10px] font-bold uppercase text-teal-dark">{item.primaryCategory}</span>}
            {item.storeCode && <span className="text-[10px] font-semibold text-muted">Code : {item.storeCode}</span>}
          </div>
          {item.accountDisplayName && <p className="mt-0.5 text-xs text-muted">Compte Google : {item.accountDisplayName}</p>}
          <p className="mt-1 text-sm text-muted">{googleAddress(item.address)}</p>
          {item.primaryPhone && <p className="mt-1 text-xs text-muted">{item.primaryPhone}</p>}
          <div className="mt-1.5 flex flex-wrap gap-3">
            {item.websiteUri && (
              <a href={item.websiteUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark hover:underline">
                <ExternalLink size={12} />Site web
              </a>
            )}
            {mapsUri && (
              <a href={mapsUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark hover:underline">
                <ExternalLink size={12} />Voir sur Google Maps
              </a>
            )}
            <button type="button" onClick={() => setExpanded((current) => !current)} className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline">
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Masquer les détails" : "Voir les détails de la fiche"}
            </button>
          </div>
        </div>
        <label className="min-w-64 text-xs font-bold text-navy">
          Associer à ROBIA
          <select disabled={busy} value={item.robiaLocationId ?? ""} onChange={(event) => onMap(item.id, event.target.value)} className="mt-1.5 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal">
            <option value="">Non associé</option>
            {robiaLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </label>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-5 rounded-lg border border-border bg-slate-bg p-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted"><Tag size={12} />Identité</p>
            {item.additionalCategories.length > 0 && (
              <p className="text-xs text-dark"><strong className="text-navy">Autres catégories :</strong> {item.additionalCategories.join(", ")}</p>
            )}
            {item.labels.length > 0 && (
              <p className="mt-1 text-xs text-dark"><strong className="text-navy">Étiquettes :</strong> {item.labels.join(", ")}</p>
            )}
            {item.languageCode && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Globe size={12} />Langue de la fiche : {item.languageCode}</p>
            )}
            {item.additionalPhones.length > 0 && (
              <p className="mt-1 text-xs text-dark"><strong className="text-navy">Autres téléphones :</strong> {item.additionalPhones.join(", ")}</p>
            )}
            {(item.latitude !== null && item.longitude !== null) && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Navigation size={12} />{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</p>
            )}
            {item.description && (
              <p className="mt-3 text-xs leading-relaxed text-dark">{item.description}</p>
            )}
            {serviceArea?.label && (
              <p className="mt-3 text-xs text-dark"><strong className="text-navy">Zone de service :</strong> {serviceArea.label}{serviceArea.placeNames.length > 0 ? ` (${serviceArea.placeNames.join(", ")})` : ""}</p>
            )}
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted"><Clock size={12} />Horaires</p>
            {regularHours.length === 0 && specialHours.length === 0 && moreHours.length === 0 ? (
              <p className="text-xs text-muted">Google n’a fourni aucun horaire pour cette fiche.</p>
            ) : (
              <>
                {regularHours.length > 0 && (
                  <ul className="space-y-0.5 text-xs text-dark">
                    {regularHours.map((period, index) => (
                      <li key={`${period.day}-${index}`}><strong className="text-navy">{period.day}</strong> · {period.range}</li>
                    ))}
                  </ul>
                )}
                {specialHours.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-navy">Horaires exceptionnels</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-dark">
                      {specialHours.map((period, index) => (
                        <li key={`${period.date}-${index}`}>{period.date} · {period.label}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {moreHours.length > 0 && (
                  <div className="mt-3">
                    {moreHours.map((entry, index) => {
                      const periods = formatRegularHours(entry as Record<string, unknown>);
                      return (
                        <div key={index} className="mt-2 first:mt-0">
                          <p className="text-xs font-bold text-navy">{moreHoursLabel((entry as { hoursTypeId?: unknown }).hoursTypeId)}</p>
                          <ul className="mt-1 space-y-0.5 text-xs text-dark">
                            {periods.map((period, periodIndex) => (
                              <li key={`${period.day}-${periodIndex}`}>{period.day} · {period.range}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t border-border pt-4 sm:col-span-2">
            <ReviewsSection locationId={item.id} />
          </div>

          <div className="border-t border-border pt-4 sm:col-span-2">
            <PerformanceSection locationId={item.id} />
          </div>
        </div>
      )}
    </article>
  );
}

export default function BusinessProfilePage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [connection, setConnection] = useState<GoogleBusinessProfileStatus>(DISCONNECTED);
  const [googleLocations, setGoogleLocations] = useState<GoogleBusinessProfileLocation[]>([]);
  const [form, setForm] = useState<LocationForm>(EMPTY_LOCATION);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"locations" | "google">("locations");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [currentOrganization, serverLocations, status] = await Promise.all([
      getCurrentOrganization(), listBusinessLocations(), getGoogleBusinessProfileStatus(),
    ]);
    let resolvedLocations = serverLocations;
    const legacy = readBusinessLocations();
    if (legacy.length > 0) {
      resolvedLocations = await importLegacyBusinessLocations(legacy.map((item) => ({
        legacyId: item.id,
        name: item.name,
        address: item.address,
        city: item.city,
        country: item.country,
        phone: item.phone,
        isPrimary: item.primary,
      })));
      clearLegacyBusinessProfile();
      setNotice("Vos établissements enregistrés dans ce navigateur ont été transférés vers ROBIA.");
    }
    setOrganization(currentOrganization);
    setLocations(resolvedLocations);
    setConnection(status);
    setShowForm(resolvedLocations.length === 0);
    setGoogleLocations(status.connected ? await listGoogleBusinessProfileLocations() : []);
  }, []);

  useEffect(() => {
    const oauthResult = new URLSearchParams(window.location.search).get("gbp");
    setLoading(true);
    load().then(async () => {
      if (oauthResult === "connected") {
        setTab("google"); setBusy(true);
        const result = await syncGoogleBusinessProfileLocations(); await load();
        setNotice(result.status === "partial"
          ? "Synchronisation incomplète, données précédentes conservées."
          : "Google Business Profile est connecté et les établissements ont été synchronisés.");
      } else if (oauthResult === "denied") {
        setTab("google"); setNotice("Connexion Google annulée. Aucune donnée n’a été importée.");
      } else if (oauthResult === "error") {
        setTab("google"); setNotice("La connexion Google n’a pas abouti. Vérifiez la configuration OAuth puis réessayez.");
      }
    }).catch((error) => setNotice(errorMessage(error))).finally(() => { setLoading(false); setBusy(false); });
    if (oauthResult) window.history.replaceState({}, "", window.location.pathname);
  }, [load]);

  const completeLocations = locations.length > 0;
  const profileProgress = useMemo(() => (completeLocations ? 50 : 0) + (connection.connected ? 50 : 0), [completeLocations, connection.connected]);

  async function addLocation(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      const created = await createBusinessLocation({ ...form, isPrimary: locations.length === 0 });
      setLocations((current) => [...current, created]); setForm(EMPTY_LOCATION); setShowForm(false);
      setNotice("Établissement enregistré dans ROBIA.");
    } catch (error) { setNotice(errorMessage(error)); } finally { setBusy(false); }
  }

  async function removeLocation(id: string) {
    if (!window.confirm("Supprimer cet établissement ROBIA ? Le profil Google ne sera pas modifié.")) return;
    setBusy(true);
    try { await deleteBusinessLocation(id); await load(); setNotice("Établissement supprimé de ROBIA. Aucune donnée Google n’a été modifiée."); }
    catch (error) { setNotice(errorMessage(error)); } finally { setBusy(false); }
  }

  async function connectGoogle() {
    setBusy(true);
    try { const { url } = await getGoogleBusinessProfileAuthorizationUrl(); window.location.assign(url); }
    catch (error) { setNotice(errorMessage(error)); setBusy(false); }
  }

  async function syncGoogle() {
    setBusy(true);
    try {
      const result = await syncGoogleBusinessProfileLocations(); await load();
      setNotice(result.status === "partial"
        ? "Synchronisation incomplète, données précédentes conservées."
        : `${result.locationCount} établissement${result.locationCount > 1 ? "s" : ""} Google synchronisé${result.locationCount > 1 ? "s" : ""}.`);
    } catch (error) { setNotice(errorMessage(error)); } finally { setBusy(false); }
  }

  async function disconnectGoogle() {
    if (!window.confirm("Déconnecter Google Business Profile de cette organisation ?")) return;
    setBusy(true);
    try { await disconnectGoogleBusinessProfile(); await load(); setNotice("Google Business Profile a été déconnecté et son cache ROBIA supprimé."); }
    catch (error) { setNotice(errorMessage(error)); } finally { setBusy(false); }
  }

  async function mapLocation(googleLocationId: string, robiaLocationId: string) {
    setBusy(true);
    try {
      if (robiaLocationId) await linkGoogleBusinessProfileLocation(googleLocationId, robiaLocationId);
      else await unlinkGoogleBusinessProfileLocation(googleLocationId);
      setGoogleLocations(await listGoogleBusinessProfileLocations()); setNotice("Association d’établissement mise à jour.");
    } catch (error) { setNotice(errorMessage(error)); } finally { setBusy(false); }
  }

  if (loading) return <div className="p-8 text-sm text-muted">Chargement du profil entreprise…</div>;

  return <div className="mx-auto max-w-7xl animate-slide-up p-5 md:p-6 lg:p-8">
    <header className="mb-7 border-b border-border pb-6"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark"><Radar size={15} /> Présence locale ROBIA</p><h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">Relier l’entreprise à ses lieux réels</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Configurez les établissements de {organization?.name ?? "votre entreprise"}, puis associez-les à Google Business Profile.</p></div><div className="min-w-64 border-l-2 border-teal pl-4"><div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-muted"><span>Configuration</span><span>{profileProgress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-border-light"><div className="h-full bg-teal transition-all" style={{ width: `${profileProgress}%` }} /></div></div></div></header>
    <div className="mb-6 flex flex-wrap items-center gap-3 border-y border-border py-4"><Step number={1} title="Entreprise" active={false} done={Boolean(organization)} /><ChevronRight size={14} className="text-border" /><Step number={2} title="Établissements" active={tab === "locations"} done={completeLocations} /><ChevronRight size={14} className="text-border" /><Step number={3} title="Google Business Profile" active={tab === "google"} done={connection.connected} /></div>
    {notice && <div role="status" className="mb-5 flex items-start gap-2 border-l-2 border-electric bg-electric-light px-4 py-3 text-sm text-electric-dark"><CircleAlert size={17} className="mt-0.5 shrink-0" /><span>{notice}</span><button className="ml-auto text-xs font-bold" onClick={() => setNotice("")}>Fermer</button></div>}
    <div className="mb-7 flex border-b border-border"><button onClick={() => setTab("locations")} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === "locations" ? "border-teal text-navy" : "border-transparent text-muted"}`}>Établissements</button><button onClick={() => setTab("google")} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === "google" ? "border-teal text-navy" : "border-transparent text-muted"}`}>Connecteur Google</button></div>

    {tab === "locations" ? <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section className="border-t-2 border-teal bg-white"><div className="flex items-center justify-between border-b border-border px-1 py-4"><div><h2 className="font-bold text-navy">Établissements ROBIA</h2><p className="mt-1 text-xs text-muted">Enregistrés côté serveur et partagés entre vos appareils.</p></div><button disabled={busy} onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-orange px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"><Plus size={15} />Ajouter</button></div><div className="divide-y divide-border">{locations.length === 0 ? <div className="p-10 text-center"><Store size={28} className="mx-auto mb-3 text-muted" /><p className="font-semibold text-navy">Aucun établissement</p><p className="mt-1 text-sm text-muted">Ajoutez l’adresse principale de votre entreprise.</p></div> : locations.map((location) => <article key={location.id} className="flex items-start gap-4 py-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-light text-teal-dark"><MapPin size={18} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-navy">{location.name}</h3>{location.isPrimary && <span className="text-[10px] font-bold uppercase tracking-wide text-teal-dark">Principal</span>}</div><p className="mt-1 text-sm text-muted">{[location.address, location.city, location.country].filter(Boolean).join(", ")}</p>{location.phone && <p className="mt-1 text-xs text-muted">{location.phone}</p>}</div><button disabled={busy} onClick={() => void removeLocation(location.id)} aria-label={`Supprimer ${location.name}`} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button></article>)}</div></section>
      <aside className="border-t border-border pt-5"><h2 className="font-bold text-navy">{showForm ? "Nouvel établissement" : "Profil entreprise"}</h2>{showForm ? <form onSubmit={(event) => void addLocation(event)} className="mt-4 space-y-3">{([['name','Nom public','Boutique Centre-ville'],['address','Adresse','12 avenue de l’Indépendance'],['city','Ville','Antananarivo'],['country','Pays','Madagascar'],['phone','Téléphone','+261 34 00 000 00']] as const).map(([field,label,placeholder]) => <label key={field} className="block"><span className="mb-1.5 block text-xs font-bold text-navy">{label}{field !== 'country' && field !== 'phone' ? ' *' : ''}</span><input required={field !== 'country' && field !== 'phone'} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} placeholder={placeholder} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-teal" /></label>)}<div className="flex gap-2 pt-2"><button disabled={busy} type="submit" className="flex-1 rounded-lg bg-navy py-2.5 text-sm font-bold text-white disabled:opacity-50">Enregistrer</button>{locations.length > 0 && <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-3 text-sm text-muted">Annuler</button>}</div></form> : <div className="mt-4 border-l-2 border-orange bg-orange-light/25 p-4"><Building2 size={20} className="text-orange-dark" /><h3 className="mt-3 font-bold text-navy">{organization?.name ?? "Entreprise"}</h3><p className="mt-1 text-sm text-muted">{locations.length} établissement{locations.length > 1 ? "s" : ""} configuré{locations.length > 1 ? "s" : ""}.</p><button onClick={() => setTab("google")} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-dark">Continuer vers Google <ChevronRight size={16} /></button></div>}</aside>
    </div> : <section className="grid gap-8 border-t-2 border-teal bg-white py-6 lg:grid-cols-[1fr_340px]">
      <div><div className="flex items-start justify-between gap-4"><div><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy text-lg font-bold text-white">G</div><h2 className="mt-5 text-xl font-bold text-navy">Google Business Profile</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted">Lecture seule : ROBIA importe vos établissements sans modifier vos fiches Google.</p></div>{connection.connected && <button disabled={busy} onClick={() => void syncGoogle()} className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><RefreshCw size={16} />Synchroniser</button>}</div>
        {!connection.connected ? <><div className="mt-6 space-y-3">{["Autoriser le compte Google", "Importer les établissements administrés", "Associer chaque lieu à ROBIA"].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-dark"><Check size={15} className="text-teal-dark" />{item}</div>)}</div><button onClick={() => void connectGoogle()} disabled={busy || !completeLocations} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Link2 size={16} />Connecter Google Business Profile</button>{!completeLocations && <p className="mt-2 text-xs text-orange-dark">Ajoutez au moins un établissement ROBIA avant de connecter Google.</p>}</> : <div className="mt-7 divide-y divide-border border-y border-border">{googleLocations.length === 0 ? <div className="py-8 text-center text-sm text-muted">Aucun établissement Google importé. Lancez une synchronisation.</div> : googleLocations.map((item) => <GoogleLocationCard key={item.id} item={item} robiaLocations={locations} busy={busy} onMap={(googleLocationId, robiaLocationId) => void mapLocation(googleLocationId, robiaLocationId)} />)}</div>}
      </div>
      <aside className="border-t border-border bg-slate-bg p-6 lg:border-l lg:border-t-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">État du connecteur</p><div className="mt-4 flex items-center gap-3 border-l-2 border-teal bg-white px-4 py-3"><span className={`h-3 w-3 rounded-full ${connection.connected ? "bg-teal" : "bg-slate-300"}`} /><div><p className="font-bold text-navy">{connection.connected ? "Connecté" : "Non connecté"}</p><p className="text-xs text-muted">{connection.googleAccountEmail ?? "Aucun compte Google autorisé"}</p></div></div>{connection.connected && <><div className="mt-4 space-y-2 text-xs text-muted"><p><strong className="text-navy">Établissements :</strong> {connection.locationCount}</p><p><strong className="text-navy">Dernière synchro réussie :</strong> {connection.lastSyncedAt ? new Date(connection.lastSyncedAt).toLocaleString("fr-FR") : "Jamais"}</p>{connection.lastSyncStatus !== "success" && connection.lastSyncStatus !== "never" && <p className="rounded-md bg-orange-light px-3 py-2 text-orange-dark">La dernière tentative est {connection.lastSyncStatus === "running" ? "en cours" : "incomplète"}. Les dernières données réussies sont conservées.</p>}{connection.stale && connection.lastSyncStatus === "success" && <p className="rounded-md bg-orange-light px-3 py-2 text-orange-dark">La resynchronisation automatique semble en échec depuis plus de 24h — les données affichées peuvent être obsolètes.</p>}<p>Mode strictement lecture seule.</p></div><button disabled={busy} onClick={() => void disconnectGoogle()} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-red-600"><Unplug size={15} />Déconnecter Google</button></>}</aside>
    </section>}
  </div>;
}
