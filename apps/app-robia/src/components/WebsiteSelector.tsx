import { Globe2 } from "lucide-react";
import { useWebsiteContext } from "./WebsiteContext";

export default function WebsiteSelector({ className = "" }: { className?: string }) {
  const { websites, activeWebsiteId, activeWebsite, loadingWebsites, setActiveWebsiteId } = useWebsiteContext();
  return <div className={`flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 ${className}`}>
    <Globe2 size={15} className="shrink-0 text-teal-dark" />
    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Contexte</span>
    <select aria-label="Site actif" value={activeWebsiteId} disabled={loadingWebsites || websites.length === 0} onChange={(event) => setActiveWebsiteId(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-dark outline-none disabled:text-muted">
      {websites.length === 0 ? <option value="">Aucun site configuré</option> : websites.map((website) => <option key={website.id} value={website.id}>{website.name || website.url}</option>)}
    </select>
    {activeWebsite?.url && <span className="hidden max-w-52 truncate text-[11px] text-muted xl:inline">{activeWebsite.url}</span>}
  </div>;
}