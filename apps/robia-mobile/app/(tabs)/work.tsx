import { DocumentsLibrary } from '@/components/documents-library';
import { TasksWorkspace } from '@/components/tasks-workspace';
import { ProgramsContent } from '@/components/programs-content';
import { SectionPager } from '@/components/section-pager';
import { CollectionHeading, QuickActions } from '@/components/collection-ui';
import { NavCard } from '@/components/workspace-ui';
import { WORK_SECTIONS } from '@/src/navigation/sections';

export default function WorkScreen() {
  return <SectionPager title="Activité" sections={WORK_SECTIONS}>
    {section => section === 'actions' ? <TasksWorkspace /> : section === 'documents' ? <DocumentsLibrary /> : section === 'programs' ? <>
      <CollectionHeading title="Candidatures" detail="Vos programmes, dossiers et décisions" />
      <ProgramsContent />
    </> : <>
      <CollectionHeading title="Gagner du temps" detail="Organisez les tâches récurrentes et gardez la main sur les décisions." />
      <QuickActions items={[
        { label: 'Automatisations', href: '/automations', icon: 'automation' },
        { label: 'Envois', href: '/notifications', icon: 'deliveries' },
        { label: 'Validations', href: '/validations', icon: 'validation' },
        { label: 'Connexions', href: '/integrations', icon: 'integrations' },
      ]} />
      <NavCard title="Mes automatisations" description="Déclencheurs, actions, historique et validations." href="/automations" icon="automation" />
      <NavCard title="Suivi des envois" description="Vérifier les e-mails et relancer les échecs." href="/notifications" icon="deliveries" />
    </>}
  </SectionPager>;
}
