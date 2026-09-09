import { Seo } from "../components/Seo";

const sections = [
  {
    title: "Responsable du traitement",
    body: "ROBIA Digital exploite robiacopilot.site et traite les données décrites sur cette page. Pour toute question ou demande relative à vos données, écrivez à hello@robia.digital.",
  },
  {
    title: "Données collectées",
    body: "Le formulaire de contact peut recueillir votre nom, adresse e-mail, téléphone, entreprise et message. Des données techniques de sécurité peuvent être enregistrées par l’hébergement. Google Analytics est chargé uniquement après votre consentement et mesure notamment les pages vues, interactions et informations techniques générales.",
  },
  {
    title: "Finalités",
    body: "Les données servent à répondre aux demandes commerciales, fournir et sécuriser les services ROBIA, mesurer l’utilisation de la vitrine et améliorer son contenu. Les données Analytics ne sont pas utilisées avant votre accord.",
  },
  {
    title: "Durées et destinataires",
    body: "Les données Analytics sont configurées avec une conservation de 14 mois. Les demandes de prospects sont conservées le temps nécessaire à leur traitement et au suivi de la relation. L’accès est limité à ROBIA Digital et aux prestataires techniques indispensables au fonctionnement du service.",
  },
  {
    title: "Vos droits",
    body: "Vous pouvez demander l’accès, la rectification ou la suppression de vos données, vous opposer à certains traitements et retirer votre consentement Analytics à tout moment via « Gérer mes cookies » dans le pied de page. Contact : hello@robia.digital.",
  },
];

export default function PrivacyPolicy() {
  return (
    <>
      <Seo
        title="Politique de confidentialité | ROBIA Copilot"
        description="Découvrez comment ROBIA Digital collecte, utilise et protège les données personnelles sur robiacopilot.site."
        canonicalPath="/confidentialite"
      />
      <section className="bg-[#F3F1EA] px-5 pb-24 pt-32 text-[#15313D] sm:px-8 lg:px-12 lg:pt-40">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#087F75]">
            Dernière mise à jour · 9 septembre 2026
          </p>
          <h1 className="mt-6 font-[Roboto] text-5xl font-black tracking-[-.05em] sm:text-7xl">
            Politique de confidentialité
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#61747A]">
            ROBIA Digital applique un principe simple : collecter uniquement les
            données nécessaires et laisser à chaque visiteur le contrôle de la
            mesure Analytics.
          </p>
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
