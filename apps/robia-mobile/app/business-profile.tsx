import { useState } from 'react';
import { Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { AsyncButton, Choices, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { Metric, NavCard, Status, dateLabel } from '@/components/workspace-ui';
import { useResource } from '@/src/api/use-resource';
import { useSession } from '@/src/auth/session';
const BASE = '/integrations/google/business-profile';
type Connection = { connected: boolean; googleAccountEmail: string | null; lastSyncedAt: string | null; lastSyncStatus: string; locationCount: number; stale: boolean; expired: boolean };
type Location = { id: string; title: string; description?: string; primaryCategory?: string; additionalCategories: string[]; primaryPhone?: string; additionalPhones: string[]; websiteUri?: string; address?: { addressLines?: string[]; locality?: string; postalCode?: string; regionCode?: string }; openStatus?: string; regularHours?: { periods?: { openDay?: string; openTime?: { hours?: number; minutes?: number }; closeDay?: string; closeTime?: { hours?: number; minutes?: number } }[] }; robiaLocationId: string | null; robiaLocation?: { name: string }; lastSyncedAt: string };
type Reviews = { reviews: { id: string; reviewerDisplayName?: string; starRating: number | null; comment?: string; createTime?: string; replyComment?: string }[]; averageRating: number | null; totalReviewCount: number | null; lastSyncedAt: string | null; expiresAt: string | null };
type Performance = { startDate: string; endDate: string; summary: Record<string, number>; daily: ({ date: string } & Record<'impressions' | 'calls' | 'websiteClicks' | 'directionRequests' | 'conversations', number>)[] };
const metrics: Record<string,string> = { impressions: 'Vues', calls: 'Clics pour appeler', websiteClicks: 'Clics vers le site', directionRequests: 'Demandes d?itin?raire', conversations: 'Conversations' };
const days: Record<string,string> = { MONDAY: 'Lundi', TUESDAY: 'Mardi', WEDNESDAY: 'Mercredi', THURSDAY: 'Jeudi', FRIDAY: 'Vendredi', SATURDAY: 'Samedi', SUNDAY: 'Dimanche' };
const time = (t?: { hours?: number; minutes?: number }) => t ? String(t.hours ?? 0).padStart(2, '0') + ':' + String(t.minutes ?? 0).padStart(2, '0') : '?';
function LocationDetail({ location, reload }: { location: Location; reload(): Promise<unknown> }) {
  const { request } = useSession(); const path = BASE + '/locations/' + encodeURIComponent(location.id);
  const [section, setSection] = useState('info'); const [link, setLink] = useState(location.robiaLocationId ?? '');
  const local = useResource<{ id: string; name: string }[]>(section === 'info' ? '/locations' : null);
  const reviews = useResource<Reviews>(section === 'reviews' ? path + '/reviews' : null);
  const [performance, setPerformance] = useState<Performance | null>(null); const [daily, setDaily] = useState(false);
  return <View style={s.stack}><Choices value={section} onChange={setSection} options={[{ value: 'info', label: 'Fiche' }, { value: 'reviews', label: 'Avis' }, { value: 'performance', label: 'Performances' }]} />
    {section === 'info' ? <><Text style={s.body}>{location.description || 'Aucune description renseignée.'}</Text><Text style={s.body}>{[location.primaryCategory, ...location.additionalCategories].filter(Boolean).join(' ? ')}</Text>
      <Text selectable style={s.body}>{[...(location.address?.addressLines ?? []), location.address?.postalCode, location.address?.locality, location.address?.regionCode].filter(Boolean).join(', ')}</Text>
      <Text selectable style={s.body}>{[location.primaryPhone, ...location.additionalPhones].filter(Boolean).join(' ? ')}{location.websiteUri ? '\n' + location.websiteUri : ''}</Text>
      <Text style={s.body}>{{ OPEN: 'Ouvert', CLOSED_PERMANENTLY: 'Ferm? d?finitivement', CLOSED_TEMPORARILY: 'Ferm? temporairement' }[location.openStatus ?? ''] ?? 'Horaires non confirm?s'}</Text>
      {location.regularHours?.periods?.map((p, i) => <Text key={i} style={s.body}>{days[p.openDay ?? ''] ?? p.openDay} : {time(p.openTime)} ? {p.closeDay !== p.openDay ? days[p.closeDay ?? ''] + ' ' : ''}{time(p.closeTime)}</Text>)}
      <Text style={s.title}>établissement ROBIA associ?</Text><Text style={s.body}>{location.robiaLocation?.name ?? 'Aucun établissement associ?'}</Text><LoadState {...local} retry={local.reload} />
      <Choices value={link} onChange={setLink} options={local.data?.map(l => ({ value: l.id, label: l.name })) ?? []} />
      <AsyncButton label="Associer cet établissement" disabled={!link || link === location.robiaLocationId} action={async () => { await request(path + '/link', { method: 'POST', body: { robiaLocationId: link } }); await reload(); }} />
      {location.robiaLocationId ? <AsyncButton label="Retirer l’association" confirm="Dissocier cette fiche Google de l’établissement ROBIA ?" action={async () => { await request(path + '/link', { method: 'DELETE' }); setLink(''); await reload(); }} /> : null}
      <NavCard title="Gérer mes Établissements" description="Ajouter une adresse dans ROBIA." href="/locations" />
    </> : null}
    {section === 'reviews' ? <><AsyncButton label="Synchroniser les avis Google" action={async () => { await request(path + '/reviews/sync', { method: 'POST', timeoutMs: 90000 }); await reviews.reload(); }} /><LoadState {...reviews} retry={reviews.reload} empty={!reviews.data?.reviews.length} />
      {reviews.data ? <><Metric label="Note Google" value={reviews.data.averageRating == null ? null : reviews.data.averageRating + '/5'} /><Metric label="Nombre d’avis" value={reviews.data.totalReviewCount} /><Text style={s.body}>Synchronisé le {dateLabel(reviews.data.lastSyncedAt)}</Text></> : null}
      {reviews.data?.reviews.map(r => <RobiaCard key={r.id} style={s.stack}><Text style={s.title}>{r.reviewerDisplayName || 'Client Google'} ? {r.starRating ?? '?'}/5</Text><Text style={s.body}>{dateLabel(r.createTime)}</Text><Text style={s.body}>{r.comment || 'Avis sans commentaire'}</Text>{r.replyComment ? <Text style={s.body}>R?ponse de l’établissement : {r.replyComment}</Text> : null}</RobiaCard>)}
    </> : null}
    {section === 'performance' ? <><Text style={s.body}>Interactions des 30 derniers jours disponibles. Google limite les actualisations ? une par minute.</Text><AsyncButton label="Charger les performances" action={async () => setPerformance(await request<Performance>(path + '/performance', { timeoutMs: 90000 }))} />
      {performance ? <><Text style={s.body}>{performance.startDate} au {performance.endDate}</Text>{Object.entries(performance.summary).map(([k,v]) => <Metric key={k} label={metrics[k] ?? k} value={v} />)}<AsyncButton label={daily ? 'Masquer le détail quotidien' : 'Voir le détail quotidien'} action={async () => setDaily(!daily)} />{daily ? performance.daily.map(d => <View key={d.date} style={s.stack}><Text style={s.title}>{d.date}</Text>{Object.keys(metrics).map(k => <Metric key={k} label={metrics[k]} value={d[k as 'impressions' | 'calls' | 'websiteClicks' | 'directionRequests' | 'conversations']} />)}</View>) : null}</> : null}
    </> : null}
  </View>;
}
export default function BusinessProfileScreen() {
  const { request } = useSession(); const status = useResource<Connection>(BASE + '/status');
  const list = useResource<Location[]>(status.data?.connected ? BASE + '/locations' : null);
  const [selected, setSelected] = useState<string | null>(null);
  const reload = async () => { await Promise.all([status.reload(), list.reload()]); };
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Fiches Google et avis" />
    <RobiaCard style={s.stack}><LoadState {...status} retry={status.reload} /><Text style={s.title}>Google Business Profile</Text><Text style={s.body}>{status.data?.connected ? status.data.googleAccountEmail : 'Connectez le compte qui gère vos Établissements.'}</Text>
      {status.data?.connected ? <><Status value={status.data.lastSyncStatus} /><Text style={s.body}>{status.data.locationCount} fiche(s) ? {dateLabel(status.data.lastSyncedAt)}</Text>{status.data.stale || status.data.expired ? <Text style={s.body}>Les données doivent être actualis?es.</Text> : null}
        <AsyncButton label="Synchroniser les fiches" action={async () => { try { await request(BASE + '/sync', { method: 'POST', timeoutMs: 180000 }); } finally { await reload(); } }} />
        <AsyncButton label="Déconnecter Google Business Profile" confirm="Retirer la connexion et les fiches Google synchronis?es de ROBIA ?" action={async () => { await request(BASE, { method: 'DELETE' }); setSelected(null); await reload(); }} />
      </> : <><Text style={s.body}>La connexion s?effectue dans votre espace web ROBIA. Utilisez le même compte, puis revenez ici.</Text><AsyncButton label="Ouvrir les connexions ROBIA" action={async () => { await WebBrowser.openBrowserAsync('https://app.robiacopilot.site/analyse'); await status.reload(); }} /></>}
      <AsyncButton label="V?rifier la connexion" action={status.reload} />
    </RobiaCard>
    <LoadState {...list} retry={list.reload} empty={!!status.data?.connected && !list.data?.length} />
    {list.data?.map(l => <RobiaCard key={l.id} style={s.stack}><Text style={s.title}>{l.title}</Text><Text style={s.body}>{l.primaryCategory} ? {dateLabel(l.lastSyncedAt)}</Text><AsyncButton label={selected === l.id ? 'Fermer la fiche' : 'Consulter la fiche'} action={async () => setSelected(selected === l.id ? null : l.id)} />{selected === l.id ? <LocationDetail location={l} reload={list.reload} /> : null}</RobiaCard>)}
  </RobiaScreen>;
}
