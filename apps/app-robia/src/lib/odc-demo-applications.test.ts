import { describe, expect, it } from 'vitest'
import { answersForDemoPerson, ODC_DEMO_PEOPLE } from './odc-demo-applications'
import type { OdcProgram } from './api'

const program: OdcProgram = {
  id: 'p1',
  organizationId: 'o1',
  slug: 'odc-appel-2026',
  name: 'ODC',
  description: null,
  status: 'open',
  opensAt: null,
  closesAt: null,
  requireDualReview: false,
  decisionThreshold: 60,
  createdById: 'u1',
  createdAt: '2026-09-17T00:00:00Z',
  updatedAt: '2026-09-17T00:00:00Z',
  fields: [
    { id: 'f1', key: 'project_name', label: 'Nom', required: true, fieldType: 'text', options: null, sortOrder: 1 },
    { id: 'f2', key: 'city', label: 'Ville', required: true, fieldType: 'text', options: null, sortOrder: 2 },
    {
      id: 'f3',
      key: 'sector',
      label: 'Secteur',
      required: true,
      fieldType: 'select',
      options: ['commerce', 'tech'],
      sortOrder: 3,
    },
    { id: 'f4', key: 'pitch', label: 'Pitch', required: true, fieldType: 'longtext', options: null, sortOrder: 4 },
  ],
  criteria: [],
  docTypes: [],
}

describe('answersForDemoPerson', () => {
  it('fills required Appel 2026 fields without a 0 score invention', () => {
    const answers = answersForDemoPerson(program, ODC_DEMO_PEOPLE[0])
    expect(answers.project_name).toBe(ODC_DEMO_PEOPLE[0].project)
    expect(answers.city).toBe('Antananarivo')
    expect(answers.sector).toBe('commerce')
    expect(answers.pitch).toEqual(expect.any(String))
    expect(ODC_DEMO_PEOPLE.every((person) => person.email.endsWith('@example.com'))).toBe(true)
  })
})
