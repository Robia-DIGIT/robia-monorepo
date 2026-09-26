/* global __dirname */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(relative, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require','module','exports',source)(name => mocks[name] ?? require(name),module,module.exports);
  return module.exports;
}
const odc = load('src/api/odc.ts');
const automation = load('src/api/automations.ts');
const { parseLocationsCsv, LOCATION_CSV_EXAMPLE } = load('src/api/location-import.ts');
const { apiRequest } = load('src/api/client.ts');
test('multipart uploads preserve the file and let fetch generate the boundary', async t => {
  let sent;
  t.mock.method(globalThis,'fetch',async (_,init) => { sent=init;return new Response('{"id":"d"}',{headers:{'content-type':'application/json'}}); });
  const body = new FormData(); body.append('documentTypeId','cv'); body.append('file',new Blob(['PDF'],{type:'application/pdf'}),'cv.pdf');
  await apiRequest('/odc/applications/a/documents/upload',{method:'POST',token:'sample',body,headers:{'Content-Type':'application/json'}});
  assert.equal(sent.body,body); assert.equal(sent.headers.has('Content-Type'),false);
  assert.equal(sent.headers.get('Authorization'),'Bearer sample');
  assert.deepEqual([...sent.body.keys()],['documentTypeId','file']);
});
test('document download supports real non-PDF bytes but keeps authorization errors',async t => {
  t.mock.method(globalThis,'fetch',async () => new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/png'}}));
  const blob=await apiRequest('/odc/documents/d/file',{responseType:'file',expectedContentType:'image/png'});
  assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())],[1,2,3]);
  t.mock.method(globalThis,'fetch',async () => new Response('{"message":"Session expirée"}',{status:401,headers:{'content-type':'application/json'}}));
  await assert.rejects(apiRequest('/odc/documents/d/file',{responseType:'file'}),e=>e.status===401);
});
test('a login HTML response cannot be saved as an application attachment',async t => {
  t.mock.method(globalThis,'fetch',async () => new Response('<html>Login</html>',{headers:{'content-type':'text/html'}}));
  await assert.rejects(apiRequest('/odc/documents/d/file',{responseType:'file',expectedContentType:'application/pdf'}),e=>e.status===502);
});
test('document revision conflicts remain visible and are not retried',async t => {
  let attempts=0;
  t.mock.method(globalThis,'fetch',async (_,init) => { attempts++;assert.deepEqual(JSON.parse(init.body),{content:'Texte',expectedRevision:3});return new Response('{"message":"Document modifié"}',{status:409,headers:{'content-type':'application/json'}}); });
  await assert.rejects(apiRequest('/documents/d',{method:'PATCH',body:{content:'Texte',expectedRevision:3}}),e=>e.status===409);
  assert.equal(attempts,1);
});
test('ODC lifecycle permissions retain human decisions and freeze terminal dossiers',() => {
  for(const status of ['accepted','rejected','withdrawn']) {
    assert.equal(odc.terminal(status),true);assert.equal(odc.canEditAnswers(status),false);assert.equal(odc.canUpload(status),false);assert.equal(odc.canDecide(status),false);
  }
  assert.equal(odc.canEditAnswers('incomplete'),true);assert.equal(odc.canEditAnswers('in_review'),false);
  assert.equal(odc.canUpload('in_review'),true);assert.equal(odc.canUpload('waitlisted'),false);
  assert.equal(odc.canDecide('waitlisted'),true);assert.equal(odc.canDecide('draft'),false);
});
test('ODC answer payload preserves zero, validates dates and only includes defined questions',() => {
  const fields=[{key:'budget',label:'Budget',fieldType:'number'},{key:'day',label:'Date',fieldType:'date'},{key:'choice',label:'Choix',fieldType:'select',options:['A','B']}];
  assert.deepEqual(odc.answersPayload(fields,{budget:'0',day:'2028-02-29',choice:'A',rogue:'ignored'}),{answers:{budget:0,day:'2028-02-29',choice:'A'}});
  assert.throws(()=>odc.answersPayload(fields,{budget:'abc'}),/nombre invalide/);
  assert.throws(()=>odc.answersPayload(fields,{choice:'X'}),/option/);
  assert.throws(()=>odc.dateInput('2026-02-29','Date'),/date valide/);
  assert.equal(odc.slugify('Été à Paris 2026'),'ete-a-paris-2026');
});
test('ODC definitions strip relation IDs and prevent invalid scores and duplicated keys',() => {
  const program={fields:[{id:'field',key:'nom',label:'Nom',fieldType:'text',required:true,programId:'secret'}],criteria:[{id:'criterion',key:'qualite',label:'Qualité',weight:2,maxPoints:5,required:true}],docTypes:[{id:'docType',key:'cv',label:'CV',required:true,mimeAllow:['application/pdf']}]};
  const result=odc.definitionPayload(program);
  assert.equal('id' in result.fields[0],false);assert.equal('programId' in result.fields[0],false);assert.equal('id' in result.criteria[0],false);assert.equal('id' in result.docTypes[0],false);
  assert.throws(()=>odc.definitionPayload({...program,fields:[...program.fields,...program.fields]}),/uniques/);
  assert.throws(()=>odc.integer('6','Note',0,5),/entre/);assert.throws(()=>odc.integer('-1','Note'),/entier/);
});
test('missing document and field identifiers become meaningful labels',() => {
  assert.deepEqual(odc.missingLabels({missing:['field:nom','document:cv'],program:{fields:[{key:'nom',label:'Nom complet'}],docTypes:[{key:'cv',label:'Curriculum vitae'}]}}),['Nom complet','Curriculum vitae']);
});
test('automation conditions preserve typed numbers, groups, lists and existence checks',() => {
  assert.deepEqual(automation.normalizeCondition({all:[{field:'audit.globalScore',operator:'gte',value:'0'},{not:{field:'integration.meta.status',operator:'in',value:'connected\ndisconnected'}},{field:'audit.ageDays',operator:'notExists',value:'ignored'}]}),{all:[{field:'audit.globalScore',operator:'gte',value:0},{not:{field:'integration.meta.status',operator:'in',value:['connected','disconnected']}},{field:'audit.ageDays',operator:'notExists'}]});
});
test('automation conditions reject unknown fields, invalid types and empty rules',() => {
  assert.throws(()=>automation.normalizeCondition({field:'user.token',operator:'exists'}),/inconnu/);
  assert.throws(()=>automation.normalizeCondition({field:'integration.meta.status',operator:'gt',value:3}),/incompatible/);
  assert.throws(()=>automation.normalizeCondition({field:'website.count',operator:'gt',value:'NaN'}),/nombre/);
  assert.throws(()=>automation.normalizeCondition({all:[]}),/règle/);
  assert.throws(()=>automation.normalizeCondition({field:'website.count',operator:'in',value:[]}),/valeur/);
  let deep={field:'website.count',operator:'exists'}; for(let i=0;i<7;i++)deep={not:deep};
  assert.throws(()=>automation.normalizeCondition(deep),/niveaux/);
});
test('event inputs cannot silently survive an incompatible trigger change',() => {
  const audit=[{actionType:'robia.opportunities.regenerate',input:{auditId:'{{event.auditId}}'}}];
  assert.equal(automation.hasEventInput(audit),true);
  assert.throws(()=>automation.validateEventInputs(audit,'manual','audit.completed'),/événement/);
  assert.throws(()=>automation.validateEventInputs(audit,'event','odc.document.received'),/Audit/);
  assert.doesNotThrow(()=>automation.validateEventInputs(audit,'event','audit.completed'));
  assert.throws(()=>automation.validateEventInputs([{input:{applicationId:'{{event.applicationId}}'}}],'event','audit.completed'),/candidature/);
});
test('CSV import parses UTF-8, BOM, quoted delimiters and escaped quotes',() => {
  assert.equal(parseLocationsCsv(LOCATION_CSV_EXAMPLE)[0].name,'Mon établissement');
  const rows=parseLocationsCsv('\uFEFFidentifiant;nom;adresse;ville;pays;telephone;principal\r\n1;"Atelier ""Nord""";"12; rue";Paris;France;;non');
  assert.equal(rows[0].name,'Atelier "Nord"');assert.equal(rows[0].address,'12; rue');assert.equal(rows[0].isPrimary,false);
});
test('CSV import rejects duplicate identities, oversized batches and invalid columns',() => {
  const header='identifiant;nom;adresse;ville;pays;telephone;principal\n';
  assert.throws(()=>parseLocationsCsv(header+'1;A;;;;;non\n1;B;;;;;non'),/double/);
  assert.throws(()=>parseLocationsCsv(header+Array.from({length:101},(_,i)=>i+';Nom;;;;;non').join('\n')),/100/);
  assert.throws(()=>parseLocationsCsv(header+'1;A;;;;;maybe'),/oui ou non/);
  assert.throws(()=>parseLocationsCsv(header+'1;"A;;;;;non'),/terminée/);
  assert.throws(()=>parseLocationsCsv('id,nom\n1,A'),/colonnes/);
});
function attachmentHarness(result,platform='web') {
  const calls=[]; const deleted=[];
  const {uploadApplicationDocument}=load('src/api/attachments.ts',{
    'expo-document-picker':{getDocumentAsync:async()=>result},
    'react-native':{Platform:{OS:platform}},
    'expo-file-system':{Paths:{cache:{uri:'file:///cache/'}},File:class{constructor(uri){this.uri=uri;this.exists=true;}delete(){deleted.push(this.uri);}}},
    'expo-sharing':{},
    '@/src/api/odc':odc,
  });
  return {run:()=>uploadApplicationDocument(async (...args)=>{calls.push(args);},'application/id',{id:'cv',mimeAllow:['application/pdf']}),calls,deleted};
}
test('cancelled and invalid attachments never mutate the backend',async () => {
  const cancelled=attachmentHarness({canceled:true});assert.equal(await cancelled.run(),false);assert.equal(cancelled.calls.length,0);
  const tooLarge=attachmentHarness({canceled:false,assets:[{name:'cv.pdf',mimeType:'application/pdf',size:odc.MAX_UPLOAD_BYTES+1,uri:'file:///cache/cv.pdf'}]},'android');
  await assert.rejects(tooLarge.run(),/10 Mo/);assert.equal(tooLarge.calls.length,0);assert.deepEqual(tooLarge.deleted,['file:///cache/cv.pdf']);
  const badType=attachmentHarness({canceled:false,assets:[{name:'cv.exe',mimeType:'application/octet-stream',size:8,uri:'file:///documents/original.exe'}]},'android');
  await assert.rejects(badType.run(),/format/);assert.equal(badType.deleted.length,0);
});
test('a selected attachment sends only file and document type, never a storage key',async () => {
  const asset={name:'cv.pdf',mimeType:'application/pdf',size:3,uri:'blob:test',file:new Blob(['pdf'],{type:'application/pdf'})};
  const h=attachmentHarness({canceled:false,assets:[asset]});assert.equal(await h.run(),true);
  const [url,options]=h.calls[0];assert.equal(url,'/odc/applications/application%2Fid/documents/upload');
  assert.deepEqual([...options.body.keys()],['documentTypeId','file']);assert.equal(options.body.get('documentTypeId'),'cv');
});
