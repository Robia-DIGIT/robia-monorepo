import { RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { NavCard } from '@/components/workspace-ui';
export default function VisibilityScreen() {
  return <RobiaScreen fixedHeader><RobiaHeader compact title="Visibilité" subtitle="Comprendre votre présence en ligne et la faire progresser." />
    <NavCard title="Diagnostic de mon site" description="Lancer un audit et consulter son historique." href="/history" icon="travel-explore" />
    <NavCard title="Concurrents" description="Comparer les sites que vous suivez." href="/competitors" icon="compare-arrows" />
    <NavCard title="Performances" description="Recherche Google, Analytics et réseaux sociaux." href="/reports" icon="insights" />
    <NavCard title="Réseaux sociaux" description="Audience Facebook, Instagram et publications récentes." href="/social" icon="groups" />
    <NavCard title="Fiches Google et avis" description="Synchroniser vos fiches, lire les avis et suivre les interactions." href="/business-profile" icon="storefront" />
    <NavCard title="Mes Établissements" description="Adresses, horaires et météo locale." href="/locations" icon="place" />
    <NavCard title="Analyse approfondie" description="Signaux et constats issus de vos audits." href="/intelligence" icon="psychology" />
  </RobiaScreen>;
}
