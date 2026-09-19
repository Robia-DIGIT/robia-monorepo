/** Preset Orange Formation / cohorte — même moteur ODC, autre métier. */

export const ODC_FORMATION_PROGRAM_SLUG = 'odc-formation-2026'

export const ODC_FORMATION_PROGRAM = {
  slug: ODC_FORMATION_PROGRAM_SLUG,
  name: 'Orange Formation — Cohorte 2026',
  description:
    'Inscriptions à une cohorte de formation ODC. Complétude déterministe, scoring proposé. L’admission en session reste humaine.',
  opensAt: '2026-09-17T00:00:00.000Z',
  closesAt: '2026-12-31T23:59:59.000Z',
  requireDualReview: false,
  decisionThreshold: 60,
  fields: [
    {
      key: 'track',
      label: 'Parcours',
      required: true,
      fieldType: 'select' as const,
      options: ['développement', 'digital', 'entrepreneuriat', 'autre'],
      sortOrder: 1,
    },
    {
      key: 'city',
      label: 'Ville',
      required: true,
      fieldType: 'text' as const,
      sortOrder: 2,
    },
    {
      key: 'session',
      label: 'Session souhaitée',
      required: true,
      fieldType: 'text' as const,
      sortOrder: 3,
    },
    {
      key: 'motivation',
      label: 'Motivation',
      required: true,
      fieldType: 'longtext' as const,
      sortOrder: 4,
    },
  ],
  criteria: [
    {
      key: 'motivation_clarity',
      label: 'Clarté du projet pédagogique',
      weight: 2,
      maxPoints: 10,
      required: true,
      sortOrder: 1,
    },
    {
      key: 'fit_track',
      label: 'Adéquation au parcours',
      weight: 2,
      maxPoints: 10,
      required: true,
      sortOrder: 2,
    },
    {
      key: 'availability',
      label: 'Disponibilité',
      weight: 1,
      maxPoints: 10,
      required: false,
      sortOrder: 3,
    },
  ],
  docTypes: [
    {
      key: 'cin',
      label: 'Pièce d’identité',
      required: true,
      mimeAllow: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    {
      key: 'cv',
      label: 'CV',
      required: true,
      mimeAllow: ['application/pdf'],
    },
  ],
}
