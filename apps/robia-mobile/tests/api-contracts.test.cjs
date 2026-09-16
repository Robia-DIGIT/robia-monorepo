const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(require, module, module.exports);
  return module.exports;
}
const { apiRequest, ApiError, queryString } = load('src/api/client.ts');
const { assetValue, assetLabel } = load('src/api/integrations.ts');
const { normalizeWebsiteUrl, isSiteAudit, auditScore, DOCUMENT_STATUS_LABELS } = load('src/api/presentation.ts');

test('authenticated JSON request preserves headers and omits undefined fields', async t => {
  let captured;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    captured = { url, init };
    return new Response(JSON.stringify({ id: 'document' }), { headers: { 'content-type': 'application/json' } });
  });
  const data = await apiRequest('/documents/generate', {
    method: 'POST', token: 'test-token', body: { opportunityId: 'a', type: 'faq', ignored: undefined },
    headers: { 'X-Request-Id': 'correlation' },
  });
  assert.equal(data.id, 'document');
  assert.equal(captured.init.headers.get('Authorization'), 'Bearer test-token');
  assert.equal(captured.init.headers.get('X-Request-Id'), 'correlation');
  assert.deepEqual(JSON.parse(captured.init.body), { opportunityId: 'a', type: 'faq' });
});

test('validation errors surface NestJS messages and status', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    statusCode: 400, message: ['name is required', 'password is too short'],
  }), { status: 400, headers: { 'content-type': 'application/json' } }));
  await assert.rejects(apiRequest('/auth/register', { method: 'POST' }), error =>
    error instanceof ApiError && error.status === 400 && error.message.includes('name is required'));
});

test('an expired session remains distinguishable from network errors', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('Unauthorized', { status: 401 }));
  await assert.rejects(apiRequest('/users/me'), error => error.status === 401);
});

test('network failure does not retry a write', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new TypeError('offline'); });
  await assert.rejects(apiRequest('/actions/plan', { method: 'POST' }), error => error.status === 0);
  assert.equal(calls, 1);
});

test('timeouts abort requests and explain uncertain mutation outcomes', async t => {
  t.mock.method(globalThis, 'fetch', async (_, init) => new Promise((resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  await assert.rejects(apiRequest('/audits/run', { timeoutMs: 10, method: 'POST' }), error =>
    error.status === 0 && error.message.includes('vérifier le résultat'));
});

test('caller cancellation aborts the underlying fetch', async t => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (_, init) => new Promise((resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new Error('aborted')));
    controller.abort();
  }));
  await assert.rejects(apiRequest('/audits', { signal: controller.signal }), error =>
    error.status === 0 && error.message === 'Requête annulée.');
});

test('PDF export rejects an HTML response even with HTTP 200', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>proxy</html>', { headers: { 'content-type': 'text/html' } }));
  await assert.rejects(apiRequest('/actions/export', { responseType: 'blob' }), error => error.status === 502);
});

test('PDF export returns the real bytes', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('%PDF-1.4 test', { headers: { 'content-type': 'application/pdf' } }));
  const blob = await apiRequest('/actions/export', { responseType: 'blob' });
  assert.equal(await blob.text(), '%PDF-1.4 test');
});

test('empty and malformed API responses are handled explicitly', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }));
  assert.equal(await apiRequest('/websites/site', { method: 'DELETE' }), undefined);
  mock.mock.mockImplementation(async () => new Response('{invalid', { headers: { 'content-type': 'application/json' } }));
  await assert.rejects(apiRequest('/users/me'), error => error.message === 'Réponse serveur illisible.');
});

test('query parameters encode values and preserve false-like values', () => {
  assert.equal(queryString({ audit_id: 'a/b & c', missing: undefined, include_archived: 'false' }), '?audit_id=a%2Fb%20%26%20c&include_archived=false');
});

test('Meta asset selection uses pageId and pageName from the backend', () => {
  const asset = { pageId: '1234', pageName: 'Mon commerce', selected: false };
  assert.equal(assetValue(asset, 'pageId'), '1234');
  assert.equal(assetLabel(asset), 'Mon commerce');
  assert.equal(assetValue({ siteUrl: 'sc-domain:example.com', selected: false }, 'siteUrl'), 'sc-domain:example.com');
});

test('both direct multi-page results and nested results are recognized', () => {
  assert.equal(isSiteAudit({ site_audit: { pages: [] } }), true);
  assert.equal(isSiteAudit({ pages: [], detailed_findings: [] }), true);
  assert.equal(isSiteAudit({ global_score: 40 }), false);
});

test('scores preserve legacy values and distinguish missing data from zero', () => {
  assert.deepEqual(auditScore({ globalScore: 0, resultJson: { seo_score_v2: { globalScore: 90 } } }), { value: 0, label: 'Score de visibilité' });
  assert.deepEqual(auditScore({ globalScore: null, resultJson: { seo_score_v2: { globalScore: 65 } } }), { value: 65, label: 'Score SEO' });
  assert.equal(auditScore({ globalScore: null, resultJson: null }).value, null);
});

test('documents requiring review or rejection are never labeled validated', () => {
  assert.equal(DOCUMENT_STATUS_LABELS.needs_review, 'À vérifier');
  assert.equal(DOCUMENT_STATUS_LABELS.rejected, 'Rejeté');
});

test('website inputs normalize without accepting credentials or non-web schemes', () => {
  assert.equal(normalizeWebsiteUrl(' example.com#contact '), 'https://example.com/');
  assert.equal(normalizeWebsiteUrl('https://example.com'), normalizeWebsiteUrl('https://example.com/'));
  for (const input of ['ftp://example.com', 'javascript:alert(1)', 'https://user:password@example.com', 'not a url']) {
    assert.throws(() => normalizeWebsiteUrl(input));
  }
});
