import { Text, View } from 'react-native';
import { AsyncButton, Choices, Field, apiStyles as s } from '@/components/api-ui';
import { CONDITION_FIELDS, type Condition } from '@/src/api/automations';
const initial = (): Condition => ({ field: 'opportunity.count', operator: 'gt', value: '0' });
export function ConditionEditor({ value, onChange, depth = 0 }: { value: Condition; onChange(v: Condition): void; depth?: number }) {
  const mode = 'field' in value ? 'rule' : 'all' in value ? 'all' : 'any' in value ? 'any' : 'not';
  const group = 'all' in value ? value.all : 'any' in value ? value.any : null;
  return <View style={[s.stack, { borderLeftWidth: depth ? 2 : 0, borderLeftColor: '#DDEAE6', paddingLeft: depth ? 12 : 0 }]}>
    <Choices value={mode} onChange={v => onChange(v === 'rule' ? initial() : v === 'not' ? { not: initial() } : v === 'all' ? { all: [initial()] } : { any: [initial()] })} options={[{ value: 'rule', label: 'Règle' }, ...(depth < 6 ? [{ value: 'all', label: 'Toutes' }, { value: 'any', label: 'Au moins une' }, { value: 'not', label: 'Inverser' }] : [])]} />
    {'field' in value ? <><Choices value={value.field} onChange={field => onChange({ field, operator: 'eq', value: '' })} options={CONDITION_FIELDS} />
      <Choices value={value.operator} onChange={operator => onChange({ ...value, operator, value: '' })} options={[{ value: 'eq', label: "Égal à" }, { value: 'ne', label: 'Différent de' }, ...(CONDITION_FIELDS.find(f => f.value === value.field)?.numeric ? [{ value: 'gt', label: "Supérieur à" }, { value: 'gte', label: 'Au moins' }, { value: 'lt', label: "Inférieur à" }, { value: 'lte', label: 'Au plus' }] : []), { value: 'in', label: 'Parmi' }, { value: 'notIn', label: 'Hors de' }, { value: 'exists', label: 'Renseigné' }, { value: 'notExists', label: 'Absent' }]} />
      {!['exists','notExists'].includes(value.operator) ? <><Field label={['in','notIn'].includes(value.operator) ? 'Valeurs (une par ligne)' : 'Valeur'} value={Array.isArray(value.value) ? value.value.join('\n') : String(value.value ?? '')} onChangeText={text => onChange({ ...value, value: text })} multiline={['in','notIn'].includes(value.operator)} />
        {value.field.includes('integration.') ? <Text style={s.body}>Valeurs : connected (connecté), disconnected (déconnecté).</Text> : value.field === 'audit.status' ? <Text style={s.body}>Valeurs : completed (terminé), failed (Échec), running (en cours), pending (en attente).</Text> : null}
      </> : null}</> : null}
    {'not' in value ? <ConditionEditor value={value.not} depth={depth + 1} onChange={not => onChange({ not })} /> : null}
    {group?.map((child,i) => <View key={i} style={s.stack}><ConditionEditor value={child} depth={depth + 1} onChange={v => { const nodes = group.map((n,j) => i === j ? v : n); onChange(mode === 'all' ? { all: nodes } : { any: nodes }); }} /><AsyncButton label="Retirer cette règle" disabled={group.length <= 1} action={async () => { const nodes = group.filter((_,j) => i !== j); onChange(mode === 'all' ? { all: nodes } : { any: nodes }); }} /></View>)}
    {group ? <AsyncButton label="Ajouter une règle" action={async () => { const nodes = [...group, initial()]; onChange(mode === 'all' ? { all: nodes } : { any: nodes }); }} /> : null}
  </View>;
}
