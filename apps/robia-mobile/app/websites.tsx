import { normalizeWebsiteUrl } from '@/src/api/presentation';
import { useState } from 'react';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { AsyncButton, Field, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { useResource } from '@/src/api/use-resource';
import { useRobiaData } from '@/src/api/data';
import { useSession } from '@/src/auth/session';
import type { Website } from '@/src/api/types';
type Site = Website & { archivedAt?: string | null };
export default function WebsitesScreen() {
  const { request, organization } = useSession(); const { selectWebsite, selectedWebsiteId, refresh } = useRobiaData();
  const list = useResource<Site[]>(organization ? '/websites?include_archived=true' : null); const [url, setUrl] = useState('');
  const reload = async () => { await Promise.all([list.reload(), refresh()]); };
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Mes sites" />
    {!organization ? <AsyncButton label="Créer mon organisation" action={async () => router.push('/settings')} /> : <>
      <RobiaCard style={s.stack}><Field label="Adresse du site" value={url} onChangeText={setUrl} keyboardType="url" autoCapitalize="none" placeholder="https://entreprise.com" />
        <AsyncButton label="Connecter ce site" disabled={!url.trim()} action={async () => {
          const normalized = normalizeWebsiteUrl(url);
          const site = await request<Site>('/websites', { method: 'POST', body: { url: normalized } }); setUrl(''); selectWebsite(site.id); await reload();
        }} /></RobiaCard>
      <LoadState {...list} retry={list.reload} empty={!list.data?.length} />
      {list.data?.map(site => <RobiaCard key={site.id} style={s.stack}><Text style={s.title}>{site.domain ?? site.url}</Text><Text selectable style={s.body}>{site.url}</Text>
        <Text style={s.body}>{site.archivedAt ? 'Archivé' : selectedWebsiteId === site.id ? 'Site sélectionné' : 'Actif'}</Text>
        {!site.archivedAt ? <><AsyncButton label="Utiliser ce site" action={async () => { const current = await request<Site>('/websites/' + encodeURIComponent(site.id)); selectWebsite(current.id); if (router.canGoBack()) router.back(); else router.replace("/(tabs)/dashboard"); }} />
          <AsyncButton label="Archiver" confirm="Ce site sera masqué de vos sites actifs. Vous pourrez le restaurer." action={async () => { await request('/websites/' + encodeURIComponent(site.id), { method: 'DELETE' }); await reload(); }} /></> :
          <AsyncButton label="Restaurer" action={async () => { await request('/websites/' + encodeURIComponent(site.id) + '/restore', { method: 'PATCH' }); await reload(); }} />}
      </RobiaCard>)}
    </>}
  </RobiaScreen>;
}
