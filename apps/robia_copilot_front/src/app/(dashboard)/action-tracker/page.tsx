"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, CheckSquare, Sparkles } from "lucide-react";

export default function ActionTrackerPage() {
  const [tasks, setTasks] = useState([
    { id: "t-1", title: "Mettre à jour la balise meta title page d'accueil", category: "SEO Technique", status: "in_progress", date: "2026-07-12" },
    { id: "t-2", title: "Renseigner l'adresse physique SIRET", category: "Profil PME", status: "todo", date: "2026-07-12" },
    { id: "t-3", title: "Lier le compte Google Business Profile", category: "Local SEO", status: "todo", date: "2026-07-12" },
    { id: "t-4", title: "Rédiger l'article 'Notre pain bio au levain'", category: "Cocon Sémantique", status: "done", date: "2026-07-11" },
    { id: "t-5", title: "Ajouter la sitemap XML dans la Google Search Console", category: "Indexation", status: "todo", date: "2026-07-10" }
  ]);

  const toggleStatus = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === "todo" ? "in_progress" : t.status === "in_progress" ? "done" : "todo";
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          Tracker des actions SEO
        </h1>
        <p className="text-xs text-light-slate">
          Suivez l'état d'avancement des recommandations et optimisations recommandées par ROBIA.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <span className="text-[10px] text-light-slate block uppercase font-medium">À faire</span>
          <span className="text-xl font-bold text-navy">{tasks.filter(t => t.status === "todo").length}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <span className="text-[10px] text-light-slate block uppercase font-medium">En cours</span>
          <span className="text-xl font-bold text-accent">{tasks.filter(t => t.status === "in_progress").length}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <span className="text-[10px] text-light-slate block uppercase font-medium">Réalisé</span>
          <span className="text-xl font-bold text-primary">{tasks.filter(t => t.status === "done").length}</span>
        </div>
      </div>

      {/* Task List container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
        <div className="divide-y divide-gray-150">
          {tasks.map((task) => (
            <div key={task.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                
                {/* Interactive status toggle checkbox icon */}
                <button 
                  onClick={() => toggleStatus(task.id)}
                  className="mt-0.5 text-light-slate hover:text-primary transition-colors cursor-pointer"
                >
                  {task.status === "todo" && <Circle className="h-5 w-5" />}
                  {task.status === "in_progress" && <Clock className="h-5 w-5 text-accent" />}
                  {task.status === "done" && <CheckCircle2 className="h-5 w-5 text-primary fill-current text-white" />}
                </button>

                <div className="space-y-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    task.status === "done"
                      ? "bg-green-50 text-green-600"
                      : task.status === "in_progress"
                        ? "bg-orange-50 text-accent"
                        : "bg-gray-100 text-light-slate"
                  }`}>
                    {task.category}
                  </span>
                  <h4 className={`text-xs font-bold ${task.status === "done" ? "line-through text-light-slate" : "text-navy"}`}>
                    {task.title}
                  </h4>
                  <p className="text-[10px] text-light-slate">Créé le {task.date}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  task.status === "done" 
                    ? "bg-primary/10 text-primary" 
                    : task.status === "in_progress"
                      ? "bg-accent/10 text-accent"
                      : "bg-gray-100 text-light-slate"
                }`}>
                  {task.status === "done" ? "Terminé" : task.status === "in_progress" ? "En cours" : "À faire"}
                </span>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
