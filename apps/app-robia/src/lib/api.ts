import {
  clearAuthResponse,
  getStoredAccessToken,
  persistAuthResponse,
} from "./auth";

const apiBaseUrl =
  import.meta.env.VITE_API_URL ?? "https://robia-back.vercel.app";

type Primitive = string | number | boolean | null | undefined;

export interface ApiErrorPayload {
  message?: unknown;
  error?: unknown;
  statusCode?: unknown;
}

export interface UserSummary {
  id: string;
  name?: string;
  email: string;
  company?: string;
}

export interface AuthResponse {
  accessToken: string;
  token?: string;
  user?: UserSummary;
}

export interface UserProfile {
  id: string;
  email: string;
  phone: string;
  company: string | null;
  bio: string | null;
  provider: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  sector: string | null;
  city: string | null;
  country: string | null;
  ownerId: string;
  createdAt: string;
}

export interface BillingSubscription {
  plan: "starter" | "pro" | string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canManage: boolean;
}

export interface Website {
  id: string;
  url: string;
  name?: string;
  status?: string;
  organizationId?: string;
  createdAt?: string;
}

export interface SearchConsoleStatus {
  connected: boolean;
  googleAccountEmail: string | null;
  selectedSiteUrl: string | null;
  permissionLevel: string | null;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  selectedAnalyticsPropertyId: string | null;
  selectedAnalyticsPropertyName: string | null;
  lastAnalyticsSyncedAt: string | null;
  analyticsAuthorized: boolean;
}

export interface GoogleAnalyticsProperty {
  propertyId: string;
  displayName: string;
  accountName: string;
  propertyType: string;
  selected: boolean;
}

export interface GoogleAnalyticsDailyMetric {
  date: string;
  activeUsers: number;
  sessions: number;
  views: number;
}

export interface GoogleAnalyticsPageMetric {
  path: string;
  views: number;
  activeUsers: number;
  sessions: number;
}

export interface GoogleAnalyticsPerformance {
  propertyId: string;
  propertyName: string | null;
  startDate: string;
  endDate: string;
  summary: {
    activeUsers: number;
    totalUsers: number;
    sessions: number;
    views: number;
    engagementRate: number;
  };
  daily: GoogleAnalyticsDailyMetric[];
  topPages: GoogleAnalyticsPageMetric[];
  lastSyncedAt: string;
}

export interface SearchConsoleSite {
  siteUrl: string;
  permissionLevel: string;
  selected: boolean;
}

