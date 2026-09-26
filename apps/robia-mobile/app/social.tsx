import { Text } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { AsyncButton, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { Metric, NavCard, dateLabel } from '@/components/workspace-ui';
import { useResource } from '@/src/api/use-resource';
import type { Connection, MetaPerformance } from '@/src/api/integrations';
export default function SocialScreen() {
  const connection = useResource<Connection>('/integrations/meta/status');
  const r = useResource<MetaPerformance>(connection.data?.connected && connection.data.selectedPageId ? '/integrations/meta/performance' : null);
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Facebook et Instagram" />
    <LoadState {...connection} retry={connection.reload} /><NavCard title="Gérer la connexion Meta" description="Connecter votre compte et choisir une page Facebook." href="/integrations" />
    <LoadState {...r} retry={r.reload} />
    {r.data ? <><RobiaCard style={s.stack}><Text style={s.title}>{r.data.facebook.pageName}</Text><Metric label="Abonnés Facebook" value={r.data.facebook.followersCount} /><Metric label="Mentions J’aime" value={r.data.facebook.fanCount} /><Metric label="Personnes qui en parlent" value={r.data.facebook.talkingAboutCount} /><Text style={s.body}>Actualisé le {dateLabel(r.data.lastSyncedAt)}</Text><AsyncButton label="Actualiser les performances" action={r.reload} /></RobiaCard>
      {r.data.instagram ? <><RobiaCard style={s.stack}><Text style={s.title}>@{r.data.instagram.username}</Text><Metric label="Abonnés Instagram" value={r.data.instagram.followersCount} /><Metric label="Comptes suivis" value={r.data.instagram.followsCount} /><Metric label="Publications" value={r.data.instagram.mediaCount} /></RobiaCard>
        <Text style={s.title}>Publications récentes</Text>{!r.data.instagram.recentMedia?.length ? <Text style={s.body}>Aucune publication récente disponible.</Text> : null}
        {r.data.instagram.recentMedia?.map((m,i) => <RobiaCard key={m.id ?? i} style={s.stack}><Text style={s.body}>{dateLabel(m.timestamp)}</Text><Text style={s.body}>{m.caption || 'Publication sans légende'}</Text><Metric label="J’aime" value={m.likeCount} /><Metric label="Commentaires" value={m.commentsCount} />
          {m.permalink ? <AsyncButton label="Voir la publication" action={async () => { const url = new URL(m.permalink!); if (url.protocol !== 'https:') throw new Error('Lien de publication invalide.'); await WebBrowser.openBrowserAsync(url.href); }} /> : null}
        </RobiaCard>)}
      </> : null}
    </> : null}
  </RobiaScreen>;
}
