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
    <section className="w-full px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-4xl">
        <FadeUp>
          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              bg-[#1E293B]
              px-5 py-10
              sm:rounded-3xl sm:px-8 sm:py-12
              md:px-12 md:py-14
              lg:px-16 lg:py-16
            "
          >
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/20 via-transparent to-transparent" />

            <div
              className="
                pointer-events-none
                absolute
                -right-24
                -top-24
                h-56
                w-56
                rounded-full
                bg-teal-500/10
                blur-3xl
                sm:-right-32
                sm:-top-32
                sm:h-72
                sm:w-72
                md:h-96
                md:w-96
              "
            />

            <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
              {/* Label */}
              <SectionLabel>Commencez aujourd'hui</SectionLabel>

              {/* Heading */}
              <h2
                className="
                  mt-4
                  text-[clamp(2rem,8vw,3.5rem)]
                  font-extrabold
                  leading-[1.08]
                  tracking-tight
                  text-white
                "
              >
                Votre concurrent
                <br className="hidden sm:block" />
                <span className="sm:ml-2">utilise déjà l'IA.</span>
              </h2>

              {/* Description */}
              <p
                className="
                  mt-5
                  max-w-xl
                  text-sm
                  leading-6
                  text-slate-400
                  sm:text-base
                  sm:leading-7
                  md:text-lg
                "
              >
                Chaque jour sans ROBIA, ce sont des clients qui choisissent
                votre concurrent. Commencez gratuitement aujourd'hui et
                constatez la différence en 14 jours.
              </p>

              {/* CTA */}
              <div className="mt-8 w-full sm:mt-10 sm:w-auto">
                <a
                  href="#tarifs"
                  className="
                    group
                    inline-flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-teal-500
                    px-6
                    py-3.5
                    text-base
                    font-bold
                    text-white
                    shadow-xl
                    shadow-teal-900/30
                    transition-all
                    duration-200
                    hover:bg-teal-400
                    hover:shadow-teal-900/40
                    sm:w-auto
                    sm:px-8
                    sm:py-4
                    sm:text-lg
                    sm:hover:scale-[1.02]
                  "
                >
                  <span>Démarrer l'essai gratuit de 14 jours</span>

                  <ArrowRight
                    size={18}
                    className="
                      shrink-0
                      transition-transform
                      duration-200
                      group-hover:translate-x-1
                    "
                  />
                </a>
              </div>

              {/* Reassurance */}
              <p className="mt-4 text-xs leading-5 text-slate-500 sm:mt-5 sm:text-sm">
                Sans carte de crédit
                <span className="mx-2 text-slate-600">·</span>
                Configuration en 10 minutes
              </p>

              {/* Stats */}
              <div
                className="
                  mt-8
                  grid
                  w-full
                  grid-cols-1
                  divide-y
                  divide-slate-700/70
                  border-t
                  border-slate-700/70
                  sm:mt-10
                  sm:grid-cols-3
                  sm:divide-x
                  sm:divide-y-0
                  sm:border-t-0
                "
              >
                {STATS.map(({ n, l }) => (
                  <div
                    key={l}
                    className="
                      flex
                      flex-col
                      items-center
                      justify-center
                      px-4
                      py-4
                      sm:py-2
                    "
                  >
                    <p
                      className="
                        text-2xl
                        font-extrabold
                        tracking-tight
                        text-teal-400
                        sm:text-3xl
                      "
                    >
                      {n}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                      {l}
                    </p>
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