export interface SearchConsoleMetric {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsolePerformance {
  siteUrl: string;
  startDate: string;
  endDate: string;
  summary: Omit<SearchConsoleMetric, "key">;
  daily: SearchConsoleMetric[];
  topQueries: SearchConsoleMetric[];
  topPages: SearchConsoleMetric[];
  lastSyncedAt: string;
}

export interface AuditSubscores {
  local: number;
  content: number;
  technical: number;
  performance: number;
  ai_readiness: number;
}

// PageSpeed Insights contract — mirrors Robia-Back's app.integrations.pagespeed
// (RC-10, PR #24, SHA 79809b0). Do not add fields here that RC-10 doesn't
// produce: absent Google fields stay absent/null, they are never invented
// client-side.
export interface PageSpeedMetrics {
  lcpMs: number | null;
  cls: number | null;
  /** Lab proxy for interactivity (Total Blocking Time) — not a Core Web Vital. */
  tbtMs: number | null;
  fcpMs: number | null;
}

export type PageSpeedStatus = "ok" | "unavailable";

export interface PageSpeedInsightsResult {
  status: PageSpeedStatus;
  strategy: "mobile";
  performanceScore: number | null;
  metrics: PageSpeedMetrics;
  fetchedAt: string;
  analyzedUrl: string;
  finalUrl: string | null;
  source: string;
  unavailableReason: string | null;
}

// Explainable SEO score V2 (RC-12, PR #25 as drafted — not yet merged, not
// yet Codex-reviewed as of this writing). Purely additive alongside
// global_score/subscores: renders next to the legacy score, never replaces
// it — whether/how the displayed score migrates to v2 is an explicit,
// separate product decision (see RC-12's PR body), not decided here.
export interface SeoCategoryScoreV2 {
  score: number | null;
  weight: number | null;
  measured: boolean;
  findingsEvaluated: number;
}

export interface SeoScoreV2 {
  version: string;
  globalScore: number | null;
  categories: Record<string, SeoCategoryScoreV2>;
}

// Search Console signals attached to an audit (RC-13, PR #28 as drafted —
// not yet merged). A stale-but-real snapshot of whatever the dashboard's
// "Google Data" page last synced — never a live call made during the
// audit itself. 'unavailable' with a reason is a normal, expected value
// (not connected / no property selected / nothing synced in 28 days),
// never an error to surface as such.
export type SearchConsoleAuditSignalsStatus = "ok" | "unavailable";

export interface AuditSearchConsoleSignals {
  status: SearchConsoleAuditSignalsStatus;
  source: "search_console";
  siteUrl: string | null;
  period: { startDate: string; endDate: string } | null;
  summary: Omit<SearchConsoleMetric, "key"> | null;
  lastSyncedAt: string | null;
  unavailableReason:
    | "not_connected"
    | "no_property_selected"
    | "not_synced_recently"
    | "temporarily_unavailable"
    | null;
}

export interface AuditResultJson {
  summary: string;
  subscores: AuditSubscores;
  global_score: number;
  missing_data: string[];
  // Multi-page v2 audit payload (see Robia-Back audits.service.ts `run()`).
  site_audit?: {
    pagespeed_insights?: PageSpeedInsightsResult | null;
    seo_score_v2?: SeoScoreV2 | null;
  };
  // Top-level, not nested in site_audit — matches where RC-13 actually
  // attaches it in audits.service.ts.
  google_search_console?: AuditSearchConsoleSignals | null;
}

export type AuditStatus = "completed" | "pending" | "failed" | string;

export interface Audit {
  id: string;
  organizationId: string;
  websiteId: string;
  status: AuditStatus;
  globalScore: number;
  resultJson: AuditResultJson;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export type OpportunityStatus =
  "open" | "in_progress" | "done" | "closed" | string;

export interface FindingEvidence {
  url: string;
  observed: string;
  expected: string;
}

export interface OpportunitySourceDataV2 {
  version?: number;
  summary?: string;
  ruleCode?: string;
  severity?: "critical" | "high" | "medium" | "low" | "info" | string;
  auditStatus?: string;
  priorityScore?: number;
  affectedUrls?: string[];
  evidence?: FindingEvidence[];
  whyItMatters?: string;
  recommendedSteps?: string[];
}

export interface Opportunity {
  id: string;
  organizationId: string;
  auditId: string;
  title: string;
  description: string;
  category: string;
  impactScore: number;
  effortScore: number;
  confidenceScore: number;
  sourceData: string | OpportunitySourceDataV2;
  status: OpportunityStatus;
  createdAt: string;
}

export type DocumentType =
  | "local_page"
  | "faq"
  | "meta"
  | "gbp_post"
  | "review_reply"
  | "dev_brief"
  | "checklist"
  | string;

export interface DocumentItem {
  id: string;
  opportunityId: string;
  type: DocumentType;
  title?: string;
  content: string;
  organizationId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ValidationActionType = "publish" | "update" | "reply" | string;
export type ValidationPlatform =
  "google_business" | "facebook" | "website" | string;
export type ValidationStatus =
  "pending" | "approved" | "rejected" | "published" | string;

export interface ValidationLog {
  id: string;
  documentId: string;
  actionType: ValidationActionType;
  platform: ValidationPlatform;
  status: ValidationStatus;
  createdAt: string;
  organizationId?: string;
}

export type ActionStatus =
  "todo" | "in_progress" | "done" | "blocked" | "ignored" | string;

export interface ActionItem {
  id: string;
  opportunityId: string;
  title: string;
  status: ActionStatus;
  priority: string;
  priorityScore?: number;
  sequence?: number;
  dueDate: string | null;
  description?: string;
  affectedUrls?: string[];
  evidence?: FindingEvidence[];
  validationCriteria?: string;
  organizationId?: string;
  createdAt?: string;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
  responseType?: "json" | "text" | "blob";
  query?: Record<string, Primitive>;
}

function buildUrl(path: string, query?: Record<string, Primitive>) {
  const url = new URL(path, apiBaseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function handleUnauthorized() {
  clearAuthResponse();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function parseErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const body = (await response.json()) as ApiErrorPayload;
    const candidates = [body.message, body.error];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate) {
        return candidate;
      }

      if (Array.isArray(candidate)) {
        return candidate.join(", ");
      }
    }
  } catch {}

