import {
  TrendingUp,
  Clock,
  Star,
  Users,
  Shield,
  MonitorSmartphone,
} from "lucide-react";
import { FadeUp, StaggerContainer, StaggerChild } from "./ui/animations";
import { SectionLabel } from "./ui/SectionLabel";

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Plus de clients vous trouvent",
    body: "Apparaissez en tête des résultats Google pour les recherches locales et captez les clients au moment où ils cherchent.",
    stat: "+147% de visibilité",
  },
  {
    icon: Clock,
    title: "Économisez des heures par semaine",
    body: "Déléguez toute la gestion de votre présence digitale à ROBIA. Concentrez-vous sur ce que vous faites le mieux.",
    stat: "10h/semaine économisées",
  },
  {
    icon: Star,
    title: "Réputation impeccable",
    body: "Avis répondus, profil complet et contenu frais renforcent la confiance de vos futurs clients.",
    stat: "+0,8 point de note",
  },
  {
    icon: Users,
    title: "Plus de conversions",
    body: "Des informations correctes et à jour réduisent la friction et transforment les visiteurs digitaux en clients réels.",
    stat: "×3 taux de conversion",
  },
  {
    icon: Shield,
    title: "Cohérence totale",
    body: "Rien d'obsolète, rien d'oublié. ROBIA garantit que votre marque est parfaitement représentée sur tous les canaux.",
    stat: "100% de cohérence",
  },
  {
    icon: MonitorSmartphone,
    title: "Résultats mesurables",
    body: "Un tableau de bord clair avec les métriques qui importent. Visualisez votre retour sur investissement en temps réel.",
    stat: "ROI visible en 30 jours",
  },
] as const;

export function Benefits() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <SectionLabel>Résultats concrets</SectionLabel>
            <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight">
              Un impact qui va bien au-delà{" "}
              <span className="text-teal-500">du digital.</span>
            </h2>
            <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
              Plus de visibilité en ligne = plus de clients chez vous. C'est aussi simple que ça.
            </p>
          </div>
        </FadeUp>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map(({ icon: Icon, title, body, stat }) => (
            <StaggerChild key={title}>
              <div className="bg-white rounded-3xl border border-teal-100 p-7 group hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-lg hover:shadow-teal-50">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <Icon size={19} className="text-teal-600" />
                  </div>
                  <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                    {stat}
                  </span>
                </div>
                <h3 className="font-bold text-[#1E293B] text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
              </div>
            </StaggerChild>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
