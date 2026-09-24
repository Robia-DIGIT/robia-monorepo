import { RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { NavCard } from '@/components/workspace-ui';
export default function WorkScreen() {
  return <RobiaScreen fixedHeader><RobiaHeader compact title="Travail" subtitle="De la recommandation ? l?action, avec votre validation." />
    <NavCard title="Opportunit?s" description="Choisir les am?liorations prioritaires." href="/opportunities" icon="lightbulb-outline" />
    <NavCard title="Documents" description="Pr?parer, modifier et partager vos contenus." href="/execution-pack" icon="description" />
    <NavCard title="Plan d?action" description="?ch?ances, approbations et preuves de r?alisation." href="/progress" icon="checklist" />
    <NavCard title="Validations" description="Retrouver les d?cisions et laisser un retour." href="/validations" icon="fact-check" />
    <NavCard title="Automatisations" description="Organiser les t?ches r?currentes et leurs validations." href="/automations" icon="auto-awesome" />
    <NavCard title="Suivi des envois" description="V?rifier les e-mails et relancer les ?checs." href="/notifications" icon="outgoing-mail" />
  </RobiaScreen>;
}
