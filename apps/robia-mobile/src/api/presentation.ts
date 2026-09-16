/** Shared user-facing labels, never inferred from whether a value is truthy. */
export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', edited: 'Modifié', validated: 'Validé', approved: 'Approuvé',
  rejected: 'Rejeté', needs_review: 'À vérifier',
};
export const ACTION_STATUS_LABELS: Record<string, string> = {
  todo: 'À faire', in_progress: 'En cours', done: 'Terminée', blocked: 'Bloquée', ignored: 'Ignorée',
};
export const AUDIT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', running: 'Analyse en cours', completed: 'Terminé', failed: 'Échec',
};
export const PROVIDER_LABELS: Record<string, string> = {
  seo: 'Diagnostic SEO', pagespeed: 'Vitesse des pages', search_console: 'Recherche Google',
  ga4: 'Google Analytics', meta: 'Facebook et Instagram', gbp: 'Fiche Google', ops: 'Automatisations',
};
export const PROVIDER_STATUS_LABELS: Record<string, string> = {
  ok: 'À jour', partial: 'Données partielles', not_connected: 'Non connecté',
  not_configured: 'Configuration à terminer', unavailable: 'Données indisponibles',
};
export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
export function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}
export function isSiteAudit(result: Record<string, unknown> | null): boolean {
  return (!!result?.site_audit && typeof result.site_audit === 'object') || Array.isArray(result?.pages) || Array.isArray(result?.detailed_findings);
}
export function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim();
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : 'https://' + trimmed;
  let parsed: URL;
  try { parsed = new URL(candidate); } catch { throw new Error('Renseignez une adresse de site valide.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.') || parsed.username || parsed.password) {
    throw new Error('Utilisez une adresse de site HTTP ou HTTPS sans identifiants.');
  }
  parsed.hash = '';
  return parsed.toString();
}

export function siteAudit(result: Record<string, unknown> | null) {
  const nested = record(result?.site_audit);
  return Object.keys(nested).length ? nested : record(result);
}
export function auditScore(audit: { globalScore: number | null; resultJson: Record<string, unknown> | null } | null | undefined) {
  const legacy = numberOrNull(audit?.globalScore);
  if (legacy !== null) return { value: legacy, label: 'Score de visibilité' };
  const score = record(siteAudit(audit?.resultJson ?? null).seo_score_v2);
  return { value: numberOrNull(score.globalScore), label: 'Score SEO' };
}
