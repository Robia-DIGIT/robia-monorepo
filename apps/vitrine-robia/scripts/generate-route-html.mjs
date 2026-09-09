import { readFile, writeFile } from "node:fs/promises";

const origin = "https://robiacopilot.site";
const localFaqs = [
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

const localStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": `${origin}/seo-local-antananarivo#service`,
      name: "Audit et optimisation SEO local à Antananarivo",
      serviceType: "SEO local et visibilité numérique",
      description:
        "ROBIA Copilot analyse les signaux de visibilité locale et priorise les actions SEO des entreprises à Antananarivo.",
      url: `${origin}/seo-local-antananarivo`,
      provider: {
        "@type": "Organization",
        name: "ROBIA Digital",
        url: `${origin}/`,
      },
      areaServed: {
        "@type": "City",
        name: "Antananarivo",
        containedInPlace: { "@type": "Country", name: "Madagascar" },
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: localFaqs.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
};

const businessProfileFaqs = [
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

const businessProfileStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": `${origin}/optimisation-google-business-profile-madagascar#service`,
      name: "Optimisation Google Business Profile à Madagascar",
      serviceType: "Audit et optimisation de fiche Google Business Profile",
      description:
        "ROBIA Copilot analyse les signaux d’une fiche Google Business Profile et priorise les actions de visibilité locale à Madagascar.",
      url: `${origin}/optimisation-google-business-profile-madagascar`,
      provider: {
        "@type": "Organization",
        name: "ROBIA Digital",
        url: `${origin}/`,
      },
      areaServed: { "@type": "Country", name: "Madagascar" },
    },
    {
      "@type": "FAQPage",
      mainEntity: businessProfileFaqs.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
};

const routes = [
  {
    path: "/seo-local-antananarivo",
    title: "SEO local à Antananarivo | ROBIA Copilot",
    description:
      "Analysez et améliorez la visibilité locale de votre entreprise à Antananarivo grâce aux recommandations prioritaires de ROBIA Copilot.",
    robots: "index, follow",
    structuredData: localStructuredData,
  },
  {
    path: "/optimisation-google-business-profile-madagascar",
    title: "Optimisation Google Business Profile à Madagascar | ROBIA",
    description:
      "Analysez votre fiche Google Business Profile à Madagascar et obtenez des actions prioritaires, claires et validées par votre équipe avec ROBIA.",
    robots: "index, follow",
    structuredData: businessProfileStructuredData,
  },
  {
    path: "/confidentialite",
    title: "Politique de confidentialité | ROBIA Copilot",
    description:
      "Découvrez comment ROBIA Digital collecte, utilise et protège les données personnelles sur robiacopilot.site.",
    robots: "noindex, follow",
  },
  {
    path: "/conditions-utilisation",
    title: "Conditions générales d’utilisation | ROBIA Copilot",
    description:
      "Consultez les conditions d’utilisation de la plateforme et du site ROBIA Copilot.",
    robots: "noindex, follow",
  },
];

const baseHtml = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");

for (const route of routes) {
  const url = `${origin}${route.path}`;
  let html = baseHtml
    .replace(/<title>[^<]*<\/title>/i, `<title>${route.title}</title>`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/i, `<link rel="canonical" href="${url}" />`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, "");
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${route.description}" />`,
  );
  html = html.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${route.robots}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${route.title}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${route.description}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${url}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${route.title}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${route.description}" />`,
  );
  if (route.structuredData) {
    html = html.replace(
      "</head>",
      `    <script type="application/ld+json">${JSON.stringify(route.structuredData)}</script>\n  </head>`,
    );
  }
  await writeFile(
    new URL(`../dist${route.path}.html`, import.meta.url),
    html,
    "utf8",
  );
}

console.log(`Generated static metadata for ${routes.length} routes.`);
