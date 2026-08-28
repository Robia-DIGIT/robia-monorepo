import { useState, type FormEvent } from "react";
import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AuthShell from "../components/AuthShell";
import { register } from "../lib/api";
import { saveWorkspaceOnboarding, type WorkspaceRole } from "../lib/onboarding";

const MIN_PASSWORD_LENGTH = 8;

const inputClass = "w-full rounded-xl border border-border bg-white py-3 pr-3 pl-9 text-sm text-dark outline-none transition-all placeholder:text-slate-400 focus:border-teal-dark focus:ring-4 focus:ring-teal/10 disabled:opacity-60";

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

    if (!normalizedName || !normalizedCompany || !normalizedEmail) {
      setError("Veuillez compléter votre identité, votre entreprise et votre adresse e-mail.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      await register({ name: normalizedName, company: normalizedCompany, email: normalizedEmail, password });
      saveWorkspaceOnboarding({ company: normalizedCompany, role });
      navigate("/create-organization", { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Impossible de créer le compte.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Création de compte"
      title="Créez votre espace de travail"
      description="Configurez votre accès, votre entreprise et votre rôle. Vous pourrez compléter la fiche entreprise à l'étape suivante."
      footerLabel="Déjà inscrit ?"
      footerLinkLabel="Se connecter"
      footerTo="/login"
    >
      {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy" htmlFor="name">Nom complet</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input id="name" required autoComplete="name" disabled={isLoading} value={name} onChange={(event) => setName(event.target.value)} placeholder="Jean Dupont" className={inputClass} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy" htmlFor="company">Entreprise</label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input id="company" required autoComplete="organization" disabled={isLoading} value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Mon entreprise" className={inputClass} />
            </div>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-bold text-navy">Votre rôle dans l’espace</legend>
          <div className="grid grid-cols-3 gap-2">
            {([["owner", "Propriétaire"], ["manager", "Responsable"], ["member", "Membre"]] as const).map(([value, label]) => (
              <label key={value} className={`cursor-pointer rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition-all ${role === value ? "border-teal-dark bg-teal-light text-teal-dark ring-2 ring-teal/10" : "border-border bg-white text-muted hover:border-teal/50"}`}>
                <input className="sr-only" type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} />
                {label}
              </label>
            ))}
          </div>
          <p className="text-[11px] text-muted">Le propriétaire administre l’entreprise et les accès. Ce choix pourra être modifié plus tard.</p>
        </fieldset>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-navy" htmlFor="email">Adresse e-mail professionnelle</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input id="email" type="email" required autoComplete="email" disabled={isLoading} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jean.dupont@entreprise.fr" className={inputClass} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-navy" htmlFor="password">Mot de passe</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input id="password" type={showPassword ? "text" : "password"} required autoComplete="new-password" disabled={isLoading} minLength={MIN_PASSWORD_LENGTH} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className={`${inputClass} pr-12`} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} disabled={isLoading} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted transition-colors hover:text-navy disabled:opacity-60" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-[11px] text-muted">{MIN_PASSWORD_LENGTH} caractères minimum.</p>
        </div>

        <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-dark px-4 py-3 text-sm font-bold text-white shadow-[0_18px_45px_rgba(20,184,166,0.28)] transition-all hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60">
          {isLoading ? "Création en cours..." : "Créer mon espace"}<ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </AuthShell>
  );
}