import { AlertTriangle, Clock, Puzzle } from "lucide-react";
import { cn } from "../lib/utils";
import { FadeUp, StaggerContainer, StaggerChild } from "./ui/animations";
import { SectionLabel } from "./ui/SectionLabel";

const PROBLEMS = [
  {
    icon: AlertTriangle,
    title: "Invisibilité digitale",
    body: "Votre concurrent apparaît sur Google et pas vous. Des clients potentiels ignorent simplement votre existence en ligne.",
    color: "bg-red-50 border-red-200 text-red-500",
  },
  {
    icon: Clock,
    title: "Pas le temps de gérer",
    body: "Vous devez vous concentrer sur votre métier. Impossible de mettre à jour les profils, répondre aux avis et publier du contenu chaque jour.",
    color: "bg-amber-50 border-amber-200 text-amber-500",
  },
  {
    icon: Puzzle,
    title: "Outils déconnectés",
    body: "Google, Facebook, site et analytics sur des plateformes séparées. Aucune vue unifiée, aucune action coordonnée.",
    color: "bg-blue-50 border-blue-200 text-blue-500",
  },
] as const;

const STATS = [
  { number: "72%", label: "des consommateurs recherchent en ligne avant de visiter un commerce local" },
  { number: "88%", label: "font confiance aux avis en ligne autant qu'aux recommandations personnelles" },
  { number: "3×", label: "plus de contacts pour les entreprises avec un profil Google complet et actif" },
] as const;

export function Problem() {
  return (
    <section className="py-28 px-6 bg-[#1E293B] relative overflow-hidden">
      {/* Dot grid background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <SectionLabel>Le problème</SectionLabel>
            <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              La plupart des commerces locaux{" "}
              <span className="text-teal-400">perdent des clients</span> chaque jour.
            </h2>
            <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
              Pas par manque de qualité — mais parce qu'ils n'apparaissent pas là où leurs
              clients cherchent.
            </p>
          </div>
        </FadeUp>

        <StaggerContainer className="grid md:grid-cols-3 gap-6">
          {PROBLEMS.map(({ icon: Icon, title, body, color }) => (
            <StaggerChild key={title}>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-7 hover:bg-white/8 transition-colors">
                <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center mb-5", color)}>
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{body}</p>
              </div>
            </StaggerChild>
          ))}
        </StaggerContainer>

        <FadeUp delay={0.3}>
          <div className="mt-14 flex flex-col md:flex-row items-center justify-center gap-10 bg-white/5 border border-white/10 rounded-3xl p-8">
            {STATS.map(({ number, label }) => (
              <div key={number} className="text-center">
                <p className="text-5xl font-extrabold text-teal-400">{number}</p>
                <p className="text-slate-400 text-sm mt-2 max-w-[200px] mx-auto">{label}</p>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
