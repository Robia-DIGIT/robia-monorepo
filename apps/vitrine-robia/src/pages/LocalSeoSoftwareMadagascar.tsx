import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  Bot,
  Building2,
  CheckCircle2,
  Gauge,
  MapPin,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";

const capabilities = [
  {
    icon: BarChart3,
    title: "Rassembler vos données Google",
    text: "Consultez les signaux utiles de Google Search Console, Google Analytics et de votre présence locale depuis un espace de travail commun.",
  },
  {
    icon: Gauge,
    title: "Comprendre votre visibilité",
    text: "Un score lisible et des indicateurs synthétiques transforment les données dispersées en diagnostic compréhensible par toute l’équipe.",
  },
  {
    icon: Search,
    title: "Détecter les écarts prioritaires",
    text: "ROBIA repère les informations manquantes, les incohérences et les opportunités liées à votre site, vos recherches et votre présence locale.",
  },
  {
    icon: Bot,
    title: "Préparer les prochaines actions",
    text: "Le copilote propose un plan court et contextualisé, avec des suggestions de contenu que votre équipe peut adapter avant publication.",
  },
  {
    icon: CheckCircle2,
    title: "Garder une validation humaine",
    text: "Aucune recommandation importante n’est appliquée à votre place : vous vérifiez, choisissez et validez chaque changement.",
  },
  {
    icon: Building2,
    title: "Piloter un ou plusieurs sites",
    text: "Suivez une entreprise locale ou structurez progressivement la visibilité de plusieurs établissements depuis la même méthode de travail.",
  },
];

const workflow = [
  {
    number: "01",
    title: "Connecter",
    text: "Reliez les sources Google autorisées pour éviter les exports et les tableaux dispersés.",
  },
  {
    number: "02",
    title: "Analyser",
    text: "ROBIA organise les signaux disponibles et fait ressortir les points qui méritent votre attention.",
  },
  {
    number: "03",
    title: "Prioriser",
    text: "Recevez quelques actions classées selon leur impact attendu et le temps nécessaire.",
  },
  {
    number: "04",
    title: "Valider et mesurer",
    text: "Votre équipe exécute les actions retenues puis observe leur évolution dans le temps.",
  },
];

const audiences = [
  "Commerces et services de proximité",
  "TPE et PME en croissance",
  "Restaurants, hôtels et tourisme",
  "Réseaux et entreprises multi-sites",
  "Équipes marketing et commerciales",
  "Agences et partenaires digitaux",
];