  return fallbackMessage;
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const {
    auth = true,
    responseType = "json",
    headers,
    query,
    ...rest
  } = options;
  const requestHeaders = new Headers(headers);

  requestHeaders.set("X-Requested-With", "XMLHttpRequest");
  requestHeaders.set("Accept", "application/json");

  if (auth) {
    const token = getStoredAccessToken();

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      ...rest,
      headers: requestHeaders,
    });
  } catch (networkError) {
    const message =
      networkError instanceof Error ? networkError.message.toLowerCase() : "";
    if (
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("cors")
    ) {
      throw new Error(
        "Impossible de contacter le serveur ROBIA. Vérifiez votre connexion ou réessayez dans quelques instants.",
      );
    }
    throw new Error("Une erreur réseau est survenue.");
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
  }

  if (response.status === 429) {
    throw new Error(
      "Trop de requêtes ont été envoyées. Veuillez patienter avant de réessayer.",
    );
  }

  if (response.status >= 500) {
    throw new Error(
      "Erreur serveur ROBIA (5xx). Notre équipe est prévenue — réessayez dans quelques minutes.",
    );
  }

  if (response.status === 404) {
    throw new Error(
      "Ressource introuvable (404). Il est possible que cette donnée ne soit pas encore synchronisée.",
    );
  }

  if (response.status === 403) {
    throw new Error(
      "Accès refusé. Vous n'avez pas les permissions nécessaires pour cette action.",
    );
  }

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Une erreur est survenue."),
    );
  }

  if (responseType === "text") {
    return (await response.text()) as T;
  }

  if (responseType === "blob") {
    return (await response.blob()) as T;
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function auditScore(audit: Audit | null | undefined): number {
  if (!audit) return 0;
  return asNumber(
    audit.globalScore,
    asNumber(audit.resultJson?.global_score, 0),
  );
}

export function auditSubscores(
  audit: Audit | null | undefined,
): AuditSubscores | null {
  if (!audit?.resultJson?.subscores) return null;
  return audit.resultJson.subscores;
}

export function auditSummary(audit: Audit | null | undefined): string {
  return audit?.resultJson?.summary ?? "";
}

export function auditMissingData(audit: Audit | null | undefined): string[] {
  return audit?.resultJson?.missing_data ?? [];
}

export function auditPageSpeedInsights(
  audit: Audit | null | undefined,
): PageSpeedInsightsResult | null {
  return audit?.resultJson?.site_audit?.pagespeed_insights ?? null;
}

export function auditSeoScoreV2(
  audit: Audit | null | undefined,
): SeoScoreV2 | null {
  return audit?.resultJson?.site_audit?.seo_score_v2 ?? null;
}

export function auditGoogleSearchConsole(
  audit: Audit | null | undefined,
): AuditSearchConsoleSignals | null {
  return audit?.resultJson?.google_search_console ?? null;
}

export function oppImpact(opp: Opportunity | null | undefined): number {
  return asNumber(opp?.impactScore, 0);
}

export function oppEffort(opp: Opportunity | null | undefined): number {
  return asNumber(opp?.effortScore, 0);
}

export function oppIsDone(opp: Opportunity | null | undefined): boolean {
  const s = (opp?.status ?? "").toLowerCase();
  return s === "done" || s === "closed" || s === "completed";
}

export function actionStatusLabel(status: ActionStatus): {
  label: string;
  badge: "teal" | "blue" | "gray" | "red";
} {
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("completed") || s === "actif")
    return { label: "Terminé", badge: "teal" };
  if (s.includes("progress") || s.includes("en_cours"))
    return { label: "En cours", badge: "blue" };
  if (s.includes("blocked")) return { label: "Bloqué", badge: "red" };
  if (s.includes("ignored")) return { label: "Ignoré", badge: "gray" };
  if (s.includes("error") || s.includes("fail") || s.includes("reject"))
    return { label: "Erreur", badge: "red" };
  if (s === "todo" || s.includes("planned") || s.includes("pend"))
    return { label: "À faire", badge: "blue" };
  return { label: status || "Planifié", badge: "gray" };
}

