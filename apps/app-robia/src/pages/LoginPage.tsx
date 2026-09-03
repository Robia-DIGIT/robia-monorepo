import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { login } from "../lib/api";

const fieldClass = "w-full rounded-lg border border-border bg-white py-3 pr-3 pl-10 text-sm text-dark outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-dark focus:ring-2 focus:ring-teal/15 disabled:bg-border-light";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    if (!normalizedEmail || !normalizedPassword) { setError("Veuillez renseigner votre adresse e-mail et votre mot de passe."); return; }
    if (normalizedEmail.length > 254 || normalizedPassword.length > 128) { setError("Les informations fournies sont trop longues."); return; }
    setError(""); setIsLoading(true);
    try { await login({ email: normalizedEmail, password: normalizedPassword }); navigate("/create-organization", { replace: true }); }
    catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : "Email ou mot de passe incorrect."); }
    finally { setIsLoading(false); }
  };

  return <AuthShell eyebrow="Accès sécurisé" title="Reprendre le pilotage" description="Retrouvez le site actif, ses signaux de visibilité et les prochaines actions recommandées par ROBIA." footerLabel="Nouveau sur ROBIA ?" footerLinkLabel="Créer un espace entreprise" footerTo="/register">
    {error && <div role="alert" className="mb-5 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block"><span className="mb-2 block text-xs font-bold text-navy">Adresse e-mail</span><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input id="email" type="email" required autoComplete="email" disabled={isLoading} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@entreprise.fr" className={fieldClass} /></div></label>
      <label className="block"><span className="mb-2 flex items-center justify-between text-xs font-bold text-navy">Mot de passe<Link to="/forgot-password" className="font-semibold text-teal-dark hover:underline">Mot de passe oublié ?</Link></span><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input id="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" disabled={isLoading} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className={`${fieldClass} pr-11`} /><button type="button" onClick={() => setShowPassword((value) => !value)} disabled={isLoading} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-navy" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
      <button type="submit" disabled={isLoading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-55">{isLoading ? "Connexion en cours…" : "Accéder à mon espace"}<ArrowRight size={16} /></button>
    </form>
    <div className="mt-5 border-t border-border pt-5 text-center">
      <p className="text-xs text-muted">Vous n’avez pas encore d’espace ROBIA ?</p>
      <Link to="/register" className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-navy px-4 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-navy hover:text-white">
        Créer un compte entreprise
      </Link>
    </div>
    <p className="mt-4 text-center text-[11px] leading-5 text-muted">Connexion sécurisée · Vos données restent associées à votre entreprise.</p>
  </AuthShell>;
}