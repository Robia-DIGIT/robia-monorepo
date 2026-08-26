"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useCategoryDetail } from "@/hooks/api";
import { PageError, PageLoader } from "@/components/ui/page-states";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;

  const { data, isLoading, isError, refetch } = useCategoryDetail(category);

  if (isLoading) {
    return <PageLoader rows={3} />;
  }

  if (isError || !data) {
    return (
      <PageError
        message="Impossible de charger le détail de cette catégorie."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-xs font-bold text-navy hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au tableau de bord
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-navy">{data.name}</h1>
            <p className="text-xs text-light-slate">{data.desc}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-navy">{data.score}%</span>
            <span className="text-[10px] text-light-slate block uppercase">
              Score actuel
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
            Critères audités
          </h3>
          <div className="space-y-3">
            {data.criteria.map((crit, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-secondary/20 rounded-xl border border-gray-150"
              >
                <div className="flex items-center gap-3">
                  {crit.status === "good" && (
                    <CheckCircle2 className="h-5 w-5 text-primary fill-current " />
                  )}
                  {crit.status === "warning" && (
                    <AlertTriangle className="h-5 w-5 text-accent" />
                  )}
                  {crit.status === "error" && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-xs font-bold text-navy">
                    {crit.name}
                  </span>
                </div>
                <span
                  className={`text-xs font-black ${
                    crit.status === "good"
                      ? "text-primary"
                      : crit.status === "warning"
                        ? "text-accent"
                        : "text-red-500"
                  }`}
                >
                  {crit.score}/100
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
