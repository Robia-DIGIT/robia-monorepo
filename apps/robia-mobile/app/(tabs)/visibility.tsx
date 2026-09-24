import { RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { NavCard } from '@/components/workspace-ui';
export default function VisibilityScreen() {
  return <RobiaScreen fixedHeader><RobiaHeader compact title="Visibilit?" subtitle="Comprendre votre pr?sence en ligne et la faire progresser." />
    <NavCard title="Diagnostic de mon site" description="Lancer un audit et consulter son historique." href="/history" icon="travel-explore" />
    <NavCard title="Concurrents" description="Comparer les sites que vous suivez." href="/competitors" icon="compare-arrows" />
    <NavCard title="Performances" description="Recherche Google, Analytics et r?seaux sociaux." href="/reports" icon="insights" />
    <NavCard title="Fiches Google et avis" description="Synchroniser vos fiches, lire les avis et suivre les interactions." href="/business-profile" icon="storefront" />
    <NavCard title="Mes ?tablissements" description="Adresses, horaires et m?t?o locale." href="/locations" icon="place" />
    <NavCard title="Analyse approfondie" description="Signaux et constats issus de vos audits." href="/intelligence" icon="psychology" />
  </RobiaScreen>;
}
