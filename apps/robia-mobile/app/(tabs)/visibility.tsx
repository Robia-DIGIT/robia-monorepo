import { Text } from 'react-native';
import { apiStyles as s, LoadState } from '@/components/api-ui';
import { RobiaCard, SectionTitle } from '@/components/robia-ui';
import { SectionPager } from '@/components/section-pager';
import { SiteSelector } from '@/components/site-selector';
import { NavCard, Metric } from '@/components/workspace-ui';
import { useRobiaData } from '@/src/api/data';
import { auditScore } from '@/src/api/presentation';
import { VISIBILITY_SECTIONS } from '@/src/navigation/sections';

export default function VisibilityScreen() {
  const { latestAudit, isLoading, error, refresh } = useRobiaData();
  const score = auditScore(latestAudit);
  return <SectionPager title="Visibilité" sections={VISIBILITY_SECTIONS} refreshing={isLoading} onRefresh={refresh}>
    {section => section === 'audits' ? <>
      <SectionTitle title="Comprendre ma visibilité" />
      <SiteSelector />
      <LoadState loading={isLoading} error={error} retry={refresh} />
      <RobiaCard style={s.stack}>
        <Metric label={score.label} value={score.value == null ? 'Non mesuré' : score.value + ' / 100'} />
        <Text style={s.body}>Le diagnostic du site sélectionné guide vos prochaines améliorations.</Text>
      </RobiaCard>
      <NavCard title="Lancer un diagnostic" description="Analyser mon site et identifier ses points à améliorer." href="/audit" icon="audit" />
      <NavCard title="Historique et analyses" description="Retrouver les diagnostics déjà réalisés." href="/history" icon="history" />
      <NavCard title="Analyse approfondie" description="Explorer les signaux et constats de mes audits." href="/intelligence" icon="insights" />
      <NavCard title="Concurrents" description="Comparer les sites que je suis." href="/competitors" icon="competitors" />
      <SectionTitle title="Mes sources" />
      <NavCard title="Sites internet" description="Ajouter ou gérer mes sites." href="/websites" icon="website" />
      <NavCard title="Connexions" description="Connecter mes comptes Google et Meta." href="/integrations" icon="integrations" />
    </> : section === 'performance' ? <>
      <SectionTitle title="Mesurer mes résultats" />
      <NavCard title="Rapports de performance" description="Recherche Google, Analytics et évolution de ma visibilité." href="/reports" icon="analytics" />
      <NavCard title="Réseaux sociaux" description="Audience Facebook, Instagram et publications récentes." href="/social" icon="social" />
      <NavCard title="Gérer mes connexions" description="Choisir les comptes et les sources de mes rapports." href="/integrations" icon="integrations" />
    </> : <>
      <SectionTitle title="Être visible près de mes clients" />
      <NavCard title="Fiches Google et avis" description="Synchroniser mes fiches, lire les avis et suivre les interactions." href="/business-profile" icon="store" />
      <NavCard title="Mes établissements" description="Gérer mes adresses, coordonnées et consulter la météo locale." href="/locations" icon="location" />
      <NavCard title="Importer mes établissements" description="Ajouter plusieurs adresses depuis un fichier." href="/location-import" icon="upload" />
    </>}
  </SectionPager>;
}
