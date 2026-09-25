import { Text } from 'react-native';
import { LoadState, apiStyles as s } from '@/components/api-ui';
import { ProgramsContent } from '@/components/programs-content';
import { SectionPager } from '@/components/section-pager';
import { SectionTitle } from '@/components/robia-ui';
import { SiteSelector } from '@/components/site-selector';
import { NavCard } from '@/components/workspace-ui';
import { useRobiaData } from '@/src/api/data';
import { DOCUMENT_STATUS_LABELS } from '@/src/api/presentation';
import { WORK_SECTIONS } from '@/src/navigation/sections';

export default function WorkScreen() {
  const { opportunities, documents, isLoading, error, refresh } = useRobiaData();
  return <SectionPager title="Activité" sections={WORK_SECTIONS}>
    {section => section === 'actions' ? <>
      <SectionTitle title="Mes prochaines actions" />
      <SiteSelector />
      <LoadState loading={isLoading} error={error} retry={refresh} />
      <NavCard title="Plan d’action" description="Suivre les tâches et échéances de toute mon entreprise." href="/progress" icon="checklist" />
      <NavCard title="Toutes les opportunités" description="Choisir et filtrer les améliorations du site sélectionné." href="/opportunities" icon="lightbulb-outline" />
      <SectionTitle title="À explorer pour ce site" />
      {opportunities.slice(0, 3).map(item => <NavCard key={item.id} title={item.title}
        description={(item.category ?? 'Recommandation') + ' · Impact ' + item.impactScore + '/10'}
        href={{ pathname: '/opportunity', params: { id: item.id } }} icon="lightbulb-outline" />)}
      {!isLoading && !error && !opportunities.length ? <Text style={s.body}>Les recommandations apparaîtront après le diagnostic de votre site.</Text> : null}
    </> : section === 'documents' ? <>
      <SectionTitle title="Mes contenus et validations" />
      <SiteSelector />
      <LoadState loading={isLoading} error={error} retry={refresh} />
      <NavCard title="Tous mes documents" description="Préparer, modifier et partager les contenus du site sélectionné." href="/execution-pack" icon="description" />
      <NavCard title="Validations" description="Retrouver mes décisions et laisser un retour." href="/validations" icon="fact-check" />
      <SectionTitle title="Documents récents de ce site" />
      {documents.slice(0, 3).map(item => <NavCard key={item.id} title={item.title}
        description={DOCUMENT_STATUS_LABELS[item.status] ?? item.status}
        href={{ pathname: '/document', params: { id: item.id } }} icon="description" />)}
      {!isLoading && !error && !documents.length ? <Text style={s.body}>Créez votre premier document depuis une opportunité.</Text> : null}
    </> : section === 'programs' ? <>
      <SectionTitle title="Mes programmes de candidatures" />
      <ProgramsContent />
    </> : <>
      <SectionTitle title="Organiser les tâches récurrentes" />
      <NavCard title="Automatisations" description="Définir mes déclencheurs, actions et validations." href="/automations" icon="auto-awesome" />
      <NavCard title="Suivi des envois" description="Vérifier les e-mails et relancer les échecs." href="/notifications" icon="outgoing-mail" />
    </>}
  </SectionPager>;
}
