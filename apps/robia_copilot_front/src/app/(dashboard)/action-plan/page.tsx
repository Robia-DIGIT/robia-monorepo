"use client";

import { useState } from "react";
import { CalendarDays, Download, FileSpreadsheet, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

export default function ActionPlanPage() {
  const [activeWeek, setActiveWeek] = useState<number>(1);

  const plan = [
    {
      week: 1,
      title: "Semaine 1 : Fondations SEO & Profils",
      tasks: [
        { name: "Compléter le profil PME avec SIRET", completed: true },
        { name: "Associer la fiche Google Business Profile", completed: false },
        { name: "Vérifier la propriété du site web (DNS)", completed: true }
      ]
    },
    {
      week: 2,
      title: "Semaine 2 : Optimisations Sémantiques Initiale",
      tasks: [
        { name: "Mettre à jour le tag Title de la page d'accueil", completed: false },
        { name: "Générer et déployer la balise Meta description", completed: false },
        { name: "Intégrer les balises alt sur les images principales", completed: false }
      ]
    },
    {
      week: 3,
      title: "Semaine 3 : Cocon Sémantique Local",
      tasks: [
        { name: "Rédiger 2 pages de prestations ciblées géographiquement", completed: false },
        { name: "Insérer le script de microdonnées LocalBusiness JSON-LD", completed: false }
      ]
    },
    {
      week: 4,
      title: "Semaine 4 : Validation & Suivi",
      tasks: [
        { name: "Valider les modifications auprès des développeurs", completed: false },
        { name: "Analyser le positionnement après indexation", completed: false }
      ]
    }
  ];

  const handleExport = () => {
    alert("Exportation du plan d'action 30 jours au format CSV en cours de téléchargement...");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Plan d&apos;action 30 jours
          </h1>
          <p className="text-xs text-light-slate">
            Suivez notre feuille de route structurée sur 4 semaines pour booster significativement votre trafic local.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-navy text-white hover:bg-navy/95 text-xs font-bold rounded-lg shadow-md transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          Exporter le plan (.CSV)
        </button>
      </div>

      {/* Accordion / Weeks list */}
      <div className="space-y-4">
        {plan.map((p) => {
          const isOpen = activeWeek === p.week;
          const completedTasksCount = p.tasks.filter(t => t.completed).length;

          return (
            <div key={p.week} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setActiveWeek(isOpen ? 0 : p.week)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-navy">{p.title}</h3>
                  <span className="text-[10px] text-light-slate font-medium">
                    {completedTasksCount} sur {p.tasks.length} tâches validées • {Math.round((completedTasksCount / p.tasks.length) * 100)}% réalisé
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-navy" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-navy" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100 divide-y divide-gray-100">
                  {p.tasks.map((task, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-4 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={`h-4.5 w-4.5 rounded-md flex items-center justify-center border text-white ${
                          task.completed 
                            ? "bg-primary border-primary" 
                            : "border-gray-300"
                        }`}>
                          {task.completed && <span className="text-[10px] font-black">✓</span>}
                        </div>
                        <span className={`text-xs font-medium ${task.completed ? "line-through text-light-slate" : "text-dark-slate"}`}>
                          {task.name}
                        </span>
                      </div>
                      
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        task.completed 
                          ? "bg-green-50 text-green-600" 
                          : "bg-gray-100 text-light-slate"
                      }`}>
                        {task.completed ? "Validé" : "À planifier"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
