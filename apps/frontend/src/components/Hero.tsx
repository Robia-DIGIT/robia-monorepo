import { motion } from "motion/react";
import {
  FileText,
  Search,
  Star,
  TrendingUp,
  Zap,
  ArrowRight,
  Play,
} from "lucide-react";
import { cn } from "../lib/utils";
import { FadeUp } from "./ui/animations";
import { SectionLabel } from "./ui/SectionLabel";

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute inset-0 bg-teal-400/20 blur-3xl rounded-3xl scale-95" />

      <div className="relative bg-white rounded-3xl border border-teal-100 shadow-2xl shadow-teal-100/60 overflow-hidden">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-teal-50 bg-[#F8FFFE]">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 mx-4 h-6 bg-teal-50 rounded-lg flex items-center px-3">
            <span className="text-xs text-slate-400">app.robia.digital/tableau-de-bord</span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Présence en ligne
              </p>
              <h3 className="text-xl font-bold text-[#1E293B]">Restaurant Le Jardin</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-700">Actif</span>
            </div>
          </div>

          {/* Score cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Score global", value: 87, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
              { label: "Google", value: 92, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
              { label: "SEO", value: 74, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} className={cn("rounded-2xl border p-3 text-center", bg, border)}>
                <p className={cn("text-2xl font-extrabold", color)}>{value}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Recent actions */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Actions exécutées aujourd'hui
            </p>
            {[
              { icon: FileText, text: "Réponse à l'avis Google générée", time: "il y a 2 min", color: "bg-teal-100 text-teal-700" },
              { icon: Search, text: "Mots-clés mis à jour sur le site", time: "il y a 18 min", color: "bg-blue-100 text-blue-600" },
              { icon: Star, text: "Post Instagram créé et planifié", time: "il y a 1h", color: "bg-purple-100 text-purple-600" },
            ].map(({ icon: Icon, text, time, color }) => (
              <div key={text} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
                  <Icon size={13} />
                </div>
                <p className="text-sm text-slate-700 flex-1">{text}</p>
                <span className="text-xs text-slate-400">{time}</span>
              </div>
            ))}
          </div>

          {/* Mini chart */}
          <div className="bg-[#F8FFFE] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#1E293B]">Visites du profil</p>
              <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                +34% ce mois
              </span>
            </div>
            <div className="flex items-end gap-1.5 h-12">
              {[40, 55, 45, 70, 65, 80, 75, 90, 85, 95, 88, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-teal-200"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-8 top-1/3 bg-white border border-teal-100 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2.5"
      >
        <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
          <TrendingUp size={15} className="text-green-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#1E293B]">+147%</p>
          <p className="text-xs text-slate-500">Visibilité</p>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -right-8 bottom-1/3 bg-white border border-teal-100 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2.5"
      >
        <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center">
          <Zap size={15} className="text-teal-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#1E293B]">Auto-exécuté</p>
          <p className="text-xs text-slate-500">par IA</p>
        </div>
      </motion.div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen pt-32 pb-24 px-6 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Copy */}
          <div className="space-y-8">
            <FadeUp delay={0}>
              <SectionLabel>AI Execution Copilot</SectionLabel>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="text-5xl md:text-6xl font-extrabold text-[#1E293B] leading-[1.1] tracking-tight">
                L'employé IA qui{" "}
                <span className="relative inline-block">
                  <span className="text-teal-500">gère</span>
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 200 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 6C50 2 150 2 198 6"
                      stroke="#14b8a6"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                votre présence en ligne.
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
                ROBIA connecte votre entreprise à Google, Facebook et votre site web,
                analyse les opportunités et{" "}
                <strong className="text-slate-700">
                  exécute les améliorations automatiquement
                </strong>
                . Sans agence, sans effort.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#tarifs"
                  className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-teal-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Commencer gratuitement
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#solution"
                  className="inline-flex items-center justify-center gap-2 bg-white border border-teal-100 text-[#1E293B] font-semibold px-7 py-3.5 rounded-xl hover:bg-teal-50 transition-colors"
                >
                  <Play size={14} className="text-teal-500" />
                  Voir comment ça marche
                </a>
              </div>
            </FadeUp>

            <FadeUp delay={0.4}>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-2.5">
                  {(["bg-teal-400", "bg-blue-400", "bg-green-400", "bg-purple-400", "bg-pink-400"] as const).map(
                    (c, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 border-[#F0FDFA] flex items-center justify-center text-white text-xs font-bold",
                          c
                        )}
                      >
                        {["M", "S", "A", "C", "L"][i]}
                      </div>
                    )
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={13} className="text-teal-400 fill-teal-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <strong className="text-slate-700">1 200+ entreprises</strong> améliorent
                    leur visibilité
                  </p>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Mockup */}
          <FadeUp delay={0.2} className="hidden lg:block">
            <DashboardMockup />
          </FadeUp>
        </div>

        {/* Platform logos */}
        <FadeUp delay={0.5}>
          <div className="mt-20 pt-10 border-t border-teal-100">
            <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">
              Connecté aux plateformes qui comptent
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              {[
                "Google Business",
                "Facebook",
                "Instagram",
                "Google Ads",
                "Google Analytics",
                "WhatsApp",
              ].map((name) => (
                <span key={name} className="text-sm font-semibold text-slate-500">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
