import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  CheckCircle2,
  MapPin,
  MessageSquareText,
  Search,
  Store,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Analyser les signaux",
    text: "ROBIA examine les informations de votre établissement, votre site et les avis visibles afin de repérer les données absentes, imprécises ou incohérentes.",
  },
  {
    icon: BarChart3,
    number: "02",
    title: "Prioriser les actions",
    text: "Un diagnostic lisible transforme les constats en quelques actions classées par impact et par effort, pour savoir quoi traiter en premier.",
  },
  {
    icon: MessageSquareText,
    number: "03",
    title: "Préparer les améliorations",
    text: "Le copilote vous aide à rédiger des informations utiles et des réponses aux avis, adaptées à votre activité et à votre clientèle locale.",
  },
  {
    icon: CheckCircle2,
    number: "04",
    title: "Valider puis mesurer",
    text: "Votre équipe garde le contrôle : elle vérifie les suggestions, applique les changements pertinents et suit l’évolution de la visibilité.",
  },
];

const checks = [
  "Nom, catégorie et description de l’activité",
  "Adresse, zone desservie et coordonnées",
  "Horaires habituels et horaires spéciaux",
  "Cohérence entre la fiche et le site web",
  "Qualité des informations destinées aux clients",
  "Avis publiés et régularité des réponses",
];

