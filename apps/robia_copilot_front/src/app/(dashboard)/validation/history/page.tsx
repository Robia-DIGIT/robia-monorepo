"use client";

import { History, FileText, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function ValidationHistoryPage() {
  const validationHistory = [
    { id: "v-1", title: "Instruction SEO - Titre Page Accueil", validator: "John Doe", action: "approved", date: "12 Juillet 2026", details: "Balise titre mise à jour." },
    { id: "v-2", title: "Script d'intégration JSON-LD", validator: "John Doe", action: "approved", date: "08 Juillet 2026", details: "Schémas locaux ajoutés." },
    { id: "v-3", title: "Rapport validation audit initial", validator: "John Doe", action: "rejected", date: "28 Juin 2026", details: "Manque le numéro SIRET." }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Historique des Validations
        </h1>
        <p className="text-xs text-light-slate">
          Historique des décisions de validation prises par l'équipe concernant les livrables d'optimisation.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 space-y-4">
        <div className="divide-y divide-gray-100">
          {validationHistory.map((val) => (
            <div key={val.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-light-slate mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-navy">{val.title}</h4>
                  <p className="text-[10px] text-light-slate">
                    Par {val.validator} le {val.date} • {val.details}
                  </p>
                </div>
              </div>

              <div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  val.action === "approved" 
                    ? "bg-green-50 text-green-600 border border-green-150" 
                    : "bg-red-50 text-red-600 border border-red-150"
                }`}>
                  {val.action === "approved" ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Approuvé
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Rejeté
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
