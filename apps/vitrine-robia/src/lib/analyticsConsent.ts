export const ANALYTICS_CONSENT_KEY = "robia_analytics_consent";
export const OPEN_COOKIE_SETTINGS_EVENT = "robia:open-cookie-settings";

export type AnalyticsConsentChoice = "granted" | "denied" | null;

export function getStoredAnalyticsConsent(): AnalyticsConsentChoice {
  const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function openCookieSettings(): void {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
