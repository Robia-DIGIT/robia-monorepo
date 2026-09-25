import type { ActionItem, RobiaDocument } from './types';

export const DOCUMENT_TYPES = [
  { id: 'local_page', label: 'Pages locales', icon: 'place' },
  { id: 'faq', label: 'Questions / réponses', icon: 'question-answer' },
  { id: 'meta', label: 'SEO', icon: 'travel-explore' },
  { id: 'gbp_post', label: 'Publications', icon: 'campaign' },
  { id: 'review_reply', label: 'Réponses aux avis', icon: 'reviews' },
  { id: 'dev_brief', label: 'Briefs', icon: 'code' },
  { id: 'checklist', label: 'Checklists', icon: 'checklist' },
] as const;
export type DocumentFilter = 'all' | 'review' | 'approved' | 'rejected';
export const isApproved = (doc: RobiaDocument) => ['approved', 'validated'].includes(doc.status);
export const needsReview = (doc: RobiaDocument) => ['draft', 'edited', 'needs_review'].includes(doc.status);
export const normalizeSearch = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim();
const timestamp = (value: string) => { const time = Date.parse(value); return Number.isFinite(time) ? time : 0; };
export function selectDocuments(documents: readonly RobiaDocument[], query: string, type: string, status: DocumentFilter, sort: 'recent' | 'title') {
  const search = normalizeSearch(query);
  return documents.filter(doc => (type === 'all' || doc.type === type)
    && (status === 'all' || (status === 'approved' ? isApproved(doc) : status === 'review' ? needsReview(doc) : doc.status === 'rejected'))
    && normalizeSearch(doc.title + ' ' + doc.content).includes(search))
    .sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'fr') : timestamp(b.updatedAt) - timestamp(a.updatedAt));
}
export function documentExcerpt(content: string) {
  return content.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ').replace(/(^|\n)\s*[#>*-]+\s*/g, ' ').replace(/[*_~`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 240);
}

export type TaskFilter = 'all' | 'overdue' | 'today' | 'pending' | ActionItem['status'];
export type AgendaKey = 'overdue' | 'today' | 'upcoming' | 'unscheduled' | 'done' | 'ignored';
export const AGENDA_GROUPS: readonly { id: AgendaKey; label: string; hint: string }[] = [
  { id: 'overdue', label: 'En retard', hint: 'À reprendre en priorité' },
  { id: 'today', label: 'Aujourd’hui', hint: 'Votre programme du jour' },
  { id: 'upcoming', label: 'À venir', hint: 'Les prochaines échéances' },
  { id: 'unscheduled', label: 'À planifier', hint: 'Aucune échéance renseignée' },
  { id: 'done', label: 'Terminées', hint: 'Le travail accompli' },
  { id: 'ignored', label: 'Écartées', hint: 'Conservées pour référence' },
];
export function dueDay(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const day = match ? new Date(+match[1], +match[2] - 1, +match[3]) : new Date(value);
  if (!Number.isFinite(day.getTime())) return null;
  if (match && (day.getFullYear() !== +match[1] || day.getMonth() !== +match[2] - 1 || day.getDate() !== +match[3])) return null;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate());
}
export function agendaKey(task: ActionItem, now: Date): AgendaKey {
  if (task.status === 'done' || task.status === 'ignored') return task.status;
  const due = dueDay(task.dueDate);
  if (!due) return 'unscheduled';
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return due.getTime() < today ? 'overdue' : due.getTime() === today ? 'today' : 'upcoming';
}
export function selectTasks(tasks: readonly ActionItem[], query: string, filter: TaskFilter, now: Date) {
  const search = normalizeSearch(query);
  return tasks.filter(task => normalizeSearch(task.title).includes(search)
    && (filter === 'all' || (filter === 'pending' ? task.approvalStatus === 'pending' : ['overdue', 'today'].includes(filter) ? agendaKey(task, now) === filter : task.status === filter)))
    .sort((a, b) => (dueDay(a.dueDate)?.getTime() ?? Infinity) - (dueDay(b.dueDate)?.getTime() ?? Infinity) || timestamp(b.createdAt) - timestamp(a.createdAt));
}
export function taskSummary(tasks: readonly ActionItem[], now: Date) {
  const total = tasks.filter(task => task.status !== 'ignored').length;
  const done = tasks.filter(task => task.status === 'done').length;
  return { total, done, active: total - done, percent: total ? Math.round(done * 100 / total) : 0,
    overdue: tasks.filter(task => agendaKey(task, now) === 'overdue').length,
    today: tasks.filter(task => agendaKey(task, now) === 'today').length,
    pending: tasks.filter(task => task.approvalStatus === 'pending').length };
}