export function actionProgressPct(status: ActionStatus): number {
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("completed")) return 100;
  if (s.includes("progress")) return 50;
  if (s.includes("blocked")) return 0;
  if (s.includes("ignored")) return 0;
  if (s.includes("error") || s.includes("fail") || s.includes("reject"))
    return 0;
  return 0;
}

export function opportunitySourceData(
  opp: Opportunity | null | undefined,
): OpportunitySourceDataV2 {
  return opp?.sourceData && typeof opp.sourceData === "object"
    ? opp.sourceData
    : {};
}

export function oppPriorityScore(opp: Opportunity | null | undefined): number {
  const score = opportunitySourceData(opp).priorityScore;
  return typeof score === "number" && Number.isFinite(score)
    ? score
    : Math.min(100, Math.max(0, oppImpact(opp) * 10));
}

export function oppPriority(opp: Opportunity | null | undefined): {
  label: "Critique" | "Haute" | "Moyenne" | "Faible";
  variant: "orange" | "blue" | "gray";
} {
  const severity = opportunitySourceData(opp).severity;
  if (severity === "critical") return { label: "Critique", variant: "orange" };
  if (severity === "high") return { label: "Haute", variant: "orange" };
  if (severity === "medium") return { label: "Moyenne", variant: "blue" };
  if (severity === "low" || severity === "info") return { label: "Faible", variant: "gray" };
  return oppPriorityLabel(oppPriorityScore(opp));
}

export function oppPriorityLabel(impactScore: number): {
  label: "Critique" | "Haute" | "Moyenne" | "Faible";
  variant: "orange" | "blue" | "gray";
} {
  if (impactScore >= 80) return { label: "Critique", variant: "orange" };
  if (impactScore >= 60) return { label: "Haute", variant: "orange" };
  if (impactScore >= 40) return { label: "Moyenne", variant: "blue" };
  return { label: "Faible", variant: "gray" };
}

export function effortLabel(score: number): string {
  if (score >= 80) return "Élevé";
  if (score >= 50) return "Moyen";
  return "Faible";
}

export function groupOpportunitiesByCategory(
  opps: Opportunity[],
): { category: string; items: Opportunity[] }[] {
  const map = new Map<string, Opportunity[]>();
  for (const opp of opps) {
    const cat = opp.category?.trim() || "Divers";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(opp);
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

export async function login(payload: { email: string; password: string }) {
  const data = await request<AuthResponse>("/auth/login", {
    method: "POST",
    auth: false,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  persistAuthResponse(data);
  return data;
}

export async function forgotPassword(payload: { email: string }) {
  return request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    auth: false,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: {
  token: string;
  password: string;
}) {
  return request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    auth: false,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function register(payload: {
  name?: string;
  company?: string;
  email: string;
  password: string;
}) {
  const data = await request<AuthResponse>("/auth/register", {
    method: "POST",
    auth: false,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  persistAuthResponse(data);
  return data;
}

export async function getCurrentUser() {
  return request<UserSummary>("/auth/me");
}

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    clearAuthResponse();
  }
}

export async function createOrganization(payload: Partial<Organization>) {
  return request<Organization>("/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getCurrentOrganization() {
  return request<Organization>("/organizations/current");
}

export async function getSearchConsoleStatus() {
  return request<SearchConsoleStatus>(
    "/integrations/google/search-console/status",
  );
}

export async function getSearchConsoleAuthorizationUrl() {
  return request<{ url: string }>(
    "/integrations/google/search-console/authorize",
    { credentials: "include" },
  );
}

export async function listSearchConsoleSites() {
  return request<SearchConsoleSite[]>(
    "/integrations/google/search-console/sites",
  );
}

export async function selectSearchConsoleSite(siteUrl: string) {
  return request<{ selectedSiteUrl: string; permissionLevel: string }>(
    "/integrations/google/search-console/site",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteUrl }),
    },
  );
}

export async function getSearchConsolePerformance() {
  return request<SearchConsolePerformance>(
    "/integrations/google/search-console/performance",
  );
}

export async function listGoogleAnalyticsProperties() {
  return request<GoogleAnalyticsProperty[]>(
    "/integrations/google/search-console/analytics/properties",
  );
}

export async function selectGoogleAnalyticsProperty(propertyId: string) {
  return request<GoogleAnalyticsProperty>(
    "/integrations/google/search-console/analytics/property",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId }),
    },
  );
}

