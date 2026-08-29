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
    <section className="bg-white px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.65fr_1.35fr] lg:gap-24">
        <FadeUp>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-5 text-4xl font-extrabold leading-[1.04] tracking-[-.05em] text-[#1E293B] md:text-6xl">
              Questions fréquentes
            </h2>
          </div>
        </FadeUp>

        <div className="border-t border-[#15313D]/20">
          {FAQS.map(({ q, a }, i) => (
            <FadeUp key={q} delay={i * 0.05}>
              <div className="overflow-hidden border-b border-[#15313D]/20 bg-white">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-1 py-6 text-left"
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
                  <p className="max-w-2xl px-1 pb-7 text-sm leading-7 text-slate-500">{a}</p>
                </motion.div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
