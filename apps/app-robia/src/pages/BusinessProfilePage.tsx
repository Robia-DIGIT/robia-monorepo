import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, Check, ChevronRight, CircleAlert, ExternalLink, Link2, MapPin, Plus, Radar, RefreshCw, Store, Trash2, Unplug } from "lucide-react";
import {
  createBusinessLocation, deleteBusinessLocation, disconnectGoogleBusinessProfile,
  getCurrentOrganization, getGoogleBusinessProfileAuthorizationUrl, getGoogleBusinessProfileStatus,
  linkGoogleBusinessProfileLocation, listBusinessLocations, listGoogleBusinessProfileLocations,
  syncGoogleBusinessProfileLocations, unlinkGoogleBusinessProfileLocation,
  type BusinessLocation, type GoogleBusinessProfileLocation, type GoogleBusinessProfileStatus, type Organization,
} from "../lib/api";
import { clearLegacyBusinessProfile, readBusinessLocations } from "../lib/business-profile";

const EMPTY_LOCATION = { name: "", address: "", city: "", country: "Madagascar", phone: "" };
type LocationForm = typeof EMPTY_LOCATION;
const DISCONNECTED: GoogleBusinessProfileStatus = { connected: false, googleAccountEmail: null, connectedAt: null, lastSyncedAt: null, locationCount: 0 };

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
    if (serverLocations.length === 0 && legacy.length > 0) {
      resolvedLocations = [];
      for (const item of legacy) {
        resolvedLocations.push(await createBusinessLocation({
          name: item.name, address: item.address, city: item.city, country: item.country,
          phone: item.phone, isPrimary: item.primary,
        }));
      }
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
        await syncGoogleBusinessProfileLocations(); await load();
        setNotice("Google Business Profile est connecté et les établissements ont été synchronisés.");
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
      setNotice(`${result.locationCount} établissement${result.locationCount > 1 ? "s" : ""} Google synchronisé${result.locationCount > 1 ? "s" : ""}.`);
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
        {!connection.connected ? <><div className="mt-6 space-y-3">{["Autoriser le compte Google", "Importer les établissements administrés", "Associer chaque lieu à ROBIA"].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-dark"><Check size={15} className="text-teal-dark" />{item}</div>)}</div><button onClick={() => void connectGoogle()} disabled={busy || !completeLocations} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Link2 size={16} />Connecter Google Business Profile</button>{!completeLocations && <p className="mt-2 text-xs text-orange-dark">Ajoutez au moins un établissement ROBIA avant de connecter Google.</p>}</> : <div className="mt-7 divide-y divide-border border-y border-border">{googleLocations.length === 0 ? <div className="py-8 text-center text-sm text-muted">Aucun établissement Google importé. Lancez une synchronisation.</div> : googleLocations.map((item) => { const mapsUri = googleMapsUri(item.metadata); return <article key={item.id} className="py-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-navy">{item.title}</h3>{item.primaryCategory && <span className="text-[10px] font-bold uppercase text-teal-dark">{item.primaryCategory}</span>}{item.storeCode && <span className="text-[10px] font-semibold text-muted">Code : {item.storeCode}</span>}</div>{item.accountDisplayName && <p className="mt-0.5 text-xs text-muted">Compte Google : {item.accountDisplayName}</p>}<p className="mt-1 text-sm text-muted">{googleAddress(item.address)}</p>{item.primaryPhone && <p className="mt-1 text-xs text-muted">{item.primaryPhone}</p>}<div className="mt-1.5 flex flex-wrap gap-3">{item.websiteUri && <a href={item.websiteUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark hover:underline"><ExternalLink size={12} />Site web</a>}{mapsUri && <a href={mapsUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark hover:underline"><ExternalLink size={12} />Voir sur Google Maps</a>}</div></div><label className="min-w-64 text-xs font-bold text-navy">Associer à ROBIA<select disabled={busy} value={item.robiaLocationId ?? ""} onChange={(event) => void mapLocation(item.id, event.target.value)} className="mt-1.5 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal"><option value="">Non associé</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label></div></article>; })}</div>}
      </div>
      <aside className="border-t border-border bg-slate-bg p-6 lg:border-l lg:border-t-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">État du connecteur</p><div className="mt-4 flex items-center gap-3 border-l-2 border-teal bg-white px-4 py-3"><span className={`h-3 w-3 rounded-full ${connection.connected ? "bg-teal" : "bg-slate-300"}`} /><div><p className="font-bold text-navy">{connection.connected ? "Connecté" : "Non connecté"}</p><p className="text-xs text-muted">{connection.googleAccountEmail ?? "Aucun compte Google autorisé"}</p></div></div>{connection.connected && <><div className="mt-4 space-y-2 text-xs text-muted"><p><strong className="text-navy">Établissements :</strong> {connection.locationCount}</p><p><strong className="text-navy">Dernière synchro :</strong> {connection.lastSyncedAt ? new Date(connection.lastSyncedAt).toLocaleString("fr-FR") : "Jamais"}</p><p>Mode strictement lecture seule.</p></div><button disabled={busy} onClick={() => void disconnectGoogle()} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-red-600"><Unplug size={15} />Déconnecter Google</button></>}</aside>
    </section>}
  </div>;
}
