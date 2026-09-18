import type { Automation, CreateAutomationPayload, OdcProgram } from './api'

export type OdcProgramKind = 'appel' | 'formation'

export function odcProgramKind(program: Pick<OdcProgram, 'slug' | 'name'>): OdcProgramKind {
  const haystack = `${program.slug} ${program.name}`.toLowerCase()
  if (haystack.includes('formation') || haystack.includes('cohorte')) return 'formation'
  return 'appel'
}

export function odcProgramKindLabel(kind: OdcProgramKind): { label: string; variant: 'teal' | 'blue' } {
  return kind === 'formation'
    ? { label: 'Formation', variant: 'blue' }
    : { label: 'Candidature', variant: 'teal' }
}

export function isOdcAutomation(automation: Automation): boolean {
  if (automation.scope === 'PROGRAM' || automation.scope === 'COHORT') return true
  return automation.steps.some((step) => step.actionType.startsWith('robia.odc.'))
}

export function isFormationAutomation(automation: Automation): boolean {
  if (automation.scope === 'COHORT') return true
  const haystack = `${automation.name} ${automation.description ?? ''}`.toLowerCase()
  return haystack.includes('formation') || haystack.includes('cohorte')
}

export type OdcTaskTemplate = {
  key: string
  domain: 'appel' | 'formation'
  label: string
  hint: string
  payload: CreateAutomationPayload
}

function odcEventTemplate(
  key: string,
  domain: OdcTaskTemplate['domain'],
  label: string,
  hint: string,
  name: string,
  eventType: string,
  actionType: string,
  scope: 'PROGRAM' | 'COHORT',
): OdcTaskTemplate {
  return {
    key,
    domain,
    label,
    hint,
    payload: {
      name,
      description: hint,
      scope,
      trigger: { type: 'event', eventType },
      steps: [
        {
          actionType,
          input: { applicationId: '{{event.applicationId}}' },
        },
      ],
      requiresApproval: true,
      enabled: true,
    },
  }
}

export const ODC_TASK_TEMPLATES: OdcTaskTemplate[] = [
  odcEventTemplate(
    'odc-summary-on-submit',
    'appel',
    'Résumé à la soumission',
    'Dès qu’un dossier est soumis : brouillon de résumé. L’humain relit. Jamais une décision.',
    'ODC — résumé à la soumission',
    'odc.application.submitted',
    'robia.odc.prepare_application_summary',
    'PROGRAM',
  ),
  odcEventTemplate(
    'odc-flag-incomplete',
    'appel',
    'Rappel pièces manquantes',
    'Dossier incomplet : recalcul déterministe des pièces/champs. Peut repasser en revue, jamais accepté/refusé.',
    'ODC — pièces manquantes',
    'odc.application.incomplete',
    'robia.odc.flag_missing_documents',
    'PROGRAM',
  ),
  odcEventTemplate(
    'odc-review-task',
    'appel',
    'Tâche de revue',
    'Dossier prêt : crée une tâche interne en brouillon. Un humain doit encore décider.',
    'ODC — tâche de revue',
    'odc.application.ready_for_review',
    'robia.odc.create_review_task',
    'PROGRAM',
  ),
  odcEventTemplate(
    'formation-review-task',
    'formation',
    'Revue de dossier formation',
    'Cohorte : tâche de revue à chaque dossier prêt. Décision humaine obligatoire.',
    'Formation — tâche de revue cohorte',
    'odc.application.ready_for_review',
    'robia.odc.create_review_task',
    'COHORT',
  ),
  odcEventTemplate(
    'formation-summary-on-submit',
    'formation',
    'Résumé dossier formation',
    'Soumission d’un inscrit formation : résumé brouillon, pas d’admission automatique.',
    'Formation — résumé à la soumission',
    'odc.application.submitted',
    'robia.odc.prepare_application_summary',
    'COHORT',
  ),
  odcEventTemplate(
    'formation-flag-incomplete',
    'formation',
    'Rappel pièces formation',
    'Inscription incomplète : recalcul des pièces/champs. Peut repasser en revue, jamais admis automatiquement.',
    'Formation — pièces manquantes',
    'odc.application.incomplete',
    'robia.odc.flag_missing_documents',
    'COHORT',
  ),
]

export function templateAlreadyInstalled(
  template: OdcTaskTemplate,
  automations: Automation[],
): boolean {
  return automations.some((automation) => automation.name === template.payload.name)
}
