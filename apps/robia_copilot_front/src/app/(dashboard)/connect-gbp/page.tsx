"use client";

import {
  Settings,
  ShieldCheck,
  RefreshCw,
  Unlink,
  Link2,
  AlertCircle,
} from "lucide-react";
import { useConnectGbp, useDisconnectGbp, useProfile } from "@/hooks/api";
import { PageError, PageLoader } from "@/components/ui/page-states";

export default function ConnectGbpPage() {
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const connectGbp = useConnectGbp();
  const disconnectGbp = useDisconnectGbp();

  const handleConnect = () => {
    connectGbp.mutate(undefined);
  };

  const handleDisconnect = () => {
    if (
      confirm(
        "Voulez-vous vraiment détacher votre compte Google Business Profile ?",
      )
    ) {
      disconnectGbp.mutate();
    }
  };

  if (isLoading) {
    return <PageLoader rows={3} />;
  }

  if (isError || !profile) {
    return (
      <PageError
        message="Impossible de charger le profil."
        onRetry={() => refetch()}
      />
    );
  }

  const isConnected = profile.isConnectedGbp;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Intégration Google Business Profile
        </h1>
        <p className="text-xs text-light-slate">
          Associez votre fiche d&apos;établissement Google pour synchroniser vos
          avis clients, vos coordonnées et suivre votre SEO local.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8">
        {!isConnected ? (
          <div className="space-y-6 text-center py-6">
            <div className="h-16 w-16 bg-secondary/50 text-accent rounded-full flex items-center justify-center mx-auto border border-accent/20">
              <Link2 className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-base font-bold text-navy">
                Aucun compte Google Business Profile associé
              </h3>
              <p className="text-xs text-light-slate">
                Connectez votre compte pour que ROBIA Copilot puisse analyser la
                complétude de votre fiche d&apos;établissement (horaires,
                photos, avis).
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleConnect}
                disabled={connectGbp.isPending}
                className="inline-flex items-center gap-2 py-3 px-8 bg-accent text-white hover:bg-accent/95 text-xs font-bold rounded-lg shadow-md shadow-accent/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {connectGbp.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Connexion à Google en cours...
                  </>
                ) : (
                  <>Se connecter avec Google Business</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-primary fill-current " />
                <div>
                  <h4 className="text-xs font-bold text-navy">
                    Établissement lié : {profile.companyName}
                  </h4>
                  <p className="text-[10px] text-light-slate">
                    ID Fiche : {profile.googleBusinessProfileId}
                  </p>
                </div>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-primary text-navy">
                Actif
              </span>
            </div>

            <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
              <p className="text-[10px] text-light-slate flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-primary" />
                La déconnexion suspend la collecte locale.
              </p>

              <button
                onClick={handleDisconnect}
                disabled={disconnectGbp.isPending}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-650 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Unlink className="h-3.5 w-3.5" />
                {disconnectGbp.isPending ? "Déconnexion..." : "Détacher GBP"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
