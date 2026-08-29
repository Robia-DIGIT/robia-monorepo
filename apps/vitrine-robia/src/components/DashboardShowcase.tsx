import { cn } from "../lib/utils";
import { FadeUp, ScrollDepth } from "./ui/animations";
import { SectionLabel } from "./ui/SectionLabel";

const KPI_CARDS = [
  { label: "Visites/mois", value: "4 821", change: "+34%" },
  { label: "Appels", value: "219", change: "+18%" },
  { label: "Score global", value: "87/100", change: "+12 pts" },
  { label: "Avis", value: "4,9 ★", change: "+0,3" },
] as const;

const SIDEBAR_ITEMS = [
  "Tableau de bord",
  "Contenu",
  "Avis",
  "SEO",
  "Analytique",
  "Paramètres",
] as const;

const RECENT_ACTIONS = [
  "Avis répondu",
  "Post publié",
  "SEO mis à jour",
  "Photo ajoutée",
] as const;

const CHART_BARS = [
  30, 45, 38, 55, 48, 62, 58, 70, 65, 72,
  68, 80, 75, 85, 78, 90, 82, 92, 88, 95,
  90, 97, 93, 100, 96, 98, 94, 100, 97, 100,
] as const;

export function DashboardShowcase() {
  return (
    <section className="overflow-hidden bg-[#102B38] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <div className="mb-12 grid gap-7 border-t border-white/20 pt-6 text-left lg:grid-cols-[.35fr_1fr]">
            <SectionLabel>Tableau de bord</SectionLabel>
            <h2 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.02] tracking-[-.05em] text-white sm:text-6xl">
              Contrôle total.{" "}
              <span className="text-teal-400">Vision claire.</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Tout ce que vous devez savoir sur votre présence en ligne, dans un panneau
              intuitif mis à jour en temps réel.
            </p>
          </div>
        </FadeUp>

        <ScrollDepth>
          <div className="relative">
            <div className="relative border border-white/15 bg-white/5 p-1 shadow-[0_45px_90px_-45px_rgba(0,0,0,.8)]">
              <div className="overflow-hidden bg-[#0F172A]">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-3 sm:px-5 py-3 border-b border-white/10">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/50 flex-shrink-0" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/50 flex-shrink-0" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/50 flex-shrink-0" />
                  <div className="ml-2 sm:ml-4 flex-1 h-6 bg-white/10 rounded-md flex items-center px-3 min-w-0">
                    <span className="text-xs text-white/40 truncate">app.robia.digital</span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 md:p-6 flex flex-col md:grid md:grid-cols-12 gap-3 sm:gap-4">
                  {/* Sidebar: horizontal scrollable tabs on mobile, vertical column from md up */}
                  <div
                    className="flex md:flex-col gap-1.5 sm:gap-2 overflow-x-auto md:overflow-visible
                               -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 pb-1 md:pb-0
                               md:col-span-3 lg:col-span-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {SIDEBAR_ITEMS.map((item, i) => (
                      <div
                        key={item}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap flex-shrink-0 md:whitespace-normal md:flex-shrink",
                          i === 0
                            ? "bg-teal-500 text-white"
                            : "text-white/50 hover:text-white/80"
                        )}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="min-w-0 md:col-span-9 lg:col-span-10 space-y-3 sm:space-y-4">
                    {/* KPI row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                      {KPI_CARDS.map(({ label, value, change }) => (
                        <div key={label} className="bg-white/5 rounded-xl p-2.5 sm:p-3 min-w-0">
                          <p className="text-[11px] sm:text-xs text-white/50 mb-1 truncate">{label}</p>
                          <p className="text-base sm:text-lg font-bold text-white truncate">{value}</p>
                          <p className="text-[11px] sm:text-xs text-green-400 font-semibold">{change}</p>
                        </div>
                      ))}
                    </div>

                    {/* Chart + Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="lg:col-span-2 bg-white/5 rounded-xl p-3 sm:p-4 min-w-0">
                        <p className="text-[11px] sm:text-xs text-white/50 mb-3 font-semibold uppercase tracking-wider">
                          Visibilité — 30 derniers jours
                        </p>
                        <div className="flex items-end gap-[2px] sm:gap-1 h-14 sm:h-16">
                          {CHART_BARS.map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 rounded-sm"
                              style={{
                                height: `${h}%`,
                                background: `rgba(20,184,166,${0.3 + (h / 100) * 0.7})`,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-3 sm:p-4 min-w-0">
                        <p className="text-[11px] sm:text-xs text-white/50 mb-3 font-semibold uppercase tracking-wider">
                          Actions récentes
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                          {RECENT_ACTIONS.map((text) => (
                            <div key={text} className="flex items-center gap-2 min-w-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                              <span className="text-xs text-white/60 truncate">{text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollDepth>
      </div>
    </section>
  );
}
