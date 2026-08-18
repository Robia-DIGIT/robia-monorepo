import { Star } from "lucide-react";
import { cn } from "../lib/utils";
import { FadeUp, StaggerContainer, StaggerChild } from "./ui/animations";
import { SectionLabel } from "./ui/SectionLabel";

const TESTIMONIALS = [
  {
    name: "Marie Dupont",
    role: "Propriétaire",
    business: "Restaurant La Bonne Table",
    avatar: "MD",
    avatarBg: "bg-teal-500",
    quote:
      "En 3 semaines avec ROBIA, nous sommes apparus en tête de Google pour 'restaurant midi Paris'. Les réservations ont augmenté de 40%. Je n'y croyais pas !",
    rating: 5,
  },
  {
    name: "Dr. Pierre Martin",
    role: "Médecin",
    business: "Cabinet Martin",
    avatar: "PM",
    avatarBg: "bg-blue-500",
    quote:
      "La gestion des avis était un cauchemar. ROBIA répond automatiquement et ma note Google est passée de 3,8 à 4,9 étoiles en deux mois.",
    rating: 5,
  },
  {
    name: "Sophie Bernard",
    role: "Directrice",
    business: "Hôtel Beau Rivage",
    avatar: "SB",
    avatarBg: "bg-purple-500",
    quote:
      "J'économise au moins 15 heures par semaine que je passais à maintenir les réseaux sociaux et Google à jour. ROBIA fait tout ça et bien plus.",
    rating: 5,
  },
  {
    name: "Thomas Leroy",
    role: "Entrepreneur",
    business: "Salon de coiffure Leroy",
    avatar: "TL",
    avatarBg: "bg-green-500",
    quote:
      "Je pensais que c'était compliqué. Connexion en 5 minutes, et dès le lendemain j'avais des posts publiés et mon profil entièrement optimisé. Bluffant !",
    rating: 5,
  },
] as const;

export function Testimonials() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <SectionLabel>Témoignages</SectionLabel>
            <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight">
              De vraies entreprises.{" "}
              <span className="text-teal-500">De vrais résultats.</span>
            </h2>
          </div>
        </FadeUp>

        <StaggerContainer className="grid md:grid-cols-2 gap-6">
          {TESTIMONIALS.map(({ name, role, business, avatar, avatarBg, quote, rating }) => (
            <StaggerChild key={name}>
              <div className="bg-white rounded-3xl border border-teal-100 p-7 shadow-sm hover:shadow-lg hover:shadow-teal-50 transition-shadow">
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={14} className="text-teal-400 fill-teal-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-base leading-relaxed mb-6 italic">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-teal-50">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold",
                      avatarBg
                    )}
                  >
                    {avatar}
                  </div>
                  <div>
                    <p className="font-bold text-[#1E293B] text-sm">{name}</p>
                    <p className="text-xs text-slate-400">
                      {role} · {business}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerChild>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