const faqs = [
  {
    question: "Google Business Profile est-il gratuit ?",
    answer:
      "Oui. Google permet de créer et de gérer gratuitement une fiche d’établissement afin de présenter une activité éligible dans Google Search et Google Maps. ROBIA est un outil distinct qui aide à analyser cette présence et à prioriser les améliorations.",
  },
  {
    question: "Google My Business et Google Business Profile sont-ils différents ?",
    answer:
      "Google Business Profile est le nom actuel du service autrefois appelé Google My Business. Les deux expressions désignent donc la fiche d’établissement visible sur Google.",
  },
  {
    question: "Quels éléments influencent les résultats locaux sur Google ?",
    answer:
      "Google explique que les résultats locaux reposent principalement sur la pertinence, la distance et la notoriété. Des informations complètes et exactes aident Google à mieux comprendre l’activité, mais aucune optimisation ne garantit une position précise.",
  },
  {
    question: "ROBIA modifie-t-il ma fiche automatiquement ?",
    answer:
      "Non. ROBIA agit comme un copilote : il détecte les opportunités et prépare des recommandations. Vous décidez des changements à appliquer et validez les contenus avant leur publication.",
  },
  {
    question: "Puis-je suivre plusieurs établissements à Madagascar ?",
    answer:
      "Oui. ROBIA s’adresse aussi aux entreprises et réseaux qui souhaitent suivre plusieurs points de vente, avec une attention particulière portée à la cohérence des informations de chaque établissement.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id":
        "https://robiacopilot.site/optimisation-google-business-profile-madagascar#service",
      name: "Optimisation Google Business Profile à Madagascar",
      serviceType: "Audit et optimisation de fiche Google Business Profile",
      description:
        "ROBIA Copilot analyse les signaux d’une fiche Google Business Profile et priorise les actions de visibilité locale à Madagascar.",
      url: "https://robiacopilot.site/optimisation-google-business-profile-madagascar",
      provider: {
        "@type": "Organization",
        name: "ROBIA Digital",
        url: "https://robiacopilot.site/",
      },
      areaServed: {
        "@type": "Country",
        name: "Madagascar",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ],
};

export default function GoogleBusinessProfileMadagascar() {
  return (
    <>
      <Seo
        title="Optimisation Google Business Profile à Madagascar | ROBIA"
        description="Analysez votre fiche Google Business Profile à Madagascar et obtenez des actions prioritaires, claires et validées par votre équipe avec ROBIA."
        canonicalPath="/optimisation-google-business-profile-madagascar"
        structuredData={structuredData}
      />

      <section className="bg-[#F3F1EA] px-5 pb-20 pt-32 text-[#15313D] sm:px-8 lg:px-12 lg:pb-28 lg:pt-40">
        <div className="mx-auto max-w-7xl">
          <div className="border-t border-[#15313D]/40 pt-4 text-[10px] font-semibold uppercase tracking-[.18em] text-[#087F75]">
            Google Business Profile · Madagascar
          </div>
          <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#087F75]">
                <Store size={16} />
                Transformez votre fiche en priorité d’action
              </p>
              <h1 className="max-w-5xl font-[Roboto] text-[clamp(3rem,6vw,5.8rem)] font-black leading-[.95] tracking-[-.055em]">
                Optimisez votre fiche Google Business Profile
                <span className="block text-[#087F75]">à Madagascar.</span>
              </h1>
            </div>
            <div className="border-l-2 border-[#F97316] pl-6">
              <p className="text-base leading-7 text-[#52686F]">
                ROBIA Copilot analyse les signaux de votre établissement, fait ressortir les écarts importants et vous guide vers les améliorations les plus utiles. Vous gardez la validation finale.
              </p>
              <a
                href="https://app.robiacopilot.site"
                className="mt-7 inline-flex items-center gap-3 bg-[#F97316] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#E5650C]"
              >
                Analyser ma présence locale
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 text-[#15313D] sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F97316]">Être compris localement</p>
              <h2 className="mt-4 font-[Roboto] text-4xl font-black leading-tight tracking-[-.035em] sm:text-5xl">
                Une fiche complète aide les bons clients à vous trouver.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-[#52686F]">
              <p>
                Une fiche Google Business Profile permet à une entreprise éligible de présenter gratuitement son activité dans Google Search et Google Maps. Elle rassemble les informations dont un client a besoin pour comprendre, contacter ou visiter un établissement.
              </p>
              <p>
                Google indique que les résultats locaux reposent surtout sur la pertinence, la distance et la notoriété. Il n’existe donc pas de raccourci ni de position garantie : l’objectif est de fournir des informations exactes, utiles et cohérentes.
              </p>
              <p>
                ROBIA rend ce travail plus lisible. Au lieu d’une longue liste technique, vous recevez un diagnostic et un nombre limité d’actions prioritaires, adaptées à votre établissement et à votre marché.
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-px bg-[#DDE4E2] sm:grid-cols-2 lg:grid-cols-3">
            {checks.map((check) => (
              <div key={check} className="flex items-start gap-3 bg-[#F7F6F1] p-6 text-sm font-semibold leading-6">
                <BadgeCheck className="mt-0.5 shrink-0 text-[#087F75]" size={19} />
                {check}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#102B38] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8FE1D6]">La méthode ROBIA</p>
              <h2 className="mt-4 max-w-xl font-[Roboto] text-4xl font-black leading-tight tracking-[-.035em] sm:text-5xl">
                De l’analyse à une action validée.
              </h2>
            </div>
            <p className="max-w-2xl leading-7 text-[#B5C5CA]">
              Un parcours simple pour comprendre votre situation, concentrer l’effort de votre équipe et mesurer les progrès sans perdre le contrôle de votre communication.
            </p>
          </div>
          <div className="mt-14 grid gap-px bg-white/15 md:grid-cols-2">
            {steps.map(({ icon: Icon, number, title, text }) => (
              <article key={title} className="bg-[#102B38] p-8 lg:p-10">
                <div className="flex items-center justify-between">
                  <Icon className="text-[#14B8A6]" size={27} />
                  <span className="font-[Roboto] text-sm font-black text-white/35">{number}</span>
                </div>
                <h3 className="mt-8 font-[Roboto] text-2xl font-bold">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#B5C5CA]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 text-[#15313D] sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div className="border-l-2 border-[#14B8A6] pl-7">
            <MapPin className="text-[#087F75]" size={30} />
            <h2 className="mt-6 font-[Roboto] text-4xl font-black leading-tight tracking-[-.035em] sm:text-5xl">
              Pensé pour les réalités des entreprises malgaches.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-[#52686F]">
            <p>
              Commerce de proximité, restaurant, hôtel, cabinet, prestataire B2B ou réseau de points de vente : chaque activité doit décrire précisément ses services, ses coordonnées et la zone qu’elle dessert réellement.
            </p>
            <p>
              ROBIA aide les petites équipes comme les organisations multi-sites à maintenir cette cohérence et à décider plus vite. Le copilote propose ; votre équipe choisit et valide.
            </p>
            <Link
              to="/seo-local-antananarivo"
              className="inline-flex items-center gap-2 font-bold text-[#087F75] hover:underline"
            >
              Découvrir le SEO local à Antananarivo
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F1EA] px-5 py-20 text-[#15313D] sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[10px] font-bold uppercase tracking-[.18em] text-[#087F75]">Questions fréquentes</p>
          <h2 className="mt-4 text-center font-[Roboto] text-4xl font-black tracking-[-.035em] sm:text-5xl">
            Comprendre Google Business Profile
          </h2>
          <div className="mt-12 divide-y divide-[#15313D]/20 border-y border-[#15313D]/20">
            {faqs.map((faq) => (
              <article key={faq.question} className="grid gap-4 py-8 md:grid-cols-[.8fr_1.2fr]">
                <h3 className="font-[Roboto] text-lg font-bold">{faq.question}</h3>
                <p className="text-sm leading-7 text-[#5F7076]">{faq.answer}</p>
              </article>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-6 bg-white p-8 sm:flex-row lg:p-10">
            <div>
              <strong className="font-[Roboto] text-2xl">Identifiez votre prochaine priorité locale.</strong>
              <p className="mt-2 text-sm text-[#617278]">Analysez votre présence et avancez avec un plan clair.</p>
            </div>
            <a
              href="https://app.robiacopilot.site"
              className="inline-flex shrink-0 items-center gap-3 bg-[#F97316] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#E5650C]"
            >
              Commencer avec ROBIA
              <ArrowRight size={17} />
            </a>
          </div>
          <Link to="/" className="mt-8 inline-block text-sm font-semibold text-[#087F75] hover:underline">
            ← Retour à l’accueil
          </Link>
        </div>
      </section>
    </>
  );
}
