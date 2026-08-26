import { useState } from "react";
import { motion } from "motion/react";
import { Globe, Search, Sparkles, Zap, BarChart3, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { FadeUp } from "./ui/animations";
import { SectionLabel } from "./ui/SectionLabel";

const STEPS = [
  {
    icon: Globe,
    step: "01",
    title: "Connecter",
    body: "Reliez Google Business, Facebook, Instagram et votre site en quelques minutes. ROBIA centralise tout sur une seule plateforme.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: Search,
    step: "02",
    title: "Analyser",
    body: "Notre IA audite votre présence en ligne, identifie les lacunes et attribue un score à chaque aspect de votre profil digital.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "Générer",
    body: "ROBIA crée du contenu SEO, des posts, des réponses aux avis et des descriptions personnalisées pour votre entreprise.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Zap,
    step: "04",
    title: "Exécuter",
    body: "Les améliorations sont publiées automatiquement. Aucune validation manuelle requise pour les tâches routinières.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: BarChart3,
    step: "05",
    title: "Surveiller",
    body: "Suivez les résultats en temps réel : visites, clics, appels et classement Google depuis votre tableau de bord.",
    color: "bg-pink-100 text-pink-600",
  },
] as const;

function StepPreview({ active }: { active: number }) {
  const s = STEPS[active];
  const Icon = s.icon;

  return (
    <motion.div
      key={active}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-5", s.color)}>
        <Icon size={26} />
      </div>
      <p className="text-xs font-bold text-slate-400 tracking-widest mb-1">
        {s.step} — {s.title.toUpperCase()}
      </p>
      <h3 className="text-2xl font-extrabold text-[#1E293B] mb-3">{s.title}</h3>
      <p className="text-slate-500 text-base leading-relaxed mb-6">{s.body}</p>

      <div className="bg-[#F0FDFA] rounded-2xl p-5 space-y-3">
        {active === 0 &&
          ["Google Business ✓", "Facebook ✓", "Instagram ✓", "Mon site ✓"].map((p) => (
            <div key={p} className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-sm text-slate-700 font-medium">{p}</span>
            </div>
          ))}

        {active === 1 && (
          <div className="space-y-2">
            {[
              { label: "Photos du profil", v: 40 },
              { label: "Horaires à jour", v: 100 },
              { label: "Réponses aux avis", v: 20 },
              { label: "Publications récentes", v: 60 },
            ].map(({ label, v }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{label}</span>
                  <span className="font-semibold">{v}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {active === 2 && (
          <div className="space-y-2">
            {[
              "Post Instagram créé ✦",
              "Réponse à l'avis générée ✦",
              "Description SEO mise à jour ✦",
            ].map((t) => (
              <div
                key={t}
                className="text-sm text-slate-700 bg-white border border-teal-100 rounded-xl px-3 py-2"
              >
                {t}
              </div>
            ))}
          </div>
        )}

        {active === 3 && (
          <div className="space-y-2">
            {[
              { text: "Publié sur Google Business", ok: true },
              { text: "Post Instagram planifié", ok: true },
              { text: "Avis en cours de réponse", ok: false },
            ].map(({ text, ok }) => (
              <div key={text} className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-white text-xs",
                    ok ? "bg-green-500" : "bg-teal-400 animate-pulse"
                  )}
                >
                  {ok ? "✓" : "…"}
                </div>
                <span className="text-sm text-slate-700">{text}</span>
              </div>
            ))}
          </div>
        )}

        {active === 4 && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Visites", value: "+127" },
              { label: "Appels", value: "+43" },
              { label: "Avis", value: "4,8 ★" },
              { label: "Position", value: "#2" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-white border border-teal-100 rounded-xl p-3 text-center"
              >
                <p className="text-xl font-extrabold text-teal-600">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function Solution() {
  const [active, setActive] = useState(0);

  return (
    <section id="solution" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <SectionLabel>Comment ça marche</SectionLabel>
            <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight">
              Cinq étapes. <span className="text-teal-500">Zéro effort.</span>
            </h2>
            <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
              ROBIA agit comme un collaborateur dédié à votre présence digitale — 24h/24, 7j/7.
            </p>
          </div>
        </FadeUp>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Steps list */}
          <div className="space-y-3">
            {STEPS.map(({ icon: Icon, step, title, body, color }, i) => (
              <button
                key={step}
                onClick={() => setActive(i)}
                className={cn(
                  "w-full text-left p-5 rounded-2xl border transition-all duration-300",
                  active === i
                    ? "bg-white border-teal-100 shadow-lg shadow-teal-50"
                    : "bg-transparent border-transparent hover:bg-white/60"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", color)}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400 tracking-widest">{step}</span>
                      <h3 className="text-base font-bold text-[#1E293B]">{title}</h3>
                    </div>
                    {active === i && (
                      <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                    )}
                  </div>
                  <ChevronRight
                    size={16}
                    className={cn(
                      "ml-auto text-slate-300 flex-shrink-0 mt-1 transition-transform",
                      active === i && "text-teal-500 rotate-90"
                    )}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Preview panel */}
          <FadeUp className="sticky top-24">
            <div className="bg-white rounded-3xl border border-teal-100 shadow-xl shadow-teal-50/80 overflow-hidden">
              <div className="p-7">
                <StepPreview active={active} />
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
