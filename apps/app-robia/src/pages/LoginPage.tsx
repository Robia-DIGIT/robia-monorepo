import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import AuthShell from "../components/AuthShell";
import { login } from "../lib/api";

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

    if (!normalizedEmail || !normalizedPassword) {
      setError("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
      return;
    }

    if (normalizedEmail.length > 254 || normalizedPassword.length > 128) {
      setError("Les informations fournies sont trop longues.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await login({ email: normalizedEmail, password: normalizedPassword });
      navigate("/analyse", { replace: true });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Email ou mot de passe incorrect.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Accès sécurisé"
      title="Connexion à votre espace"
      description="Accédez à vos analyses, vos opportunités et votre IA conversationnelle en quelques secondes."
      footerLabel="Nouveau sur ROBIA ?"
      footerLinkLabel="Créer un compte entreprise"
      footerTo="/register"
    >
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-navy" htmlFor="email">
            Adresse e-mail
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Mail className="h-4 w-4" />
            </span>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="exemple@pme.fr"
              className="w-full rounded-xl border border-border bg-white px-9 py-3 text-sm text-dark outline-none transition-all placeholder:text-slate-400 focus:border-teal-dark focus:ring-4 focus:ring-teal/10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-bold text-navy" htmlFor="password">
              Mot de passe
            </label>
            <Link to="#" className="text-xs font-medium text-teal-dark hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Lock className="h-4 w-4" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-white px-9 py-3 pr-12 text-sm text-dark outline-none transition-all placeholder:text-slate-400 focus:border-teal-dark focus:ring-4 focus:ring-teal/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted transition-colors hover:text-navy"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-bold text-white shadow-[0_18px_45px_rgba(31,58,95,0.25)] transition-all hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Connexion en cours..." : "Se connecter"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </AuthShell>
  );
}