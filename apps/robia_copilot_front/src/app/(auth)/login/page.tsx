"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, ArrowRight, EyeOff, Eye } from "lucide-react";
import Image from "next/image";
import { FaFacebookF, FaGoogle, FaLinkedin } from "react-icons/fa";

import { persistAuthResponse } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "https://robia-back.vercel.app"}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }
      const data = await response.json();
      await new Promise((resolve) => setTimeout(resolve, 800));
      persistAuthResponse(data);
      router.replace("/onboarding");
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/35 p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Form area */}
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
            Connexion à votre éspace
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-navy" htmlFor="email">
                Adresse e-mail
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
                  placeholder="exemple@pme.fr"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label
                  className="text-xs font-bold text-navy"
                  htmlFor="password"
                >
                  Mot de passe
                </label>
                <Link href="#" className="text-xs text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
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
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white hover:bg-primary/95 text-sm font-bold rounded-lg shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              {isLoading ? "Connexion en cours..." : "Se connecter"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <div className="relative flex py-2 items-center">
            <div className="grow border-t border-gray-150"></div>
            <span className="shrink mx-4 text-gray-400 text-xs">
              Nouveau sur ROBIA ?
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

          {/* <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-150"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs">Nouveau sur ROBIA ?</span>
            <div className="flex-grow border-t border-gray-150"></div>
          </div> */}

          <Link
            href="/register"
            className="w-full flex items-center justify-center py-2.5 px-4 border border-navy/20 text-navy hover:bg-navy/5 text-sm font-bold rounded-lg transition-all cursor-pointer"
          >
            Créer un compte entreprise
          </Link>
        </div>
      </div>
    </div>
  );
}
