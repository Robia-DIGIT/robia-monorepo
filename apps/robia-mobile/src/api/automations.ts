export type Condition = { field: string; operator: string; value?: unknown } | { all: Condition[] } | { any: Condition[] } | { not: Condition };
export type Step = { actionType: string; input?: Record<string, unknown> };
export type Automation = { id: string; name: string; description: string | null; enabled: boolean; requiresApproval: boolean; scope?: string; conditions?: Condition | null; trigger: { type: string; eventType?: string; cronExpression?: string; timezone?: string; nextRunAt?: string }; steps: Step[] };
export const ACTIONS = [
  { value: 'robia.report.prepare_organization_summary', label: 'Pr?parer un bilan' },
  { value: 'robia.audit.run_diagnostic', label: 'Analyser un site' },
  { value: 'robia.opportunities.regenerate', label: 'G?n?rer les priorit?s' },
  { value: 'robia.action_items.create_internal_task', label: 'Cr?er une t?che interne' },
  { value: 'robia.notification.send_email', label: 'M?envoyer un e-mail' },
  { value: 'robia.odc.prepare_application_summary', label: 'R?sumer un dossier' },
  { value: 'robia.odc.flag_missing_documents', label: 'V?rifier un dossier incomplet' },
  { value: 'robia.odc.create_review_task', label: 'Cr?er une t?che de revue' },
];
export const EVENTS = [
  { value: 'audit.completed', label: 'Audit termin?' },
  { value: 'odc.application.submitted', label: 'Candidature soumise' },
  { value: 'odc.application.incomplete', label: 'Dossier incomplet' },
  { value: 'odc.application.ready_for_review', label: 'Dossier pr?t ? examiner' },
  { value: 'odc.document.received', label: 'Pi?ce re?ue' },
  { value: 'odc.application.decided', label: 'D?cision enregistr?e' },
];
export const CONDITION_FIELDS = [
  { value: 'audit.ageDays', label: '?ge du dernier audit (jours)', numeric: true },
  { value: 'audit.status', label: 'Statut du dernier audit', numeric: false },
  { value: 'audit.globalScore', label: 'Score du dernier audit', numeric: true },
  { value: 'integration.googleSearchConsole.status', label: 'Connexion Google', numeric: false },
  { value: 'integration.meta.status', label: 'Connexion Meta', numeric: false },
  { value: 'opportunity.count', label: 'Opportunit?s ouvertes', numeric: true },
  { value: 'opportunity.highPriorityCount', label: 'Opportunit?s ? fort impact', numeric: true },
  { value: 'website.count', label: 'Nombre de sites', numeric: true },
];
export function normalizeCondition(node: Condition, depth = 0): Condition {
  if (depth > 6) throw new Error('Les conditions ne peuvent pas d?passer six niveaux.');
  if ('field' in node) {
    const field = CONDITION_FIELDS.find(f => f.value === node.field); if (!field) throw new Error('Champ de condition inconnu.');
    const allowed = field.numeric ? ['eq','ne','gt','gte','lt','lte','in','notIn','exists','notExists'] : ['eq','ne','in','notIn','exists','notExists'];
    if (!allowed.includes(node.operator)) throw new Error('Comparaison incompatible avec ' + field.label + '.');
    if (['exists','notExists'].includes(node.operator)) return { field: node.field, operator: node.operator };
    const values = ['in','notIn'].includes(node.operator) ? (Array.isArray(node.value) ? node.value : String(node.value ?? '').split('\n')) : [node.value];
    const parsed = values.map(v => { const text = String(v ?? '').trim(); if (!text) throw new Error('Renseignez la valeur de ' + field.label + '.'); const result = field.numeric ? Number(text.replace(',', '.')) : text; if (typeof result === 'number' && !Number.isFinite(result)) throw new Error(field.label + ' : nombre invalide.'); return result; });
    return { field: node.field, operator: node.operator, value: ['in','notIn'].includes(node.operator) ? parsed : parsed[0] };
  }
  if ('not' in node) return { not: normalizeCondition(node.not, depth + 1) };
  const children = 'all' in node ? node.all : node.any; if (!children.length) throw new Error('Ajoutez une r?gle ? chaque groupe.');
  return 'all' in node ? { all: children.map(n => normalizeCondition(n, depth + 1)) } : { any: children.map(n => normalizeCondition(n, depth + 1)) };
}
export function hasEventInput(steps: Step[]) { return JSON.stringify(steps).includes('{{event.'); }
export function validateEventInputs(steps: Step[], trigger: string, event: string) {
  const serialized = JSON.stringify(steps);
  if (!serialized.includes('{{event.')) return;
  if (trigger !== 'event') throw new Error('Une ?tape utilise l??v?nement : choisissez un d?clenchement sur ?v?nement.');
  if (serialized.includes('{{event.auditId}}') && event !== 'audit.completed') throw new Error('Ces ?tapes n?cessitent l??v?nement ? Audit termin? ?.');
  if (serialized.includes('{{event.applicationId}}') && !event.startsWith('odc.')) throw new Error('Ces ?tapes n?cessitent un ?v?nement de candidature.');
}
