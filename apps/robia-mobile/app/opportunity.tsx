import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AsyncButton, Choices, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { useResource } from '@/src/api/use-resource';
import { useSession } from '@/src/auth/session';
import { useRobiaData } from '@/src/api/data';
import type { Opportunity, RobiaDocument } from '@/src/api/types';
export const DOCUMENT_TYPES = [
  { value: 'local_page', label: 'Page locale' }, { value: 'faq', label: 'FAQ' }, { value: 'meta', label: 'Métadonnées' },
  { value: 'gbp_post', label: 'Publication Google' }, { value: 'review_reply', label: 'Réponse à un avis' }, { value: 'dev_brief', label: 'Brief webmaster' }, { value: 'checklist', label: 'Checklist' },
];
export default function OpportunityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { request } = useSession(); const { generateActions, refresh } = useRobiaData();
  const resource = useResource<Opportunity>(id ? '/opportunities/' + encodeURIComponent(id) : null);
  const [type, setType] = useState('local_page'); const [status, setStatus] = useState('open');
  const savedStatus = resource.data?.status;
  useEffect(() => { if (savedStatus) setStatus(savedStatus); }, [savedStatus]);
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Opportunité" /><LoadState {...resource} retry={resource.reload} />
    {resource.data ? <RobiaCard style={s.stack}><Text style={s.title}>{resource.data.title}</Text><Text style={s.body}>{resource.data.description}</Text>
      <Text style={s.body}>Impact : {resource.data.impactScore}/10 · Effort : {resource.data.effortScore}/10</Text>
      <Choices value={type} onChange={setType} options={DOCUMENT_TYPES} />
      <AsyncButton label="Générer ce contenu" action={async () => {
        const doc = await request<RobiaDocument>('/documents/generate', { method: 'POST', body: { opportunityId: id, type }, timeoutMs: 180000 });
        await refresh(); router.push({ pathname: '/document', params: { id: doc.id } });
      }} />
      <AsyncButton label="Ajouter au plan d’action" action={() => generateActions(id)} onSuccess="Actions ajoutées au plan." />
      <Text style={s.body}>Statut actuel : {resource.data.status}</Text>
      <Choices value={status} onChange={setStatus} options={[{ value: 'open', label: 'Ouverte' }, { value: 'in_progress', label: 'En cours' }, { value: 'done', label: 'Terminée' }, { value: 'ignored', label: 'Ignorée' }]} />
      <AsyncButton label="Mettre à jour le statut" disabled={status === resource.data.status} action={async () => { await request('/opportunities/' + encodeURIComponent(id) + '/status', { method: 'PATCH', body: { status } }); await resource.reload(); await refresh(); }} />
    </RobiaCard> : null}
  </RobiaScreen>;
}
