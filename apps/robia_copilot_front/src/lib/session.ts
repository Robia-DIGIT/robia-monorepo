const TOKEN_KEY = "token";
const WEBSITE_ID_KEY = "robia_website_id";
const AUDIT_ID_KEY = "robia_audit_id";
const GBP_CONNECTED_KEY = "robia_gbp_connected";

function getTokenStorage() {
  return window.sessionStorage;
}

export const sessionStore = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return getTokenStorage().getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    if (typeof window === "undefined") return;
    getTokenStorage().setItem(TOKEN_KEY, token);
  },

  clearToken() {
    if (typeof window === "undefined") return;
    getTokenStorage().removeItem(TOKEN_KEY);
  },

  clearSession() {
    if (typeof window === "undefined") return;
    getTokenStorage().removeItem(TOKEN_KEY);
    localStorage.removeItem(WEBSITE_ID_KEY);
    localStorage.removeItem(AUDIT_ID_KEY);
    localStorage.removeItem(GBP_CONNECTED_KEY);
  },

  getWebsiteId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(WEBSITE_ID_KEY);
  },

  setWebsiteId(id: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(WEBSITE_ID_KEY, id);
  },

  getAuditId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUDIT_ID_KEY);
  },

  setAuditId(id: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(AUDIT_ID_KEY, id);
  },

  isGbpConnected(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(GBP_CONNECTED_KEY) === "1";
  },

  setGbpConnected(connected: boolean) {
    if (typeof window === "undefined") return;
    localStorage.setItem(GBP_CONNECTED_KEY, connected ? "1" : "0");
  },
};
