/* global __dirname */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/api/workspace-presentation.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
new Function('module', 'exports', source)(moduleUnderTest, moduleUnderTest.exports);
const { selectDocuments, documentExcerpt, dueDay, agendaKey, selectTasks, taskSummary } = moduleUnderTest.exports;
const now = new Date(2026, 8, 25, 13);
const document = (id, status, extra = {}) => ({ id, status, title: 'Réponse client ' + id, content: 'Préparer la réunion', type: 'review_reply', updatedAt: '2026-09-25T10:00:00Z', ...extra });
const task = (id, status, dueDate, extra = {}) => ({ id, status, dueDate, title: 'Publier ' + id, createdAt: '2026-09-20T10:00:00Z', ...extra });
test('document validation never confuses a draft or edited document with an approval', () => {
  const documents = ['draft', 'edited', 'needs_review', 'approved', 'validated', 'rejected'].map(status => document(status, status));
  assert.deepEqual(selectDocuments(documents, '', 'all', 'approved', 'title').map(d => d.status), ['approved', 'validated']);
  assert.deepEqual(selectDocuments(documents, '', 'all', 'review', 'title').map(d => d.status), ['draft', 'edited', 'needs_review']);
  assert.deepEqual(selectDocuments(documents, '', 'all', 'rejected', 'title').map(d => d.status), ['rejected']);
});
test('document search combines accents, collection, status and deterministic sort without mutating input', () => {
  const documents = [document('z', 'approved', { updatedAt: '2026-09-20T00:00:00Z' }), document('a', 'approved'), document('b', 'draft', { type: 'faq' })];
  const original = [...documents];
  assert.deepEqual(selectDocuments(documents, 'reunion', 'review_reply', 'approved', 'recent').map(d => d.id), ['a', 'z']);
  assert.equal(selectDocuments(documents, 'introuvable', 'all', 'all', 'recent').length, 0);
  assert.deepEqual(documents, original);
  assert.equal(documentExcerpt('# Titre\n**Texte** [lien](https://example.com) <b>utile</b>'), 'Titre Texte lien utile');
});
test('agenda uses local calendar days and ignores time of day for due-today actions', () => {
  assert.equal(agendaKey(task('today', 'todo', '2026-09-25'), now), 'today');
  assert.equal(agendaKey(task('today', 'in_progress', new Date(2026, 8, 25, 0, 1).toISOString()), now), 'today');
  assert.equal(agendaKey(task('late', 'blocked', '2026-09-24'), now), 'overdue');
  assert.equal(agendaKey(task('future', 'todo', '2026-09-26'), now), 'upcoming');
  assert.equal(agendaKey(task('none', 'todo', null), now), 'unscheduled');
  assert.equal(dueDay('2026-02-30'), null);
  assert.equal(dueDay('not-a-date'), null);
});
test('completed and ignored actions are never overdue and ignored actions do not distort progress', () => {
  const tasks = [task('done', 'done', '2020-01-01'), task('ignored', 'ignored', '2020-01-01'), task('late', 'todo', '2026-09-24'), task('pending', 'in_progress', null, { approvalStatus: 'pending' })];
  assert.equal(agendaKey(tasks[0], now), 'done');
  assert.equal(agendaKey(tasks[1], now), 'ignored');
  assert.deepEqual(taskSummary(tasks, now), { total: 3, done: 1, active: 2, percent: 33, overdue: 1, today: 0, pending: 1 });
  assert.equal(taskSummary([], now).percent, 0);
});
test('task filters keep blocked, ignored and pending approval actions reachable', () => {
  const tasks = [task('blocked', 'blocked', null), task('ignored', 'ignored', null), task('pending', 'todo', '2026-09-25', { approvalStatus: 'pending' }), task('late', 'todo', '2026-09-22')];
  for (const filter of ['blocked', 'ignored', 'pending', 'today', 'overdue']) assert.equal(selectTasks(tasks, '', filter, now).length, 1);
  assert.deepEqual(selectTasks(tasks, 'PUBLIER', 'all', now).slice(0, 2).map(t => t.id), ['late', 'pending']);
});
