import { Globe, Search, FileText, Star, BarChart3, Zap } from "lucide-react";
import { cn } from "../lib/utils";
import { FadeUp, StaggerContainer, StaggerChild } from "./ui/animations";
import { SectionLabel } from "./ui/SectionLabel";

const PLATFORM_CARDS = [
  { name: "Google", bg: "bg-blue-50 border-blue-100" },
  { name: "Facebook", bg: "bg-indigo-50 border-indigo-100" },
  { name: "Instagram", bg: "bg-pink-50 border-pink-100" },
  { name: "Site web", bg: "bg-green-50 border-green-100" },
] as const;

const FEATURE_TAGS = [
  "Publication automatique",
  "Planification intelligente",
  "Validation optionnelle",
  "Journal des actions",
] as const;

export function Features() {
  return (
    <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 bg-[#E6FAF8]">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <div className="text-center mb-10 sm:mb-16">
            <SectionLabel>Fonctionnalités</SectionLabel>
            <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight">
              Tout ce dont votre entreprise a besoin,{" "}
              <span className="text-teal-500">en un seul endroit.</span>
            </h2>
          </div>
        </FadeUp>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Omnicanal — wide */}
          <StaggerChild className="md:col-span-2 lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-teal-100 p-5 sm:p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                <Globe size={20} className="text-teal-700" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-[#1E293B] truncate">Présence Omnicanale Unifiée</h3>
                <p className="text-sm text-slate-500 truncate">Google · Facebook · Instagram · Site web</p>
              </div>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              Une seule plateforme synchronise vos informations sur tous les canaux. Vous
              changez vos horaires ? Nous les mettons à jour partout automatiquement.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {PLATFORM_CARDS.map(({ name, bg }) => (
                <div key={name} className={cn("rounded-2xl border p-3 text-center", bg)}>
                  <div className="text-xs font-semibold text-slate-600">{name}</div>
                  <div className="text-[10px] text-green-600 font-bold mt-1">Actif ✓</div>
                </div>
              ))}
            </div>
          </StaggerChild>

          {/* SEO */}
          <StaggerChild className="bg-white rounded-2xl sm:rounded-3xl border border-teal-100 p-5 sm:p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
              <Search size={20} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-[#1E293B] mb-2">SEO Local Automatique</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Mots-clés locaux, balises méta et contenu optimisés en continu par l'IA pour
              vous positionner en tête des résultats.
            </p>
          </StaggerChild>

          {/* Content — dark card */}
          <StaggerChild className="bg-[#1E293B] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-teal-500/20 flex items-center justify-center mb-4">
              <FileText size={20} className="text-teal-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Génération de Contenu IA</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Posts, légendes, descriptions et réponses aux avis créés automatiquement avec
              la voix de votre entreprise.
            </p>
            <div className="mt-4 bg-white/10 rounded-xl p-3 text-xs text-slate-300 italic">
              "Découvrez notre nouveau plat du jour ! Préparé avec des produits frais du
              marché, le choix idéal pour un déjeuner savoureux..." ✨
            </div>
          </StaggerChild>

          {/* Reviews */}
          <StaggerChild className="bg-white rounded-2xl sm:rounded-3xl border border-teal-100 p-5 sm:p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-yellow-100 flex items-center justify-center mb-4">
              <Star size={20} className="text-yellow-500" />
            </div>
            <h3 className="font-bold text-[#1E293B] mb-2">Gestion des Avis</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Recevez des alertes pour chaque nouvel avis et laissez ROBIA répondre avec des
              messages personnalisés et professionnels.
            </p>
            <div className="mt-4 flex items-center gap-1 flex-wrap">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={16} className="text-yellow-400 fill-yellow-400" />
              ))}
              <span className="text-xs text-slate-500 ml-2">4,9 de moyenne</span>
            </div>
          </StaggerChild>

          {/* Analytics */}
          <StaggerChild className="bg-white rounded-2xl sm:rounded-3xl border border-teal-100 p-5 sm:p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
              <BarChart3 size={20} className="text-green-600" />
            </div>
            <h3 className="font-bold text-[#1E293B] mb-2">Tableau de Bord des Résultats</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Suivez en temps réel l'évolution de votre présence : visites, clics, appels et
              positionnement Google.
            </p>
          </StaggerChild>

          {/* Auto-execution — full width */}
          <StaggerChild className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Zap size={20} className="text-white" />
                  </div>
                  <h3 className="font-bold text-white text-lg">Exécution Automatique</h3>
                </div>
                <p className="text-teal-100 text-sm leading-relaxed max-w-xl">
                  ROBIA ne se contente pas de suggérer — il agit. Il publie du contenu, met à
                  jour les profils et répond aux avis pendant que vous vous concentrez sur
                  votre activité.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {FEATURE_TAGS.map((f) => (
                  <span
                    key={f}
                    className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/30"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </StaggerChild>
        </StaggerContainer>
      </div>
    </section>
  );
}