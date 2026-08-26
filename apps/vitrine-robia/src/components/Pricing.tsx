import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import { FadeUp, StaggerContainer, StaggerChild } from "./ui/animations";
import { SectionLabel } from "./ui/SectionLabel";

const PLANS = [
  {
    name: "Starter",
    price: "0 €",
    priceAnnual: "0 €",
    period: "/mois",
    description: "Idéal pour démarrer votre présence en ligne.",
    features: [
      "1 établissement connecté",
      "Google Business + Facebook",
      "Contenu IA : 10 posts/mois",
      "Gestion des avis",
      "Tableau de bord basique",
      "Support par e-mail",
    ],
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "29 €",
    priceAnnual: "278 €",
    period: "/mois",
    description: "Pour les entreprises qui veulent une croissance accélérée.",
    features: [
      "3 établissements connectés",
      "Tous les canaux",
      "Contenu IA : illimité",
      "Exécution automatique",
      "Tableau de bord avancé",
      "SEO local avancé",
      "Intégration WhatsApp",
      "Support prioritaire",
    ],
    cta: "Essai gratuit 14 jours",
    highlighted: true,
  },
  {
    name: "Business",
    price: "99 €",
    priceAnnual: "950 €",
    period: "/mois",
    description: "Pour les réseaux et franchises avec plusieurs établissements.",
    features: [
      "Établissements illimités",
      "Multi-marque",
      "Accès API",
      "Rapports en marque blanche",
      "Gestionnaire dédié",
      "Onboarding personnalisé",
      "SLA garanti",
      "Facturation entreprise",
    ],
    cta: "Parler à un conseiller",
    highlighted: false,
  },
] as const;

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="tarifs" className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 bg-[#E6FAF8]">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <div className="text-center mb-10 sm:mb-12 px-2">
            <SectionLabel>Tarifs</SectionLabel>
            <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight">
              Un investissement qui{" "}
              <span className="text-teal-500">se rentabilise seul.</span>
            </h2>
            <p className="mt-4 text-slate-500 text-base sm:text-lg">
              Un client de plus par mois couvre déjà l'investissement.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 mt-8 bg-white border border-teal-100 rounded-xl p-1.5">
              <button
                onClick={() => setAnnual(false)}
                className={cn(
                  "px-3.5 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  !annual
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Mensuel
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn(
                  "px-3.5 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5",
                  annual
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Annuel
                <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </FadeUp>

        {/*
          Mobile: rangée scrollable horizontalement avec snap, une carte
          à la fois (peek sur la suivante). Desktop (md+): vraie grille 3
          colonnes, plus de scroll, plus de snap.
        */}
        <StaggerContainer
          className="flex md:grid md:grid-cols-3 gap-5 sm:gap-6 items-stretch
                     overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none
                     -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 pb-4 md:pb-0
                     [scrollbar-none] [&::-webkit-scrollbar]:hidden"
        >
          {PLANS.map(({ name, price, priceAnnual, period, description, features, cta, highlighted }) => (
            <StaggerChild key={name} className="shrink-0 w-[82%] xs:w-[75%] sm:w-[60%] md:w-auto snap-center">
              <div
                className={cn(
                  "h-full flex flex-col rounded-3xl border p-6 sm:p-7 transition-all duration-300",
                  highlighted
                    ? "bg-[#1E293B] border-transparent shadow-2xl shadow-slate-300 md:scale-[1.02]"
                    : "bg-white border-teal-100 shadow-sm hover:shadow-lg hover:shadow-teal-50"
                )}
              >
                {highlighted && (
                  <div className="mb-4">
                    <span className="text-xs font-bold text-teal-400 bg-teal-500/20 border border-teal-500/30 px-3 py-1 rounded-full uppercase tracking-widest">
                      Le plus populaire
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3
                    className={cn(
                      "text-xl font-extrabold mb-1",
                      highlighted ? "text-white" : "text-[#1E293B]"
                    )}
                  >
                    {name}
                  </h3>
                  <p className={cn("text-sm", highlighted ? "text-slate-400" : "text-slate-500")}>
                    {description}
                  </p>
                </div>

                <div className="mb-6">
                  <span
                    className={cn(
                      "text-4xl font-extrabold",
                      highlighted ? "text-white" : "text-[#1E293B]"
                    )}
                  >
                    {annual ? priceAnnual : price}
                  </span>
                  <span
                    className={cn("text-sm ml-1", highlighted ? "text-slate-400" : "text-slate-500")}
                  >
                    {period}
                  </span>
                </div>

                <ul className="space-y-3 flex-1 mb-7">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        size={15}
                        className={cn(
                          "shrink-0 mt-0.5",
                          highlighted ? "text-teal-400" : "text-green-500"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          highlighted ? "text-slate-300" : "text-slate-600"
                        )}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#"
                  className={cn(
                    "w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-all duration-200",
                    highlighted
                      ? "bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-900/30"
                      : "bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200"
                  )}
                >
                  {cta}
                </a>
              </div>
            </StaggerChild>
          ))}
        </StaggerContainer>

        {/* Indicateur de scroll, visible uniquement sur mobile/tablette */}
        <div className="flex md:hidden justify-center gap-1.5 mt-1">
          {PLANS.map((p) => (
            <span key={p.name} className="w-1.5 h-1.5 rounded-full bg-teal-300" />
          ))}
        </div>

        <FadeUp delay={0.3}>
          <p className="text-center text-sm text-slate-500 mt-8 px-4">
            Tous les plans incluent 14 jours d'essai gratuit · Annulez quand vous voulez ·
            Sans engagement
          </p>
        </FadeUp>
      </div>
    </section>
  );
}