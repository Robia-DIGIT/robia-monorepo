import {
  addOdcDocument,
  createOdcApplicant,
  createOdcApplication,
  submitOdcApplication,
  updateOdcApplicationAnswers,
  type OdcApplication,
  type OdcField,
  type OdcProgram,
} from './api'

export const ODC_DEMO_PEOPLE = [
  {
    slug: 'fitia-razanadrakoto',
    displayName: 'Fitia Razanadrakoto',
    email: 'fitia.razanadrakoto@example.com',
    city: 'Antananarivo',
    project: 'Suivi des cultures pour les coopératives d’Analamanga',
    pitch:
      'Je veux structurer une plateforme de suivi des cultures pour les coopératives agricoles d’Analamanga.',
  },
  {
    slug: 'njaka-andriamahefa',
    displayName: 'Njaka Andriamahefa',
    email: 'njaka.andriamahefa@example.com',
    city: 'Toamasina',
    project: 'Place de marché mobile pour les artisans',
    pitch:
      'Mon projet connecte les artisans de Toamasina à des acheteurs internationaux via une place de marché mobile.',
  },
  {
    slug: 'voahangy-rasoanantenaina',
    displayName: 'Voahangy Rasoanantenaina',
    email: 'voahangy.rasoanantenaina@example.com',
    city: 'Fianarantsoa',
    project: 'Paiement de proximité pour petits commerces',
    pitch:
      'Je développe un service de paiement de proximité pour les petits commerces sans compte bancaire.',
  },
] as const

function firstSelectOption(field: OdcField): string {
  const options = field.options
  if (Array.isArray(options) && options.length > 0) {
    const first = options[0]
    if (typeof first === 'string' && first) return first
    if (first && typeof first === 'object' && 'value' in first) {
      const value = (first as { value: unknown }).value
      if (typeof value === 'string' && value) return value
    }
  }
  return 'tech'
}

export function answersForDemoPerson(
  program: OdcProgram,
  person: (typeof ODC_DEMO_PEOPLE)[number],
): Record<string, unknown> {
  const answers: Record<string, unknown> = {}
  for (const field of program.fields ?? []) {
    switch (field.key) {
      case 'project_name':
        answers[field.key] = person.project
        break
      case 'city':
        answers[field.key] = person.city
        break
      case 'pitch':
      case 'motivation':
      case 'visibility_need':
        answers[field.key] = person.pitch
        break
      case 'linkedin':
        answers[field.key] = `https://www.linkedin.com/in/${person.slug}`
        break
      case 'team_size':
        answers[field.key] = 4
        break
      case 'sector':
        answers[field.key] = firstSelectOption(field)
        break
      default:
        if (!field.required) break
        if (field.fieldType === 'number') answers[field.key] = 1
        else if (field.fieldType === 'select') answers[field.key] = firstSelectOption(field)
        else if (field.fieldType === 'date') answers[field.key] = '2026-09-17'
        else answers[field.key] = person.pitch
    }
  }
  return answers
}

export async function seedDemoApplicationsOnProgram(
  program: OdcProgram,
): Promise<OdcApplication[]> {
  const created: OdcApplication[] = []
  for (const person of ODC_DEMO_PEOPLE) {
    const applicant = await createOdcApplicant({
      displayName: person.displayName,
      email: person.email,
    })
    const draft = await createOdcApplication(program.id, { applicantId: applicant.id })
    await updateOdcApplicationAnswers(draft.id, answersForDemoPerson(program, person))
    for (const docType of program.docTypes ?? []) {
      if (!docType.required) continue
      const mimeType = docType.mimeAllow?.[0] || 'application/pdf'
      await addOdcDocument(draft.id, {
        documentTypeId: docType.id,
        originalName: `${person.slug}-${docType.key}.pdf`,
        mimeType,
        sizeBytes: 120_000,
        storageKey: `demo/seed/odc/${person.slug}-${docType.key}.pdf`,
      })
    }
    created.push(await submitOdcApplication(draft.id))
  }
  return created
}
