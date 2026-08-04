import { ArrowRight } from "lucide-react";
import { FadeUp } from "./ui/animations";
import { SectionLabel } from "./ui/SectionLabel";

const STATS = [
  { n: "1 200+", l: "entreprises actives" },
  { n: "4,9 ★", l: "note moyenne" },
  { n: "147%", l: "gain de visibilité" },
] as const;

export function FinalCTA() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <FadeUp>
          <div className="relative bg-[#1E293B] rounded-3xl p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-transparent to-transparent" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

            <div className="relative">
              <SectionLabel>Commencez aujourd'hui</SectionLabel>

              <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Votre concurrent
                <br />
                utilise déjà l'IA.
              </h2>

              <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
                Chaque jour sans ROBIA, ce sont des clients qui choisissent votre concurrent.
                Commencez gratuitement aujourd'hui et constatez la différence en 14 jours.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="#tarifs"
                  className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-teal-900/30 transition-all duration-200 hover:scale-[1.02] text-lg"
                >
                  Démarrer l'essai gratuit de 14 jours
                  <ArrowRight size={18} />
                </a>
              </div>

              <p className="mt-5 text-slate-500 text-sm">
                Sans carte de crédit · Configuration en 10 minutes
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
                {STATS.map(({ n, l }) => (
                  <div key={l} className="text-center">
                    <p className="text-3xl font-extrabold text-teal-400">{n}</p>
                    <p className="text-xs text-slate-500 mt-1">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
