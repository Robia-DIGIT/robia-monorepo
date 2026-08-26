import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { FadeUp } from "./ui/animations";
import { SectionLabel } from "./ui/SectionLabel";

const FAQS = [
  {
    q: "Ai-je besoin de compétences techniques pour utiliser ROBIA ?",
    a: "Non ! ROBIA a été conçu pour les chefs d'entreprise, pas pour les experts en marketing. La configuration prend moins de 10 minutes et le processus est entièrement guidé.",
  },
  {
    q: "Comment ROBIA publie-t-il du contenu en mon nom ?",
    a: "ROBIA accède à vos plateformes de manière sécurisée via des API officielles. Vous gardez le contrôle total et pouvez configurer une file de validation avant toute publication automatique.",
  },
  {
    q: "Quelles plateformes sont prises en charge ?",
    a: "Google Business Profile, Facebook, Instagram, WhatsApp Business et votre site web (WordPress, Wix, Shopify et autres). Nous ajoutons de nouvelles intégrations continuellement.",
  },
  {
    q: "En combien de temps puis-je voir des résultats ?",
    a: "La plupart de nos clients constatent une amélioration de leur visibilité en 2 à 4 semaines. Des résultats plus significatifs, comme l'augmentation des appels et des visites, apparaissent généralement dans les 30 à 60 jours.",
  },
  {
    q: "Que se passe-t-il si j'annule mon abonnement ?",
    a: "Vous pouvez annuler à tout moment. Vos données restent disponibles pendant 30 jours après l'annulation. Aucune pénalité, aucun engagement.",
  },
  {
    q: "ROBIA remplace-t-il une agence de marketing ?",
    a: "Pour la plupart des commerces locaux, oui ! ROBIA exécute les tâches routinières de gestion de la présence en ligne qu'une agence effectuerait, à une fraction du coût.",
  },
] as const;

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight">
              Questions fréquentes
            </h2>
          </div>
        </FadeUp>

        <div className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <FadeUp key={q} delay={i * 0.05}>
              <div className="bg-white rounded-2xl border border-teal-100 overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="font-semibold text-[#1E293B]">{q}</span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "text-slate-400 flex-shrink-0 transition-transform duration-300",
                      open === i && "rotate-180 text-teal-500"
                    )}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: open === i ? "auto" : 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <p className="px-6 pb-6 text-slate-500 text-sm leading-relaxed">{a}</p>
                </motion.div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
