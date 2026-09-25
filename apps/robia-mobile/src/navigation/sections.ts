export const VISIBILITY_SECTIONS = [
  { id: 'audits', label: 'Audits' },
  { id: 'performance', label: 'Performances' },
  { id: 'local', label: 'Local' },
] as const;
export const WORK_SECTIONS = [
  { id: 'actions', label: 'Actions' },
  { id: 'documents', label: 'Documents' },
  { id: 'programs', label: 'Candidatures' },
  { id: 'automations', label: 'Automatisations' },
] as const;
export function resolveSection(sections: readonly { id: string }[], requested?: string | string[]) {
  const id = Array.isArray(requested) ? requested[0] : requested;
  return sections.find(section => section.id === id)?.id ?? sections[0].id;
}
