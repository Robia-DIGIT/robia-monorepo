import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, Check, ChevronRight, CircleAlert, Link2, MapPin, Plus, RefreshCw, Store, Trash2, Unplug } from "lucide-react";
import { getCurrentOrganization, type Organization } from "../lib/api";
import {
  readBusinessLocations,
  readGoogleBusinessConnection,
  saveBusinessLocations,
  saveGoogleBusinessConnection,
  type BusinessLocation,
  type GoogleBusinessConnection,
} from "../lib/business-profile";

const EMPTY_LOCATION = { name: "", address: "", city: "", country: "Madagascar", phone: "" };
type LocationForm = typeof EMPTY_LOCATION;

function Step({ number, title, active, done }: { number: number; title: string; active: boolean; done: boolean }) {
  return <div className="flex items-center gap-2">
    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-teal text-white" : active ? "bg-navy text-white" : "bg-border-light text-muted"}`}>{done ? <Check size={14} /> : number}</span>
    <span className={`text-xs font-semibold ${active ? "text-navy" : "text-muted"}`}>{title}</span>
  </div>;
}

export default function BusinessProfilePage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [locations, setLocations] = useState<BusinessLocation[]>(readBusinessLocations);
  const [connection, setConnection] = useState<GoogleBusinessConnection>(readGoogleBusinessConnection);
  const [form, setForm] = useState<LocationForm>(EMPTY_LOCATION);
  const [showForm, setShowForm] = useState(() => locations.length === 0);
  const [tab, setTab] = useState<"locations" | "google">("locations");
  const [notice, setNotice] = useState("");

  useEffect(() => { getCurrentOrganization().then(setOrganization).catch(() => undefined); }, []);
  useEffect(() => { saveBusinessLocations(locations); }, [locations]);
  useEffect(() => { saveGoogleBusinessConnection(connection); }, [connection]);

  const completeLocations = locations.length > 0;
  const googleConnected = connection.status === "connected";
  const profileProgress = useMemo(() => (completeLocations ? 50 : 0) + (googleConnected ? 50 : 0), [completeLocations, googleConnected]);

  function update(field: keyof LocationForm, value: string) { setForm((current) => ({ ...current, [field]: value })); }

  function addLocation(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) return;
    const location: BusinessLocation = {
      id: crypto.randomUUID(), name: form.name.trim(), address: form.address.trim(), city: form.city.trim(),
      country: form.country.trim() || "Madagascar", phone: form.phone.trim(), primary: locations.length === 0,
    };
    setLocations((current) => [...current, location]);
    setForm(EMPTY_LOCATION); setShowForm(false); setNotice("Établissement ajouté au profil entreprise.");
  }

  function removeLocation(id: string) {
    setLocations((current) => {
      const next = current.filter((location) => location.id !== id);
      if (next.length && !next.some((location) => location.primary)) next[0] = { ...next[0], primary: true };
      return next;
    });
  }

  function prepareGoogleConnection() {
    setConnection({ status: "pending" });
    setNotice("Parcours OAuth préparé. L’endpoint backend Google doit maintenant fournir l’URL d’autorisation.");
  }

  function disconnectGoogle() { setConnection({ status: "disconnected" }); setNotice("Connecteur Google déconnecté de cet espace."); }

  return <div className="mx-auto w-full max-w-6xl p-5 md:p-8">
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-light px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-dark">MVP · P0</div>
        <h1 className="text-2xl font-bold text-dark">Business Profile</h1>
        <p className="mt-1 text-sm text-muted">Configurez les établissements de {organization?.name ?? "votre entreprise"} et reliez Google Business Profile.</p>
      </div>
      <div className="min-w-56 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold"><span>Configuration</span><span className="text-teal-dark">{profileProgress}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-border-light"><div className="h-full rounded-full bg-teal transition-all" style={{ width: `${profileProgress}%` }} /></div>
      </div>
    </div>

    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
      <Step number={1} title="Entreprise" active={false} done={Boolean(organization)} /><ChevronRight size={14} className="text-border" />
      <Step number={2} title="Établissements" active={tab === "locations"} done={completeLocations} /><ChevronRight size={14} className="text-border" />
      <Step number={3} title="Google Business Profile" active={tab === "google"} done={googleConnected} />
    </div>

    {notice && <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-electric/15 bg-electric-light p-3 text-sm text-electric-dark"><CircleAlert size={17} className="mt-0.5 shrink-0" /><span>{notice}</span><button className="ml-auto text-xs font-bold" onClick={() => setNotice("")}>Fermer</button></div>}

    <div className="mb-5 flex gap-1 rounded-xl bg-border-light p-1 md:w-fit">
      <button onClick={() => setTab("locations")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold md:flex-none ${tab === "locations" ? "bg-white text-navy shadow-sm" : "text-muted"}`}>Établissements</button>
      <button onClick={() => setTab("google")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold md:flex-none ${tab === "google" ? "bg-white text-navy shadow-sm" : "text-muted"}`}>Connecteur Google</button>
    </div>

    {tab === "locations" ? <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-bold text-dark">Vos établissements</h2><p className="mt-0.5 text-xs text-muted">Un profil distinct par adresse accueillant des clients.</p></div><button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-orange px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-dark"><Plus size={15} />Ajouter</button></div>
        <div className="divide-y divide-border-light">
          {locations.length === 0 ? <div className="p-10 text-center"><Store size={28} className="mx-auto mb-3 text-muted" /><p className="font-semibold text-dark">Aucun établissement</p><p className="mt-1 text-sm text-muted">Ajoutez l’adresse principale de votre entreprise.</p></div> : locations.map((location) => <article key={location.id} className="flex items-start gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-light text-teal-dark"><MapPin size={20} /></div>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-dark">{location.name}</h3>{location.primary && <span className="rounded-full bg-navy/8 px-2 py-0.5 text-[10px] font-bold text-navy">Principal</span>}</div><p className="mt-1 text-sm text-muted">{location.address}, {location.city}, {location.country}</p>{location.phone && <p className="mt-1 text-xs text-muted">{location.phone}</p>}</div>
            <button onClick={() => removeLocation(location.id)} aria-label={`Supprimer ${location.name}`} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
          </article>)}
        </div>
      </section>

      <aside className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="font-bold text-dark">{showForm ? "Nouvel établissement" : "Profil entreprise"}</h2>
        {showForm ? <form onSubmit={addLocation} className="mt-4 space-y-3">
          {([['name','Nom public','Boutique Centre-ville'],['address','Adresse','12 avenue de l’Indépendance'],['city','Ville','Antananarivo'],['country','Pays','Madagascar'],['phone','Téléphone','+261 34 00 000 00']] as const).map(([field,label,placeholder]) => <label key={field} className="block"><span className="mb-1.5 block text-xs font-bold text-navy">{label}{field !== 'country' && field !== 'phone' ? ' *' : ''}</span><input required={field !== 'country' && field !== 'phone'} value={form[field]} onChange={(event) => update(field,event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none focus:border-teal focus:ring-4 focus:ring-teal/10" /></label>)}
          <div className="flex gap-2 pt-2"><button type="submit" className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-bold text-white">Enregistrer</button>{locations.length > 0 && <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-3 text-sm text-muted">Annuler</button>}</div>
        </form> : <div className="mt-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-light text-orange-dark"><Building2 size={24} /></div><h3 className="mt-4 font-bold text-dark">{organization?.name ?? "Entreprise"}</h3><p className="mt-1 text-sm text-muted">{locations.length} établissement{locations.length > 1 ? "s" : ""} configuré{locations.length > 1 ? "s" : ""}.</p><button onClick={() => setTab("google")} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-dark">Continuer vers Google <ChevronRight size={16} /></button></div>}
      </aside>
    </div> : <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="grid lg:grid-cols-[1fr_360px]">
        <div className="p-6 md:p-8"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-border"><span className="text-2xl font-bold text-[#4285F4]">G</span></div><h2 className="mt-5 text-xl font-bold text-dark">Google Business Profile</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted">Connectez le compte Google qui administre vos fiches pour importer les établissements, synchroniser les informations et préparer les publications.</p>
          <div className="mt-6 space-y-3">{["Import des établissements Google", "Association avec les établissements ROBIA", "Synchronisation contrôlée des informations"].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-dark"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-light text-teal-dark"><Check size={13} /></span>{item}</div>)}</div>
          {connection.status === "connected" ? <button onClick={disconnectGoogle} className="mt-7 inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600"><Unplug size={16} />Déconnecter Google</button> : <button onClick={prepareGoogleConnection} disabled={!completeLocations} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#4285F4] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Link2 size={16} />{connection.status === "pending" ? "Reprendre la connexion Google" : "Connecter Google Business Profile"}</button>}
          {!completeLocations && <p className="mt-2 text-xs text-orange-dark">Ajoutez au moins un établissement avant de connecter Google.</p>}
        </div>
        <aside className="border-t border-border bg-slate-bg p-6 lg:border-t-0 lg:border-l"><p className="text-xs font-bold uppercase tracking-wide text-muted">État du connecteur</p><div className="mt-4 rounded-2xl border border-border bg-white p-5"><div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${googleConnected ? "bg-teal" : connection.status === "pending" ? "bg-orange" : "bg-slate-300"}`} /><div><p className="font-bold text-dark">{googleConnected ? "Connecté" : connection.status === "pending" ? "En attente d’OAuth" : "Non connecté"}</p><p className="text-xs text-muted">{googleConnected ? connection.accountEmail : "Aucun compte Google autorisé"}</p></div></div></div><div className="mt-4 rounded-xl border border-orange/20 bg-orange-light/60 p-4 text-xs leading-5 text-orange-dark"><strong>Backend requis.</strong> Le bouton prépare le parcours. La connexion réelle nécessite les identifiants Google OAuth et un endpoint serveur de callback.</div>{connection.status === "pending" && <button onClick={() => setConnection({ status: "disconnected" })} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-muted"><RefreshCw size={14} />Réinitialiser</button>}</aside>
      </div>
    </section>}
  </div>;
}