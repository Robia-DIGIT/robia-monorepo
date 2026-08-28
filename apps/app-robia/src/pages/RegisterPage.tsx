import { useState, type FormEvent } from "react";
import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { register } from "../lib/api";
import { saveWorkspaceOnboarding, type WorkspaceRole } from "../lib/onboarding";

const MIN_PASSWORD_LENGTH = 8;
const fieldClass = "w-full rounded-lg border border-border bg-white py-3 pr-3 pl-10 text-sm text-dark outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-dark focus:ring-2 focus:ring-teal/15 disabled:bg-border-light";
const roles = [
  { value: "owner", label: "Propriétaire", detail: "Administre l’espace", icon: ShieldCheck },
  { value: "manager", label: "Responsable", detail: "Pilote les actions", icon: UserRound },
  { value: "member", label: "Membre", detail: "Collabore au suivi", icon: UsersRound },
] as const;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedCompany = company.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedName || !normalizedCompany || !normalizedEmail) { setError("Veuillez compléter votre identité, votre entreprise et votre adresse e-mail."); return; }
    if (password.length < MIN_PASSWORD_LENGTH) { setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`); return; }
    setError(""); setIsLoading(true);
    try { await register({ name: normalizedName, company: normalizedCompany, email: normalizedEmail, password }); saveWorkspaceOnboarding({ company: normalizedCompany, role }); navigate("/create-organization", { replace: true }); }
    catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : "Impossible de créer le compte."); }
    finally { setIsLoading(false); }
  };

  return <AuthShell eyebrow="Étape 1 · Création de l’espace" title="Présentez votre entreprise à ROBIA" description="Créez votre accès principal. À l’étape suivante, vous renseignerez l’établissement et le premier site à analyser." footerLabel="Déjà inscrit ?" footerLinkLabel="Se connecter" footerTo="/login">
    {error && <div role="alert" className="mb-5 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <fieldset><legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Identité de l’espace</legend><div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="mb-2 block text-xs font-bold text-navy">Nom complet</span><div className="relative"><UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input id="name" required autoComplete="name" disabled={isLoading} value={name} onChange={(event) => setName(event.target.value)} placeholder="Jean Dupont" className={fieldClass} /></div></label>
        <label className="block"><span className="mb-2 block text-xs font-bold text-navy">Entreprise</span><div className="relative"><Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input id="company" required autoComplete="organization" disabled={isLoading} value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Nom de l’entreprise" className={fieldClass} /></div></label>
      </div></fieldset>

      <fieldset><legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Votre rôle</legend><div className="grid gap-2 sm:grid-cols-3">{roles.map(({ value, label, detail, icon: Icon }) => <label key={value} className={`cursor-pointer border-l-2 px-3 py-3 transition-colors ${role === value ? "border-teal bg-teal-light/50" : "border-border bg-white hover:border-teal/50"}`}><input className="sr-only" type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} /><span className="flex items-center gap-2 text-xs font-bold text-navy"><Icon size={15} className={role === value ? "text-teal-dark" : "text-muted"} />{label}</span><span className="mt-1 block pl-[23px] text-[10px] text-muted">{detail}</span></label>)}</div></fieldset>

      <fieldset><legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Accès sécurisé</legend><div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="mb-2 block text-xs font-bold text-navy">E-mail professionnel</span><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input id="email" type="email" required autoComplete="email" disabled={isLoading} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@entreprise.fr" className={fieldClass} /></div></label>
        <label className="block"><span className="mb-2 flex items-center justify-between text-xs font-bold text-navy">Mot de passe<span className="font-normal text-muted">8 caractères min.</span></span><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input id="password" type={showPassword ? "text" : "password"} required autoComplete="new-password" disabled={isLoading} minLength={MIN_PASSWORD_LENGTH} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className={`${fieldClass} pr-11`} /><button type="button" onClick={() => setShowPassword((value) => !value)} disabled={isLoading} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-navy" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
      </div></fieldset>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center"><p className="max-w-xs text-[11px] leading-5 text-muted">Vous pourrez modifier les informations de l’entreprise et gérer les accès depuis votre profil.</p><button type="submit" disabled={isLoading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-dark disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto">{isLoading ? "Création en cours…" : "Continuer vers l’entreprise"}<ArrowRight size={16} /></button></div>
    </form>
    <div className="mt-5 border-t border-border pt-5 text-center">
      <p className="text-xs text-muted">Vous avez déjà un espace ROBIA ?</p>
      <Link to="/login" className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-navy px-4 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-navy hover:text-white">
        Se connecter
      </Link>
    </div>
  </AuthShell>;
}