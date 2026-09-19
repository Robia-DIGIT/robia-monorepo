/** Preset Orange Digital Center — used by the programmes page one-click create. */

export const ODC_DEFAULT_PROGRAM_SLUG = "odc-appel-2026";

export const ODC_DEFAULT_PROGRAM = {
  slug: ODC_DEFAULT_PROGRAM_SLUG,
  name: "Orange Digital Center — Appel à candidatures 2026",
  description:
    "Appel ODC pour les porteurs de projet numériques. Présélection déterministe (complétude + scoring). La décision d’admission reste humaine, avec motif obligatoire.",
  opensAt: "2026-09-17T00:00:00.000Z",
  closesAt: "2026-12-31T23:59:59.000Z",
  requireDualReview: false,
  decisionThreshold: 60,
  fields: [
    {
      key: "project_name",
      label: "Nom du projet",
      required: true,
      fieldType: "text" as const,
      sortOrder: 1,
    },
    {
      key: "city",
      label: "Ville",
      required: true,
      fieldType: "text" as const,
      sortOrder: 2,
    },
    {
      key: "sector",
      label: "Secteur",
      required: true,
      fieldType: "select" as const,
      options: ["commerce", "services", "artisanat", "tech", "autre"],
      sortOrder: 3,
    },
    {
      key: "pitch",
      label: "Pitch du projet",
      required: true,
      fieldType: "longtext" as const,
      sortOrder: 4,
    },
    {
      key: "team_size",
      label: "Taille de l’équipe",
      required: false,
      fieldType: "number" as const,
      sortOrder: 5,
    },
    {
      key: "visibility_need",
      label: "Besoin de visibilité locale",
      required: false,
      fieldType: "longtext" as const,
      sortOrder: 6,
    },
  ],
  criteria: [
    {
      key: "impact_local",
      label: "Impact local",
      description: "Retombées pour le territoire et les usagers.",
      weight: 3,
      maxPoints: 10,
      required: true,
      sortOrder: 1,
    },
    {
      key: "faisabilite",
      label: "Faisabilité",
      description: "Capacité à exécuter dans le calendrier ODC.",
      weight: 2,
      maxPoints: 10,
      required: true,
      sortOrder: 2,
    },
    {
      key: "visibilite_digitale",
      label: "Visibilité digitale",
      description: "Potentiel de présence locale (GBP, contenus, canaux).",
      weight: 2,
      maxPoints: 10,
      required: false,
      sortOrder: 3,
    },
    {
      key: "alignement_odc",
      label: "Alignement ODC",
      description: "Adéquation avec les axes Orange Digital Center.",
      weight: 3,
      maxPoints: 10,
      required: true,
      sortOrder: 4,
    },
  ],
  docTypes: [
    {
      key: "cin",
      label: "Pièce d’identité",
      required: true,
      mimeAllow: ["application/pdf", "image/jpeg", "image/png"],
    },
    {
      key: "pitch_deck",
      label: "Pitch deck",
      required: true,
      mimeAllow: ["application/pdf"],
    },
    {
      key: "proof_activity",
      label: "Justificatif d’activité",
      required: false,
      mimeAllow: ["application/pdf", "image/jpeg", "image/png"],
    },
  ],
};
