import { cn } from "../lib/utils";
import { FadeUp } from "./ui/animations";
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
    <section className="py-28 px-6 bg-[#1E293B] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <SectionLabel>Tableau de bord</SectionLabel>
            <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Contrôle total.{" "}
              <span className="text-teal-400">Vision claire.</span>
            </h2>
            <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
              Tout ce que vous devez savoir sur votre présence en ligne, dans un panneau
              intuitif mis à jour en temps réel.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500/10 blur-3xl rounded-full" />
            <div className="relative bg-white/5 border border-white/10 rounded-3xl p-1">
              <div className="bg-[#0F172A] rounded-2xl overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  <div className="ml-4 flex-1 h-6 bg-white/10 rounded-md flex items-center px-3">
                    <span className="text-xs text-white/40">app.robia.digital</span>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-12 gap-4">
                  {/* Sidebar */}
                  <div className="col-span-2 space-y-2">
                    {SIDEBAR_ITEMS.map((item, i) => (
                      <div
                        key={item}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-medium cursor-pointer",
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
                  <div className="col-span-10 space-y-4">
                    {/* KPI row */}
                    <div className="grid grid-cols-4 gap-3">
                      {KPI_CARDS.map(({ label, value, change }) => (
                        <div key={label} className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs text-white/50 mb-1">{label}</p>
                          <p className="text-lg font-bold text-white">{value}</p>
                          <p className="text-xs text-green-400 font-semibold">{change}</p>
                        </div>
                      ))}
                    </div>

                    {/* Chart + Actions */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-white/50 mb-3 font-semibold uppercase tracking-wider">
                          Visibilité — 30 derniers jours
                        </p>
                        <div className="flex items-end gap-1 h-16">
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

                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-white/50 mb-3 font-semibold uppercase tracking-wider">
                          Actions récentes
                        </p>
                        <div className="space-y-2">
                          {RECENT_ACTIONS.map((text) => (
                            <div key={text} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                              <span className="text-xs text-white/60">{text}</span>
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
        </FadeUp>
      </div>
    </section>
  );
}
