import { describe, expect, it } from 'vitest'
import type { Automation } from './api'
import {
  isFormationAutomation,
  isOdcAutomation,
  odcProgramKind,
  templateAlreadyInstalled,
  ODC_TASK_TEMPLATES,
} from './odc-ops'

function automation(overrides: Partial<Automation> = {}): Automation {
  return {
    id: 'a1',
    organizationId: 'o1',
    scope: 'ORGANIZATION',
    name: 'Audit',
    description: null,
    enabled: true,
    conditions: null,
    steps: [{ actionType: 'robia.audit.run_diagnostic' }],
    requiresApproval: true,
    createdById: 'u1',
    lastRunAt: null,
    nextRunAt: null,
    metadata: null,
    createdAt: '2026-09-17T00:00:00Z',
    updatedAt: '2026-09-17T00:00:00Z',
    trigger: {
      id: 't1',
      automationId: 'a1',
      type: 'manual',
      cronExpression: null,
      timezone: null,
      eventType: null,
      config: null,
      createdAt: '2026-09-17T00:00:00Z',
      updatedAt: '2026-09-17T00:00:00Z',
    },
    ...overrides,
  }
}

describe('odc-ops roles', () => {
  it('labels formation vs appel from slug/name', () => {
    expect(odcProgramKind({ slug: 'odc-appel-2026', name: 'Appel' })).toBe('appel')
    expect(odcProgramKind({ slug: 'odc-formation-2026', name: 'Cohorte' })).toBe('formation')
  })

  it('keeps PME automations out of the ODC engine', () => {
    expect(isOdcAutomation(automation())).toBe(false)
    expect(
      isOdcAutomation(
        automation({
          scope: 'PROGRAM',
          steps: [{ actionType: 'robia.odc.create_review_task' }],
        }),
      ),
    ).toBe(true)
  })

  it('detects formation automations by cohort scope', () => {
    expect(isFormationAutomation(automation({ scope: 'COHORT', name: 'x' }))).toBe(true)
    expect(isFormationAutomation(automation({ name: 'Formation — résumé' }))).toBe(true)
  })

  it('knows when a repetitive task template is already installed', () => {
    const template = ODC_TASK_TEMPLATES[0]
    expect(templateAlreadyInstalled(template, [])).toBe(false)
    expect(
      templateAlreadyInstalled(template, [automation({ name: template.payload.name })]),
    ).toBe(true)
    expect(template.payload.requiresApproval).toBe(true)
  })
})
