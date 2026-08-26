"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Mail,
  Lock,
  User,
  Briefcase,
  ArrowRight,
  EyeOff,
  Eye,
} from "lucide-react";
import { FaFacebookF, FaGoogle, FaLinkedin } from "react-icons/fa";
import Image from "next/image";

import { persistAuthResponse } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "https://robia-back.vercel.app"}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!response.ok) {
        let message = "Impossible de créer le compte.";
        try {
          const body = await response.json();
          if (typeof body.message === "string") message = body.message;
          else if (Array.isArray(body.message)) message = body.message.join(", ");
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      const data = await response.json();
      await new Promise((resolve) => setTimeout(resolve, 800));
      persistAuthResponse(data);
      router.replace("/onboarding");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de créer le compte.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/35 p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="flex justify-center">
            <Image
              src="/logo_robia_copilot.svg"
              alt="ROBIA Copilot"
              width={83}
              height={83}
              priority
            />
          </div>
          <h2 className="text-xl font-bold text-navy text-center">
            Inscrivez votre entreprise
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* <div className="space-y-1">
              <label className="text-xs font-bold text-navy" htmlFor="name">
                Nom complet
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-light-slate">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div> */}

            {/* <div className="space-y-1">
              <label className="text-xs font-bold text-navy" htmlFor="company">
                Nom de la PME
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-light-slate">
                  <Briefcase className="h-4 w-4" />
                </span>
                <input
                  id="company"
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Entreprise SAS"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div> */}

            <div className="space-y-1">
              <label className="text-xs font-bold text-navy" htmlFor="email">
                Adresse e-mail professionnelle
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-light-slate">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean.dupont@entreprise.fr"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-navy" htmlFor="password">
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-light-slate">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
          absolute inset-y-0 right-0 flex items-center pr-3
          text-slate-500 hover:text-slate-700
          transition-colors duration-200 cursor-pointer
            border-none
        "
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  title={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-accent text-white hover:bg-accent/95 text-sm font-bold rounded-lg shadow-md shadow-accent/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? "Création en cours..." : "Créer mon compte"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="grow border-t border-gray-150"></div>
            <span className="shrink mx-4 text-gray-400 text-xs">
              ou connectez avec
            </span>
            <div className="grow border-t border-gray-150"></div>
          </div>
          <div className="flex justify-center items-center space-x-9">
            <Link href="/login" className="">
              <FaGoogle className=" text-navy h-5 w-5 " />
            </Link>
            <Link href="/login" className="">
              <FaFacebookF className="text-navy h-5 w-5 " />
            </Link>
            <Link href="/login" className="">
              <FaLinkedin className="text-navy h-5 w-5 " />
            </Link>
          </div>

          <p className="text-center text-xs text-light-slate">
            Déjà inscrit ?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
