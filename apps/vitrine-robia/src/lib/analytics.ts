const GA_MEASUREMENT_ID = "G-4038R4ZGK9";

type AnalyticsParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag(): void {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    ((...args: unknown[]) => {
      window.dataLayer?.push(args);
    });
}

export function enableAnalytics(): void {
  if (typeof window === "undefined") return;

  ensureGtag();
  window.gtag?.("consent", "update", { analytics_storage: "granted" });
  window.gtag?.("js", new Date());
  window.gtag?.("config", GA_MEASUREMENT_ID, { anonymize_ip: true });

  if (!document.querySelector('script[data-robia-ga4="true"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.dataset.robiaGa4 = "true";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }
}

export function disableAnalytics(): void {
  if (typeof window === "undefined") return;

  window.gtag?.("consent", "update", { analytics_storage: "denied" });

  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (name === "_ga" || name?.startsWith("_ga_")) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.robiacopilot.site; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }
  });
}

export function trackEvent(
  eventName: string,
  params: AnalyticsParams = {},
): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}
