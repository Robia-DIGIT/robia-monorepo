import { ArrowRight, BarChart3, BadgeCheck, MapPin, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";

const capabilities = [
  {
    icon: Search,
    title: "Diagnostiquer votre présence locale",
    text: "ROBIA analyse les pages de votre site et les signaux qui aident les moteurs de recherche et les assistants IA à comprendre votre activité, vos services et votre zone d’intervention.",
  },
  {
    icon: MapPin,
    title: "Renforcer vos signaux à Antananarivo",
    text: "L’analyse identifie les informations locales absentes ou imprécises : ville desservie, quartiers, coordonnées, pages de services et cohérence avec votre fiche Google Business Profile.",
  },
  {
    icon: BarChart3,
    title: "Prioriser les actions utiles",
    text: "Vous obtenez un score lisible et des recommandations classées par impact pour concentrer vos efforts sur les améliorations qui comptent vraiment.",
  },
];

const audiences = [
  "Commerces et établissements recevant des clients",
  "Restaurants, hôtels et acteurs du tourisme",
  "Cabinets, consultants et prestataires de services",
  "Entreprises B2B intervenant dans la capitale",
  "Réseaux disposant de plusieurs points de vente",
  "Entrepreneurs souhaitant développer leur présence numérique",
];

const faqs = [
  {
    question: "Qu’est-ce que le SEO local à Antananarivo ?",
    answer:
      "Le SEO local regroupe les optimisations qui permettent à une entreprise d’être mieux comprise et trouvée lorsqu’une personne recherche un produit ou un service à Antananarivo. Il concerne notamment le site web, les informations géographiques, les contenus locaux et la fiche Google Business Profile.",
  },
  {
    question: "ROBIA remplace-t-il une agence SEO ?",
    answer:
      "ROBIA sert de copilote : il mesure les signaux visibles, détecte les opportunités et propose un plan d’action priorisé. Une équipe interne, un consultant ou une agence peut ensuite exécuter ces recommandations plus efficacement.",
  },
  {
    question: "Puis-je analyser une entreprise située dans un autre quartier ?",
    answer:
      "Oui. Une entreprise peut indiquer sa zone d’intervention et adapter ses contenus aux quartiers ou communes réellement desservis, sans créer de pages artificielles ni revendiquer une adresse inexistante.",
  },
];

export default function LocalSeoAntananarivo() {
  return (
    <>
      <Seo
        title="SEO local à Antananarivo | ROBIA Copilot"
        description="Analysez et améliorez la visibilité locale de votre entreprise à Antananarivo grâce aux recommandations prioritaires de ROBIA Copilot."
        canonicalPath="/seo-local-antananarivo"
      />

      <section className="bg-[#F3F1EA] px-5 pb-20 pt-32 text-[#15313D] sm:px-8 lg:px-12 lg:pb-28 lg:pt-40">
        <div className="mx-auto max-w-7xl">
          <div className="border-t border-[#15313D]/40 pt-4 text-[10px] font-semibold uppercase tracking-[.18em] text-[#087F75]">
            Visibilité locale · Antananarivo, Madagascar
          </div>
          <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#087F75]">
                <MapPin size={16} />
                Développez votre présence dans la capitale
              </p>
              <h1 className="max-w-4xl font-[Roboto] text-[clamp(3rem,6vw,5.8rem)] font-black leading-[.95] tracking-[-.055em]">
                SEO local à Antananarivo :
                <span className="block text-[#087F75]">soyez trouvé au bon moment.</span>
              </h1>
            </div>
            <div className="border-l-2 border-[#F97316] pl-6">
              <p className="text-base leading-7 text-[#52686F]">
                ROBIA Copilot aide les entreprises d’Antananarivo à comprendre leur visibilité numérique, à repérer les signaux manquants et à transformer chaque diagnostic en actions concrètes.
              </p>
              <a
                href="https://app.robiacopilot.site"
                className="mt-7 inline-flex items-center gap-3 bg-[#F97316] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#E5650C]"
              >
                Analyser mon entreprise
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
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F97316]">Un enjeu local concret</p>
              <h2 className="mt-4 font-[Roboto] text-4xl font-black leading-tight tracking-[-.035em] sm:text-5xl">
                Être présent en ligne ne suffit plus.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-[#52686F]">
              <p>
                À Antananarivo, vos futurs clients comparent des entreprises depuis Google, les réseaux sociaux, les cartes et de plus en plus depuis des assistants alimentés par l’intelligence artificielle. Une présence locale incomplète peut rendre votre établissement difficile à identifier, même lorsque vos services répondent exactement à leur besoin.
              </p>
              <p>
                Votre site doit expliquer clairement ce que vous proposez, à qui vous vous adressez et dans quelle zone vous intervenez. Les informations importantes doivent rester cohérentes entre vos pages, votre fiche d’établissement et vos autres profils publics.
              </p>
              <p>
                ROBIA rassemble ces signaux dans un diagnostic compréhensible. Vous savez ce qui freine votre visibilité locale et quelle action traiter en premier, sans devoir parcourir plusieurs outils complexes.
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-px bg-[#DDE4E2] md:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <article key={title} className="bg-[#F7F6F1] p-8 lg:p-10">
                <Icon className="text-[#087F75]" size={28} />
                <h3 className="mt-8 font-[Roboto] text-2xl font-bold">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#617278]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#102B38] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8FE1D6]">Entreprises concernées</p>
            <h2 className="mt-4 max-w-xl font-[Roboto] text-4xl font-black leading-tight tracking-[-.035em] sm:text-5xl">
              Une analyse adaptée aux activités locales.
            </h2>
            <p className="mt-6 max-w-xl leading-7 text-[#B5C5CA]">
              ROBIA convient aux organisations qui souhaitent attirer, informer ou rassurer une clientèle située à Antananarivo et dans les communes environnantes.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {audiences.map((audience) => (
              <li key={audience} className="flex items-start gap-3 border border-white/15 p-5 text-sm leading-6 text-[#D9E3E5]">
                <BadgeCheck className="mt-0.5 shrink-0 text-[#14B8A6]" size={18} />
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
            Comprendre la visibilité locale
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
              <strong className="font-[Roboto] text-2xl">Découvrez votre score de visibilité.</strong>
              <p className="mt-2 text-sm text-[#617278]">Lancez un premier diagnostic et obtenez vos priorités.</p>
            </div>
            <a
              href="https://app.robiacopilot.site"
              className="inline-flex shrink-0 items-center gap-3 bg-[#F97316] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#E5650C]"
            >
              Commencer gratuitement
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
