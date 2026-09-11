import { Seo } from "../components/Seo";

const sections = [
  {
    title: "Objet",
    body: "Les présentes conditions encadrent l’accès à la vitrine ROBIA Copilot et aux services numériques proposés par ROBIA Digital. L’utilisation du tableau de bord peut être complétée par des conditions propres à l’offre souscrite.",
  },
  {
    title: "Accès et comptes",
    body: "L’utilisateur doit fournir des informations exactes, protéger ses accès et utiliser ROBIA uniquement à des fins licites. Toute tentative d’accès non autorisé, de perturbation du service ou d’exploitation abusive est interdite.",
  },
  {
    title: "Services et disponibilité",
    body: "ROBIA fournit des analyses, indicateurs et recommandations d’aide à la décision. Les résultats dépendent des données disponibles et ne constituent pas une garantie de classement, de chiffre d’affaires ou de performance commerciale. Le service peut évoluer ou être temporairement interrompu pour maintenance.",
  },
  {
    title: "Propriété intellectuelle",
    body: "Les marques, interfaces, textes, logiciels et éléments graphiques ROBIA restent la propriété de ROBIA Digital ou de leurs titulaires respectifs. Aucun droit de reproduction ou d’exploitation n’est accordé en dehors de l’usage normal du service.",
  },
  {
    title: "Responsabilité",
    body: "L’utilisateur reste responsable des décisions et contenus publiés à partir des recommandations ROBIA. Dans les limites permises par la loi, ROBIA Digital ne répond pas des dommages indirects ni des indisponibilités provenant de services tiers.",
  },
  {
    title: "Contact et évolution",
    body: "ROBIA Digital peut mettre à jour ces conditions lorsque le service évolue. La version publiée sur cette page est la version applicable. Pour toute question : hello@robia.digital.",
  },
];

export default function TermsOfUse() {
  return (
    <>
      <Seo
        title="Conditions générales d’utilisation | ROBIA Copilot"
        description="Consultez les conditions d’utilisation de la plateforme et du site ROBIA Copilot."
        canonicalPath="/conditions-utilisation"
        indexable={false}
      />
      <section className="bg-[#F3F1EA] px-5 pb-24 pt-32 text-[#15313D] sm:px-8 lg:px-12 lg:pt-40">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#087F75]">
            Dernière mise à jour · 9 septembre 2026
          </p>
          <h1 className="mt-6 font-[Roboto] text-5xl font-black tracking-[-.05em] sm:text-7xl">
            Conditions générales d’utilisation
          </h1>
          <div className="mt-14 divide-y divide-[#15313D]/20 border-y border-[#15313D]/20">
            {sections.map((section) => (
              <article key={section.title} className="grid gap-4 py-8 md:grid-cols-[.7fr_1.3fr]">
                <h2 className="font-[Roboto] text-xl font-bold">{section.title}</h2>
                <p className="text-sm leading-7 text-[#5F7076]">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
