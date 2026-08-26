"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useAudit, useOpportunities } from "@/hooks/api";
import { PageError, PageLoader } from "@/components/ui/page-states";

export default function DashboardPage() {
  const { data: audit, isLoading: auditLoading, isError: auditError, refetch: refetchAudit } = useAudit();
  const { data: opportunities, isLoading: oppLoading, isError: oppError, refetch: refetchOpp } = useOpportunities();

  if (auditLoading || oppLoading) {
    return <PageLoader rows={6} />;
  }

  if (auditError || oppError || !audit || !opportunities) {
    return (
      <PageError
        message="Impossible de charger le tableau de bord."
        onRetry={() => {
          refetchAudit();
          refetchOpp();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy text-white rounded-2xl p-4 sm:p-6 shadow-md border border-white/5 relative overflow-hidden">
        <div className="space-y-1 z-10">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            Bonjour John !
          </h1>
          <p className="text-white/70 text-xs">
            L&apos;audit de votre site est terminé. Voici votre score de visibilité ROBIA.
          </p>
        </div>
        <div className="flex items-center gap-4 z-10">
          <Link
            href="/audit/loading"
            className="px-4 py-2 bg-primary text-navy hover:bg-primary/95 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Lancer un nouvel audit
          </Link>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-linear-to-l from-primary/10 to-transparent pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-4 sm:p-6 flex flex-col justify-between space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-navy">Score Global ROBIA</h3>
            <span className="text-[10px] text-light-slate bg-secondary px-2 py-0.5 rounded font-medium">Mis à jour aujourd&apos;hui</span>
          </div>

          <div className="flex flex-col items-center justify-center space-y-3 py-4">
            <div className="relative h-28 sm:h-32 w-28 sm:w-32 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={audit.globalScore >= 75 ? "#14B8A6" : audit.globalScore >= 50 ? "#F97316" : "#EF4444"}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - audit.globalScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-3xl font-black text-navy">{audit.globalScore}</span>
                <span className="text-xs text-light-slate block">/ 100</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-center text-dark-slate">
              {audit.globalScore >= 75
                ? "Excellent travail ! Votre site est bien optimisé."
                : audit.globalScore >= 50
                  ? "Des optimisations importantes sont requises."
                  : "Attention : visibilité critique."
              }
            </p>
          </div>

          <Link
            href="/action-plan"
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-secondary text-accent hover:bg-accent hover:text-white text-xs font-bold rounded-lg border border-accent/15 transition-all cursor-pointer"
          >
            Découvrir le plan d&apos;action 30 jours
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-4 sm:p-6 flex flex-col justify-between space-y-6 lg:col-span-2">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-accent" />
                Données manquantes & Actions urgentes
              </h3>
              <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold">Prioritaire</span>
            </div>
            <p className="text-xs text-light-slate">
              Certaines configurations essentielles manquent à votre dossier pour une indexation SEO optimale :
            </p>
          </div>

          <div className="space-y-3 my-2">
            {audit.missingDataFields.map((field, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-accent/10">
                <span className="text-xs text-dark-slate font-medium">{field}</span>
                <Link
                  href={field.includes("Google") ? "/connect-gbp" : field.includes("Siret") ? "/onboarding" : "/connect-site"}
                  className="flex items-center gap-1 text-[10px] font-bold text-accent hover:text-accent/95 hover:underline cursor-pointer"
                >
                  Résoudre
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-light-slate">
            Résoudre ces blocages peut augmenter votre score global de <strong className="text-navy">+25 points</strong>.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold text-navy">Score par catégorie</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {audit.categories.map((cat) => (
            <Link
              href={`/dashboard/categories/${cat.id}`}
              key={cat.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-primary/20 transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-bold text-navy group-hover:text-primary transition-colors">{cat.name}</h4>
                <span className={`text-xs font-black ${
                  cat.status === "good" ? "text-primary" : cat.status === "warning" ? "text-accent" : "text-red-500"
                }`}>{cat.score}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    cat.status === "good" ? "bg-primary" : cat.status === "warning" ? "bg-accent" : "bg-red-500"
                  }`}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
              <p className="text-[10px] text-light-slate line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-4 sm:p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-navy">Opportunités sémantiques identifiées</h3>
            <p className="text-xs text-light-slate">Recommandations générées par l&apos;IA pour maximiser votre présence locale.</p>
          </div>
          <span className="text-[10px] bg-secondary text-navy px-2.5 py-1 rounded-full font-bold">
            {opportunities.filter((o) => o.status !== "done").length} Actives
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {opportunities.map((opp) => (
            <div key={opp.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    opp.priority === "high"
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : opp.priority === "medium"
                        ? "bg-orange-50 text-accent border border-orange-100"
                        : "bg-green-50 text-green-600 border border-green-100"
                  }`}>
                    Impact {opp.impactScore}/10
                  </span>
                  <span className="text-[10px] text-light-slate font-medium">{opp.category}</span>
                </div>
                <h4 className="text-xs font-bold text-navy">{opp.title}</h4>
                <p className="text-xs text-light-slate">{opp.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/opportunities/${opp.id}`}
                  className="px-4 py-2 border border-gray-200 text-navy hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Voir les détails
                </Link>
                <Link
                  href={`/documents/generate?opportunityId=${opp.id}`}
                  className="px-4 py-2 bg-primary text-navy hover:bg-primary/95 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  Générer Doc
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
