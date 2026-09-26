import { useState } from 'react';
import { Text, View } from 'react-native';
import { AsyncButton, Choices, Field, apiStyles as s } from '@/components/api-ui';
import { RobiaCard } from '@/components/robia-ui';
import { Toggle } from '@/components/workspace-ui';
import { useSession } from '@/src/auth/session';
import { dateInput, definitionPayload, integer, slugify, type Program, type ProgramField, type Criterion, type DocumentType } from '@/src/api/odc';
const FORMATS = [{ value: 'application/pdf', label: 'PDF' }, { value: 'image/jpeg', label: 'JPEG' }, { value: 'image/png', label: 'PNG' }, { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word (.docx)' }];
export function ProgramEditor({ program, definitionLocked = false, onSaved }: { program?: Program; definitionLocked?: boolean; onSaved(program: Program): Promise<unknown> }) {
  const { request } = useSession(); const [name, setName] = useState(program?.name ?? ''); const [slug, setSlug] = useState(program?.slug ?? '');
  const [description, setDescription] = useState(program?.description ?? ''); const [opens, setOpens] = useState(program?.opensAt?.slice(0,10) ?? ''); const [closes, setCloses] = useState(program?.closesAt?.slice(0,10) ?? '');
  const [dual, setDual] = useState(program?.requireDualReview ?? false); const [threshold, setThreshold] = useState(program?.decisionThreshold == null ? '' : String(program.decisionThreshold));
  const [fields, setFields] = useState<ProgramField[]>(program?.fields ?? []); const [criteria, setCriteria] = useState<Criterion[]>(program?.criteria ?? []); const [docTypes, setDocTypes] = useState<DocumentType[]>(program?.docTypes ?? []);
  const [section, setSection] = useState('details'); const [newLabel, setNewLabel] = useState('');
  function add() {
    const label = newLabel.trim(); if (!label) throw new Error('Renseignez un intitulé.');
    const list = section === 'fields' ? fields : section === 'criteria' ? criteria : docTypes;
    if (list.length >= 50) throw new Error('Limite de 50 éléments atteinte.');
    const key = (slugify(label) || 'element') + '-' + Date.now().toString(36);
    if (section === 'fields') setFields([...fields, { key, label, required: false, fieldType: 'text' }]);
    else if (section === 'criteria') setCriteria([...criteria, { key, label, required: true, weight: 1, maxPoints: 5 }]);
    else setDocTypes([...docTypes, { key, label, required: true, mimeAllow: ['application/pdf'] }]);
    setNewLabel('');
  }
  const frozen = definitionLocked && ['criteria', 'documents'].includes(section);
  return <RobiaCard style={s.stack}><Text style={s.title}>{program ? 'Modifier le programme' : 'Nouveau programme'}</Text>
    <Choices value={section} onChange={v => { setSection(v); setNewLabel(''); }} options={[{ value: 'details', label: 'Présentation' }, { value: 'fields', label: 'Formulaire' }, { value: 'criteria', label: 'Évaluation' }, { value: 'documents', label: 'Pièces' }]} />
    {section === 'details' ? <>
      <Field label="Nom du programme" value={name} onChangeText={v => { setName(v); if (!program && (!slug || slug === slugify(name))) setSlug(slugify(v)); }} />
      {!program ? <Field label="Référence unique" value={slug} onChangeText={setSlug} autoCapitalize="none" placeholder="appel-a-projets-2026" /> : null}
      <Field label="Présentation" value={description} onChangeText={setDescription} multiline />
      <Field label="Ouverture indicative (AAAA-MM-JJ)" value={opens} onChangeText={setOpens} placeholder="2026-10-01" />
      <Field label="Clôture indicative (AAAA-MM-JJ)" value={closes} onChangeText={setCloses} placeholder="2026-11-30" />
      <Text style={s.body}>L’ouverture et la fermeture se font avec les boutons du programme. Les dates sont des informations de calendrier.</Text>
      <Field label="Seuil indicatif de décision (facultatif)" value={threshold} onChangeText={setThreshold} keyboardType="number-pad" />
      <Toggle label="Demander une double revue" value={dual} onChange={setDual} />
      <Text style={s.body}>Le seuil et la double revue sont des consignes pour votre équipe. La décision reste saisie par une personne.</Text>
    </> : null}
    {frozen ? <Text style={s.body}>Des candidatures existent déjà : les critères et types de pièces sont figés pour préserver les dossiers.</Text> : null}
    {section === 'fields' ? fields.map((f,i) => <View key={f.key} style={s.stack}>
      <Field label={'Question ' + (i+1)} value={f.label} onChangeText={label => setFields(fields.map((v,j) => i === j ? { ...v, label } : v))} />
      <Choices value={f.fieldType} onChange={fieldType => setFields(fields.map((v,j) => i === j ? { ...v, fieldType, options: fieldType === 'select' ? [] : undefined } : v))} options={[{ value: 'text', label: 'Texte court' }, { value: 'longtext', label: 'Texte long' }, { value: 'number', label: 'Nombre' }, { value: 'date', label: 'Date' }, { value: 'select', label: 'Choix' }]} />
      {f.fieldType === 'select' ? <Field label="Options (une par ligne)" multiline value={Array.isArray(f.options) ? f.options.join('\n') : ''} onChangeText={text => setFields(fields.map((v,j) => i === j ? { ...v, options: text.split('\n') } : v))} /> : null}
      <Toggle label="Réponse obligatoire" value={f.required} onChange={required => setFields(fields.map((v,j) => i === j ? { ...v, required } : v))} />
      <AsyncButton label="Retirer cette question" action={async () => setFields(fields.filter((_,j) => j !== i))} />
    </View>) : null}
    {section === 'criteria' ? criteria.map((c,i) => <View key={c.key} style={s.stack}>
      <Field label={'Critère ' + (i+1)} value={c.label} editable={!frozen} onChangeText={label => setCriteria(criteria.map((v,j) => i === j ? { ...v, label } : v))} />
      <Field label="Description du critère" value={c.description ?? ''} editable={!frozen} onChangeText={description => setCriteria(criteria.map((v,j) => i === j ? { ...v, description } : v))} />
      <Field label="Points maximum" value={String(c.maxPoints || '')} editable={!frozen} keyboardType="number-pad" onChangeText={value => setCriteria(criteria.map((v,j) => i === j ? { ...v, maxPoints: Number(value) } : v))} />
      <Field label="Coefficient" value={String(c.weight || '')} editable={!frozen} keyboardType="number-pad" onChangeText={value => setCriteria(criteria.map((v,j) => i === j ? { ...v, weight: Number(value) } : v))} />
      {!frozen ? <><Toggle label="Note obligatoire" value={c.required} onChange={required => setCriteria(criteria.map((v,j) => i === j ? { ...v, required } : v))} /><AsyncButton label="Retirer ce critère" action={async () => setCriteria(criteria.filter((_,j) => j !== i))} /></> : null}
    </View>) : null}
    {section === 'documents' ? docTypes.map((d,i) => <View key={d.key} style={s.stack}>
      <Field label={'Pièce ' + (i+1)} value={d.label} editable={!frozen} onChangeText={label => setDocTypes(docTypes.map((v,j) => i === j ? { ...v, label } : v))} />
      {FORMATS.map(format => <View key={format.value}>{frozen ? <Text style={s.body}>{d.mimeAllow.includes(format.value) ? format.label : ''}</Text> : <Toggle label={format.label} value={d.mimeAllow.includes(format.value)} onChange={selected => setDocTypes(docTypes.map((v,j) => i === j ? { ...v, mimeAllow: selected ? [...v.mimeAllow, format.value] : v.mimeAllow.filter(m => m !== format.value) } : v))} />}</View>)}
      {!frozen ? <><Toggle label="Pièce obligatoire" value={d.required} onChange={required => setDocTypes(docTypes.map((v,j) => i === j ? { ...v, required } : v))} /><AsyncButton label="Retirer cette pièce" action={async () => setDocTypes(docTypes.filter((_,j) => j !== i))} /></> : null}
    </View>) : null}
    {section !== 'details' && !frozen ? <><Field label="Intitulé du nouvel élément" value={newLabel} onChangeText={setNewLabel} /><AsyncButton label="Ajouter à la liste" disabled={!newLabel.trim()} action={async () => add()} /></> : null}
    <AsyncButton label={program ? 'Enregistrer les modifications' : 'Créer le programme'} disabled={!name.trim()} action={async () => {
      const ref = slug.trim(); if (!program && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ref)) throw new Error('La référence doit contenir des lettres minuscules, des chiffres ou des tirets.');
      const opensAt = dateInput(opens, 'Ouverture'); const closesAt = dateInput(closes, 'Clôture'); if (opensAt && closesAt && opensAt > closesAt) throw new Error('La clôture doit suivre l’ouverture.');
      if (program && ((program.opensAt && !opensAt) || (program.closesAt && !closesAt) || (program.decisionThreshold != null && !threshold.trim()))) throw new Error('Conservez ou modifiez les dates et le seuil existants ; leur suppression n’est pas prise en charge.');
      const definitions = definitionPayload({ fields: fields.map(f => ({ ...f, options: Array.isArray(f.options) ? [...new Set(f.options.map(String).map(x => x.trim()).filter(Boolean))] : f.options })), criteria, docTypes });
      const body = { name: name.trim(), description, opensAt, closesAt, requireDualReview: dual, decisionThreshold: threshold.trim() ? integer(threshold, 'Seuil') : undefined, fields: definitions.fields,
        ...(!definitionLocked ? { criteria: definitions.criteria, docTypes: definitions.docTypes } : {}), ...(!program ? { slug: ref } : {}) };
      const result = await request<Program>('/odc/programs' + (program ? '/' + encodeURIComponent(program.id) : ''), { method: program ? 'PATCH' : 'POST', body }); await onSaved(result);
    }} />
  </RobiaCard>;
}
