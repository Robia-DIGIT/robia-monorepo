import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import AuthShell from "../components/AuthShell";
import { register } from "../lib/api";

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    // Le mot de passe n'est volontairement pas "trim" : un espace en début/fin
    // fait partie du mot de passe choisi par l'utilisateur, le tronquer
    // silencieusement causerait un mismatch au login.
    const submittedPassword = password;
    if (submittedPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await register({
        email: normalizedEmail,
        password: submittedPassword,
      });
      navigate("/create-organization", { replace: true });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Impossible de créer le compte.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Création de compte"
      title="Inscrivez votre entreprise"
      description="Créez votre accès entreprise et démarrez avec les modules d'analyse, d'exécution et de pilotage."
      footerLabel="Déjà inscrit ?"
      footerLinkLabel="Se connecter"
      footerTo="/login"
    >
      {error && (
        <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
       

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-navy" htmlFor="email">
            Adresse e-mail professionnelle
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Mail className="h-4 w-4" />
            </span>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              disabled={isLoading}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jean.dupont@entreprise.fr"
              className="w-full rounded-xl border border-border bg-white px-9 py-3 text-sm text-dark outline-none transition-all placeholder:text-slate-400 focus:border-teal-dark focus:ring-4 focus:ring-teal/10 disabled:opacity-60"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-navy" htmlFor="password">
            Mot de passe
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Lock className="h-4 w-4" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              disabled={isLoading}
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-white px-9 py-3 pr-12 text-sm text-dark outline-none transition-all placeholder:text-slate-400 focus:border-teal-dark focus:ring-4 focus:ring-teal/10 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted transition-colors hover:text-navy disabled:opacity-60"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-[11px] text-muted">{MIN_PASSWORD_LENGTH} caractères minimum.</p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-dark px-4 py-3 text-sm font-bold text-white shadow-[0_18px_45px_rgba(20,184,166,0.28)] transition-all hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Création en cours..." : "Créer mon compte"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </AuthShell>
  );
}