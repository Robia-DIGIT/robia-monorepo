import { router } from 'expo-router';
import { Text } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { AsyncButton, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { useResource } from '@/src/api/use-resource';
import { useSession } from '@/src/auth/session';
type Subscription = { plan: string; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; canManage: boolean };
export default function BillingScreen() {
  const { request, organization } = useSession(); const r = useResource<Subscription>(organization ? '/billing/subscription' : null);
  async function open(path: string, body?: unknown) {
    const session = await request<{ url: string }>(path, { method: 'POST', body });
    const url = new URL(session.url);
    if (url.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) throw new Error('Adresse de paiement inattendue.');
    await WebBrowser.openBrowserAsync(session.url); await r.reload();
  }
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Mon abonnement" /><LoadState {...r} retry={r.reload} />
    {!organization ? <AsyncButton label="Compléter mon organisation" action={async () => router.push("/settings")} /> : null}
    {r.data ? <RobiaCard style={s.stack}><Text style={s.title}>Offre {r.data.plan}</Text><Text style={s.body}>Statut : {{ active: 'Actif', trialing: 'Période d’essai', past_due: 'Paiement en retard', canceled: 'Résilié', inactive: 'Sans abonnement', incomplete: 'Paiement à terminer', unpaid: 'Impayé', pending: 'En cours de confirmation', incomplete_expired: 'Paiement expiré', paused: 'En pause' }[r.data.status] ?? r.data.status}</Text>
      {r.data.currentPeriodEnd ? <Text style={s.body}>{r.data.cancelAtPeriodEnd ? 'Fin prévue' : 'Fin de période'} : {new Date(r.data.currentPeriodEnd).toLocaleDateString('fr-FR')}</Text> : null}
      <Text style={s.body}>Le prix et les conditions sont présentés sur la page sécurisée avant toute confirmation. Fermez le navigateur pour revenir dans RobIA.</Text>
      {r.data.canManage ? <AsyncButton label="Gérer mon abonnement" action={() => open('/billing/portal-session')} /> : null}
      {!['active', 'trialing', 'past_due', 'incomplete'].includes(r.data.status) ? <>
        <AsyncButton label="Découvrir l’offre mensuelle" action={() => open('/billing/checkout-session', { billingPeriod: 'monthly' })} />
        <AsyncButton label="Découvrir l’offre annuelle" action={() => open('/billing/checkout-session', { billingPeriod: 'annual' })} />
      </> : null}
      <AsyncButton label="Actualiser mon abonnement" action={r.reload} />
    </RobiaCard> : null}
  </RobiaScreen>;
}
