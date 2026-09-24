export type ProgramField = { id?: string; key: string; label: string; required: boolean; fieldType: 'text' | 'longtext' | 'number' | 'date' | 'select'; options?: unknown; sortOrder?: number };
export type Criterion = { id?: string; key: string; label: string; description?: string | null; weight: number; maxPoints: number; required: boolean; sortOrder?: number };
export type DocumentType = { id?: string; key: string; label: string; required: boolean; mimeAllow: string[] };
export type Program = { id: string; slug: string; name: string; description: string | null; status: string; opensAt: string | null; closesAt: string | null; requireDualReview: boolean; decisionThreshold: number | null; fields: ProgramField[]; criteria: Criterion[]; docTypes: DocumentType[] };
export type Applicant = { id: string; displayName: string; email: string | null; phone: string | null };
export type ApplicationDocument = { id: string; documentTypeId: string; originalName: string; mimeType: string; sizeBytes: number; status: string };
export type ScoreLine = { criterionId: string; proposedPoints: number | null; finalPoints: number | null; proposedBy: string; rationale: string | null };
export type HistoryEvent = { id: string; eventType: string; fromStatus: string | null; toStatus: string | null; createdAt: string; actorUserId: string | null; payload?: { reason?: string; decisionReason?: string } | null };
export type Application = { id: string; programId: string; applicantId: string; status: string; applicant: Applicant; program: Program; answers: Record<string, unknown>; documents: ApplicationDocument[]; scoreLines: ScoreLine[]; proposedTotal: number | null; finalTotal: number | null; summaryDraft: string | null; missing: string[] | null; decisionReason: string | null; updatedAt: string };
export type Outreach = { id: string; applicationId: string; applicantName: string; recipientMasked: string; status: string; sortOrder: number; sentAt: string | null; lastError: string | null; isNext: boolean };
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const terminal = (status: string) => ['accepted', 'rejected', 'withdrawn'].includes(status);
export const canEditAnswers = (status: string) => ['draft', 'incomplete'].includes(status);
export const canUpload = (status: string) => ['draft', 'incomplete', 'in_review'].includes(status);
export const canDecide = (status: string) => ['in_review', 'waitlisted'].includes(status);
export function slugify(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
export function integer(value: string, label: string, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!/^\d+$/.test(value.trim())) throw new Error(label + ' : saisissez un nombre entier.');
  const n = Number(value); if (!Number.isSafeInteger(n) || n < min || n > max) throw new Error(label + ' : valeur attendue entre ' + min + ' et ' + max + '.');
  return n;
}
export function dateInput(value: string, label: string) {
  if (!value.trim()) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error(label + ' : utilisez une date valide au format AAAA-MM-JJ.');
  return value;
}
export function answersPayload(fields: ProgramField[], values: Record<string, string>) {
  const answers: Record<string, unknown> = {};
  for (const f of fields) {
    const value = values[f.key] ?? '';
    if (f.fieldType === 'number' && value.trim()) {
      const n = Number(value.replace(',', '.')); if (!Number.isFinite(n)) throw new Error(f.label + ' : nombre invalide.'); answers[f.key] = n;
    } else if (f.fieldType === 'date' && value) answers[f.key] = dateInput(value, f.label);
    else if (f.fieldType === 'select' && value && (!Array.isArray(f.options) || !f.options.includes(value))) throw new Error(f.label + ' : choisissez une option proposée.');
    else answers[f.key] = value.trim();
  }
  return { answers };
}
export function missingLabels(application: Application) {
  return (application.missing ?? []).map(key => {
    const [kind, ...parts] = key.split(':'); const value = parts.join(':');
    return (kind === 'field' ? application.program.fields : application.program.docTypes).find(item => item.key === value)?.label ?? value;
  });
}
// Only DTO fields are sent: backend rejects IDs and other relation properties.
export function definitionPayload(program: Pick<Program, 'fields' | 'criteria' | 'docTypes'>) {
  for (const list of [program.fields, program.criteria, program.docTypes]) {
    if (list.length > 50) throw new Error('Limite de 50 éléments par rubrique.');
    if (new Set(list.map(item => item.key)).size !== list.length || list.some(item => !item.key || !item.label.trim())) throw new Error('Chaque élément doit avoir un intitulé et une référence uniques.');
  }
  return {
    fields: program.fields.map(({ key, label, required, fieldType, options }, sortOrder) => {
      if (fieldType === 'select' && (!Array.isArray(options) || !options.length)) throw new Error(label + ' : ajoutez au moins une option.');
      return { key, label: label.trim(), required, fieldType, ...(fieldType === 'select' ? { options } : {}), sortOrder };
    }),
    criteria: program.criteria.map(({ key, label, description, weight, maxPoints, required }, sortOrder) => ({ key, label: label.trim(), description: description ?? undefined, weight: integer(String(weight), label, 1), maxPoints: integer(String(maxPoints), label, 1), required, sortOrder })),
    docTypes: program.docTypes.map(({ key, label, required, mimeAllow }) => {
      if (!mimeAllow.length) throw new Error(label + ' : choisissez au moins un format.');
      return { key, label: label.trim(), required, mimeAllow };
    }),
  };
}
