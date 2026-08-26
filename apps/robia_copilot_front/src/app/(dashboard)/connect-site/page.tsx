"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, HelpCircle, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { useConnectSite, useProfile } from "@/hooks/api";
import { PageLoader } from "@/components/ui/page-states";

export default function ConnectSitePage() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const connectSite = useConnectSite();
  const [connectionMethod, setConnectionMethod] = useState<"dns" | "meta">("dns");
  const [verificationState, setVerificationState] = useState<"idle" | "verifying" | "success" | "error">("idle");

  const startVerification = async () => {
    if (!profile?.website) return;
    setVerificationState("verifying");
    try {
      await connectSite.mutateAsync(profile.website);
      setVerificationState("success");
    } catch {
      setVerificationState("error");
    }
  };

  if (isLoading) {
    return <PageLoader rows={4} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-extrabold text-navy">Étape 2: Connexion de votre site</h1>
        <p className="text-sm text-light-slate">
          Connectez votre site web de manière sécurisée pour analyser sa structure sémantique et vérifier l&apos;indexation de vos pages.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="h-2.5 w-12 rounded-full bg-primary" />
          <span className="h-2.5 w-12 rounded-full bg-primary" />
          <span className="h-2.5 w-12 rounded-full bg-gray-200" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8 space-y-6">
        <div className="flex border-b border-gray-150">
          <button
            onClick={() => {
              setConnectionMethod("dns");
              setVerificationState("idle");
            }}
            className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all cursor-pointer ${
              connectionMethod === "dns"
                ? "border-primary text-navy font-extrabold"
                : "border-transparent text-light-slate hover:text-navy"
            }`}
          >
            Enregistrement DNS TXT (Recommandé)
          </button>
          <button
            onClick={() => {
              setConnectionMethod("meta");
              setVerificationState("idle");
            }}
            className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all cursor-pointer ${
              connectionMethod === "meta"
                ? "border-primary text-navy font-extrabold"
                : "border-transparent text-light-slate hover:text-navy"
            }`}
          >
            Balise HTML Meta
          </button>
        </div>

        {connectionMethod === "dns" ? (
          <div className="space-y-4">
            <p className="text-xs text-light-slate">
              Ajoutez l&apos;enregistrement TXT suivant à la configuration DNS de votre nom de domaine chez votre hébergeur (OVH, GoDaddy, Gandi, etc.) :
            </p>
            <div className="bg-secondary/40 border border-accent/10 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span className="font-bold text-navy">Type :</span>
                <span className="col-span-2 text-dark-slate">TXT</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span className="font-bold text-navy">Hôte / Nom :</span>
                <span className="col-span-2 text-dark-slate">@ ou vide</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span className="font-bold text-navy">Valeur TXT :</span>
                <span className="col-span-2 font-mono text-[11px] bg-white border border-gray-200 px-2 py-1 rounded select-all cursor-pointer text-accent">
                  robia-site-verification=8fh9d2k8s0fhw9u3h
                </span>
              </div>
            </div>
            <p className="text-[10px] text-light-slate flex items-start gap-1">
              <HelpCircle className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
              La propagation DNS peut prendre de quelques minutes à 24 heures.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-light-slate">
              Copiez la balise meta suivante et collez-la dans la section <code className="text-accent">&lt;head&gt;</code> du code source de votre page d&apos;accueil :
            </p>
            <div className="bg-secondary/40 border border-accent/10 rounded-lg p-4 font-mono text-[11px] text-accent select-all cursor-pointer border-dashed">
              &lt;meta name="robia-site-verification" content="8fh9d2k8s0fhw9u3h" /&gt;
            </div>
            <p className="text-[10px] text-light-slate flex items-start gap-1">
              <HelpCircle className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
              Assurez-vous que la balise est visible publiquement sans nécessiter de connexion utilisateur.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-4">
          {verificationState === "idle" && (
            <button
              onClick={startVerification}
              disabled={!profile?.website}
              className="flex items-center gap-2 py-3 px-8 bg-navy text-white hover:bg-navy/95 text-sm font-bold rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              Vérifier la connexion
            </button>
          )}

          {verificationState === "verifying" && (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-xs font-bold text-navy">Recherche du jeton de vérification...</span>
            </div>
          )}

          {verificationState === "success" && (
            <div className="flex flex-col items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl p-4 w-full">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <ShieldCheck className="h-5 w-5 fill-current text-white text-primary" />
                Votre site a été connecté avec succès !
              </div>
              <p className="text-[11px] text-light-slate text-center">
                L&apos;identité de votre site a été vérifiée par ROBIA. Nous pouvons maintenant lancer le premier audit complet.
              </p>
            </div>
          )}

          {verificationState === "error" && (
            <div className="flex flex-col items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 w-full">
              <p className="text-xs text-red-600 font-bold">Échec de la vérification. Veuillez réessayer.</p>
              <button
                onClick={() => setVerificationState("idle")}
                className="text-xs text-navy underline cursor-pointer"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => router.push("/onboarding")}
          className="flex items-center gap-2 text-xs font-bold text-navy hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au profil
        </button>
        <button
          disabled={verificationState !== "success"}
          onClick={() => router.push("/audit/loading")}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-bold rounded-lg shadow-md transition-all cursor-pointer ${
            verificationState === "success"
              ? "bg-accent text-white hover:bg-accent/95 shadow-accent/25"
              : "bg-gray-150 text-gray-400 cursor-not-allowed shadow-none"
          }`}
        >
          Lancer l&apos;audit sémantique
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
