"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useOpportunity } from "@/hooks/api";
import { PageError, PageLoader } from "@/components/ui/page-states";

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: opportunity, isLoading, isError, refetch } = useOpportunity(id);

  if (isLoading) {
    return <PageLoader rows={4} />;
  }

  if (isError || !opportunity) {
    return (
      <PageError
        message="Impossible de charger cette opportunité."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-xs font-bold text-navy hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au tableau de bord
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="space-y-1">
            <span className="text-[10px] text-light-slate font-bold uppercase tracking-wide">{opportunity.category}</span>
            <h1 className="text-xl font-bold text-navy">{opportunity.title}</h1>
          </div>
          <span className="text-xs bg-red-50 text-red-650 px-3 py-1 rounded-full font-bold border border-red-100">
            Impact {opportunity.impactScore}/10 - Priorité Haute
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
          <div className="bg-secondary/40 rounded-lg p-3 text-center border border-accent/10">
            <span className="text-[10px] text-light-slate block uppercase font-medium">Difficulté</span>
            <span className="text-sm font-bold text-navy">{opportunity.difficulty}</span>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 text-center border border-accent/10">
            <span className="text-[10px] text-light-slate block uppercase font-medium">Temps estimé</span>
            <span className="text-sm font-bold text-navy">{opportunity.estimatedTime}</span>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 text-center border border-accent/10">
            <span className="text-[10px] text-light-slate block uppercase font-medium">Impact estimé</span>
            <span className="text-sm font-bold text-primary">+12% Trafic</span>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 text-center border border-accent/10">
            <span className="text-[10px] text-light-slate block uppercase font-medium">Statut actuel</span>
            <span className="text-sm font-bold text-accent">
              {opportunity.status === "done" ? "Terminé" : opportunity.status === "in_progress" ? "En cours" : "À faire"}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-navy flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-primary" />
              Pourquoi est-ce important ?
            </h4>
            <p className="text-xs text-light-slate leading-relaxed">{opportunity.whyImportant}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
            <div className="border border-red-100 rounded-lg p-3.5 bg-red-50/20">
              <span className="text-[10px] uppercase font-bold text-red-600 block mb-1">Valeur Actuelle</span>
              <code className="text-xs font-mono text-dark-slate block break-all">{opportunity.currentValue}</code>
            </div>
            <div className="border border-primary/25 rounded-lg p-3.5 bg-primary/5">
              <span className="text-[10px] uppercase font-bold text-primary block mb-1">Recommandation ROBIA</span>
              <code className="text-xs font-mono text-navy font-bold block break-all">{opportunity.recommendedValue}</code>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 space-y-4">
        <h3 className="text-sm font-bold text-navy">Action suggérée par le Copilot</h3>
        <p className="text-xs text-light-slate">{opportunity.recommendedAction}</p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={`/documents/generate?opportunityId=${id}&type=email`}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary text-navy hover:bg-primary/95 text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Générer l&apos;e-mail d&apos;instruction (IA)
          </Link>
          <Link
            href={`/documents/generate?opportunityId=${id}&type=script`}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-navy text-white hover:bg-navy/95 text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
          >
            Générer le script d&apos;intégration
          </Link>
        </div>
      </div>
    </div>
  );
}