const faqs = [
  {
    question: "Qu’est-ce qu’un logiciel de SEO local ?",
    answer:
      "Un logiciel de SEO local rassemble des données et des recommandations pour aider une entreprise à améliorer la compréhension de son activité, de ses établissements et de ses zones desservies dans les recherches locales. Il facilite le diagnostic, la priorisation et le suivi, mais ne garantit pas une position donnée.",
  },
  {
    question: "ROBIA remplace-t-il une agence ou un spécialiste SEO ?",
    answer:
      "Non. ROBIA est un copilote de décision. Il rend les données accessibles, détecte les opportunités et prépare des actions. Une équipe interne, un consultant ou une agence conserve la stratégie, la validation et l’exécution.",
  },
  {
    question: "Quelles données Google puis-je consulter dans ROBIA ?",
    answer:
      "ROBIA peut présenter les données autorisées provenant notamment de Google Search Console et Google Analytics, ainsi que les informations utiles à la visibilité locale. Les sources disponibles dépendent des accès accordés par votre organisation.",
  },
  {
    question: "Le logiciel convient-il à une petite entreprise ?",
    answer:
      "Oui. L’interface est conçue pour transformer des indicateurs techniques en priorités compréhensibles. Une petite équipe peut commencer avec un seul site et avancer action par action.",
  },
  {
    question: "ROBIA peut-il suivre plusieurs établissements ?",
    answer:
      "Oui. La méthode convient aux réseaux et aux organisations qui doivent comparer plusieurs établissements et maintenir des informations cohérentes, tout en conservant une validation humaine.",
  },
  {
    question: "ROBIA garantit-il la première position sur Google ?",
    answer:
      "Non. Aucun logiciel ne peut garantir une position précise. ROBIA aide à prendre de meilleures décisions à partir des signaux disponibles et à suivre les effets des actions réalisées.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://robiacopilot.site/logiciel-seo-local-madagascar#software",
      name: "ROBIA Copilot",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Logiciel SEO local",
      operatingSystem: "Web",
      description:
        "Logiciel de pilotage SEO local qui centralise les données Google, détecte les opportunités et priorise les actions des entreprises à Madagascar.",
      url: "https://robiacopilot.site/logiciel-seo-local-madagascar",
      publisher: {
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

export default function LocalSeoSoftwareMadagascar() {
  return (
    <>
      <Seo
        title="Logiciel SEO local à Madagascar | ROBIA Copilot"
        description="Pilotez votre visibilité locale à Madagascar avec ROBIA : données Google centralisées, diagnostic lisible et actions SEO prioritaires à valider."
        canonicalPath="/logiciel-seo-local-madagascar"
        structuredData={structuredData}
      />

      <section className="bg-[#F3F1EA] px-5 pb-20 pt-32 text-[#15313D] sm:px-8 lg:px-12 lg:pb-28 lg:pt-40">
        <div className="mx-auto max-w-7xl">
          <div className="border-t border-[#15313D]/40 pt-4 text-[10px] font-semibold uppercase tracking-[.18em] text-[#087F75]">
            Plateforme SaaS · Visibilité locale · Madagascar
          </div>
          <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#087F75]">
                <MapPin size={16} />
                Des données à la prochaine action utile
              </p>
              <h1 className="max-w-5xl font-[Roboto] text-[clamp(3rem,6vw,5.8rem)] font-black leading-[.95] tracking-[-.055em]">
                Le logiciel SEO local
                <span className="block text-[#087F75]">pensé pour Madagascar.</span>
              </h1>
            </div>
            <div className="border-l-2 border-[#F97316] pl-6">
              <p className="text-base leading-7 text-[#52686F]">
                ROBIA Copilot rassemble vos signaux Google, explique ce qui freine votre visibilité et transforme le diagnostic en actions prioritaires. Vous décidez ; ROBIA vous guide.
              </p>
              <a
                href="https://app.robiacopilot.site"
                className="mt-7 inline-flex items-center gap-3 bg-[#F97316] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#E5650C]"
              >
                Découvrir mon diagnostic
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 text-[#15313D] sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F97316]">Un pilotage plus simple</p>
              <h2 className="mt-4 font-[Roboto] text-4xl font-black leading-tight tracking-[-.035em] sm:text-5xl">
                Sortez des tableaux dispersés et des priorités floues.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-[#52686F]">
              <p>
                Une entreprise locale doit suivre son site, ses recherches Google, ses audiences, ses établissements et les retours de ses clients. Lorsque ces informations restent séparées, il devient difficile de savoir quelle amélioration aura le plus d’impact.
              </p>
              <p>
                ROBIA crée un espace commun entre les données et la décision. Les indicateurs sont expliqués, les écarts sont regroupés et les recommandations sont classées pour éviter de disperser le temps de votre équipe.
              </p>
              <p>
                L’objectif n’est pas d’automatiser aveuglément votre communication. ROBIA prépare le travail, donne le contexte et laisse la validation aux personnes qui connaissent réellement l’entreprise et ses clients.
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-px bg-[#DDE4E2] md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <article key={title} className="bg-[#F7F6F1] p-8 lg:p-9">
                <Icon className="text-[#087F75]" size={27} />
                <h3 className="mt-7 font-[Roboto] text-xl font-bold">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#617278]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#102B38] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8FE1D6]">Fonctionnement</p>
              <h2 className="mt-4 max-w-xl font-[Roboto] text-4xl font-black leading-tight tracking-[-.035em] sm:text-5xl">
                Un cycle continu, pas un rapport oublié.
              </h2>
            </div>
            <p className="max-w-2xl leading-7 text-[#B5C5CA]">
              Connectez les données autorisées, comprenez la situation, choisissez la priorité, puis mesurez. Chaque nouveau signal alimente la prochaine décision.
            </p>
          </div>
          <div className="mt-14 grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((step) => (
              <article key={step.number} className="bg-[#102B38] p-7 lg:p-8">
                <span className="font-[Roboto] text-sm font-black text-[#14B8A6]">{step.number}</span>
                <h3 className="mt-7 font-[Roboto] text-2xl font-bold">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#B5C5CA]">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 text-[#15313D] sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F97316]">Pour qui ?</p>
            <h2 className="mt-4 max-w-xl font-[Roboto] text-4xl font-black leading-tight tracking-[-.035em] sm:text-5xl">
              Une même méthode, adaptée à votre organisation.
            </h2>
            <p className="mt-6 max-w-xl leading-7 text-[#617278]">
              Commencez avec une présence locale ou structurez le suivi de plusieurs établissements. ROBIA donne à chaque équipe un langage commun pour décider.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {audiences.map((audience) => (
              <li key={audience} className="flex items-start gap-3 border border-[#DDE4E2] bg-[#F7F6F1] p-5 text-sm font-semibold leading-6">
                <BadgeCheck className="mt-0.5 shrink-0 text-[#087F75]" size={18} />
                {audience}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#F3F1EA] px-5 py-20 text-[#15313D] sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[10px] font-bold uppercase tracking-[.18em] text-[#087F75]">Questions fréquentes</p>
          <h2 className="mt-4 text-center font-[Roboto] text-4xl font-black tracking-[-.035em] sm:text-5xl">
            Choisir un outil SEO local
          </h2>
          <div className="mt-12 divide-y divide-[#15313D]/20 border-y border-[#15313D]/20">
            {faqs.map((faq) => (
              <article key={faq.question} className="grid gap-4 py-8 md:grid-cols-[.8fr_1.2fr]">
                <h3 className="font-[Roboto] text-lg font-bold">{faq.question}</h3>
                <p className="text-sm leading-7 text-[#5F7076]">{faq.answer}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <Link
              to="/seo-local-antananarivo"
              className="flex items-center justify-between bg-white p-6 text-sm font-bold text-[#087F75] transition hover:-translate-y-0.5"
            >
              SEO local à Antananarivo
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/optimisation-google-business-profile-madagascar"
              className="flex items-center justify-between bg-white p-6 text-sm font-bold text-[#087F75] transition hover:-translate-y-0.5"
            >
              Optimiser votre fiche Google
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-6 bg-[#15313D] p-8 text-white sm:flex-row lg:p-10">
            <div>
              <strong className="font-[Roboto] text-2xl">Passez de la donnée à la priorité.</strong>
              <p className="mt-2 text-sm text-[#B5C5CA]">Découvrez ce que votre équipe doit améliorer en premier.</p>
            </div>
            <a
              href="https://app.robiacopilot.site"
              className="inline-flex shrink-0 items-center gap-3 bg-[#F97316] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#E5650C]"
            >
              Commencer avec ROBIA
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