export async function getGoogleAnalyticsPerformance() {
  return request<GoogleAnalyticsPerformance>(
    "/integrations/google/search-console/analytics/performance",
  );
}

export async function disconnectSearchConsole() {
  return request<{ disconnected: boolean }>(
    "/integrations/google/search-console",
    { method: "DELETE" },
  );
}

export async function updateCurrentOrganization(
  payload: Partial<Organization>,
) {
  return request<Organization>("/organizations/current", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createWebsite(payload: { url: string }) {
  return request<Website>("/websites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listWebsites() {
  return request<Website[]>("/websites");
}

export async function getWebsite(id: string) {
  return request<Website>(`/websites/${encodeURIComponent(id)}`);
}

export async function runAudit(payload: { websiteId: string }) {
  return request<Audit>("/audits/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listAudits(websiteId?: string) {
  return request<Audit[]>("/audits", {
    query: websiteId ? { website_id: websiteId } : undefined,
  });
}

export async function getLatestAudit(websiteId?: string) {
  return request<Audit>("/audits/latest", {
    query: websiteId ? { website_id: websiteId } : undefined,
  });
}

export async function getAudit(id: string) {
  return request<Audit>(`/audits/${encodeURIComponent(id)}`);
}

export async function generateOpportunities(payload: { auditId: string }) {
  return request<Opportunity[]>("/opportunities/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listOpportunities(auditId?: string) {
  return request<Opportunity[]>("/opportunities", {
    query: auditId ? { audit_id: auditId } : undefined,
  });
}

export async function getOpportunity(id: string) {
  return request<Opportunity>(`/opportunities/${encodeURIComponent(id)}`);
}

export async function updateOpportunityStatus(id: string, status: string) {
  return request<Opportunity>(`/opportunities/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function generateDocument(payload: {
  opportunityId: string;
  type: string;
}) {
  return request<DocumentItem>("/documents/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listDocuments(opportunityId?: string) {
  return request<DocumentItem[]>("/documents", {
    query: opportunityId ? { opportunity_id: opportunityId } : undefined,
  });
}

export async function getDocument(id: string) {
  return request<DocumentItem>(`/documents/${encodeURIComponent(id)}`);
}

export async function updateDocument(
  id: string,
  payload: Partial<DocumentItem>,
) {
  return request<DocumentItem>(`/documents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createValidation(payload: {
  documentId: string;
  actionType: string;
  platform: string;
  status: string;
}) {
  return request<ValidationLog>("/validations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listValidations() {
  return request<ValidationLog[]>("/validations");
}

export async function generateActions(opportunityId: string) {
  return request<ActionItem[]>("/actions/generate", {
    method: "POST",
    query: { opportunity_id: opportunityId },
  });
}

export async function listActions(websiteId?: string) {
  return request<ActionItem[]>("/actions", {
    query: websiteId ? { website_id: websiteId } : undefined,
  });
}

export async function exportActionPlan(websiteId?: string) {
  return request<Blob>("/actions/export", {
    responseType: "blob",
    query: websiteId ? { website_id: websiteId } : undefined,
  });
}

export async function updateActionStatus(id: string, status: string) {
  return request<ActionItem>(`/actions/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export { apiBaseUrl, request, parseErrorMessage };

export function getMe(): Promise<UserProfile> {
  return request<UserProfile>("/users/me");
}

export function updateMe(patch: Partial<UserProfile>): Promise<UserProfile> {
  return request<UserProfile>("/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export function getBillingSubscription(): Promise<BillingSubscription> {
  return request<BillingSubscription>("/billing/subscription");
}

export function createCheckoutSession(
  billingPeriod: "monthly" | "annual",
): Promise<{ url: string }> {
  return request<{ url: string }>("/billing/checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ billingPeriod }),
  });
}

export function createBillingPortalSession(): Promise<{ url: string }> {
  return request<{ url: string }>("/billing/portal-session", {
    method: "POST",
  });
}
