"use client";

import { Clock, Download } from "lucide-react";
import { useAuditHistory } from "@/hooks/api";
import { PageError, PageLoader } from "@/components/ui/page-states";

export default function AuditHistoryPage() {
  const { data: history, isLoading, isError, refetch } = useAuditHistory();

  if (isLoading) {
    return <PageLoader rows={4} />;
  }

  if (isError || !history) {
    return (
      <PageError
        message="Impossible de charger l'historique des audits."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Historique des Audits
        </h1>
        <p className="text-xs text-light-slate">
          Retrouvez la progression de votre score SEO global et accédez aux anciens rapports d&apos;audit.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/40 text-navy font-bold border-b border-gray-150">
                <th className="p-4">Date de l&apos;audit</th>
                <th className="p-4 text-center">Score Global</th>
                <th className="p-4">Pages analysées</th>
                <th className="p-4">Opportunités levées</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-dark-slate">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/55 transition-colors">
                  <td className="p-4 font-bold">{item.date}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full font-black ${
                      item.score >= 65 ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                    }`}>
                      {item.score} / 100
                    </span>
                  </td>
                  <td className="p-4">{item.pagesScanned} pages</td>
                  <td className="p-4">{item.issuesFound} opportunités</td>
                  <td className="p-4 text-right space-x-2">
                    <button className="inline-flex items-center gap-1 text-[10px] font-bold text-navy hover:text-primary transition-colors cursor-pointer">
                      <Download className="h-3.5 w-3.5" />
                      Télécharger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
