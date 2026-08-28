// oxlint-disable react/only-export-components
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { listWebsites, type Website } from "../lib/api";

const ACTIVE_WEBSITE_KEY = "robia_active_website_id";

interface WebsiteContextValue {
  websites: Website[];
  activeWebsiteId: string;
  activeWebsite: Website | null;
  loadingWebsites: boolean;
  setActiveWebsiteId: (id: string) => void;
  refreshWebsites: (preferredId?: string) => Promise<void>;
}

const WebsiteContext = createContext<WebsiteContextValue | null>(null);

export function WebsiteProvider({ children }: { children: ReactNode }) {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [activeWebsiteId, setActiveId] = useState(() => window.localStorage.getItem(ACTIVE_WEBSITE_KEY) ?? "");
  const [loadingWebsites, setLoadingWebsites] = useState(true);

  const setActiveWebsiteId = (id: string) => {
    setActiveId(id);
    if (id) window.localStorage.setItem(ACTIVE_WEBSITE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_WEBSITE_KEY);
  };

  const refreshWebsites = async (preferredId?: string) => {
    setLoadingWebsites(true);
    try {
      const items = await listWebsites();
      setWebsites(items);
      const storedId = preferredId || window.localStorage.getItem(ACTIVE_WEBSITE_KEY) || "";
      const nextId = items.some((item) => item.id === storedId) ? storedId : items[0]?.id ?? "";
      setActiveWebsiteId(nextId);
    } finally {
      setLoadingWebsites(false);
    }
  };

  useEffect(() => { void refreshWebsites(); }, []);

  const value = useMemo(() => ({
    websites,
    activeWebsiteId,
    activeWebsite: websites.find((item) => item.id === activeWebsiteId) ?? null,
    loadingWebsites,
    setActiveWebsiteId,
    refreshWebsites,
  }), [websites, activeWebsiteId, loadingWebsites]);

  return <WebsiteContext.Provider value={value}>{children}</WebsiteContext.Provider>;
}

export function useWebsiteContext() {
  const context = useContext(WebsiteContext);
  if (!context) throw new Error("useWebsiteContext doit être utilisé dans WebsiteProvider.");
  return context;
}