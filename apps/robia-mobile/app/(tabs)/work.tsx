import { RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { NavCard } from '@/components/workspace-ui';
export default function WorkScreen() {
  return <RobiaScreen fixedHeader><RobiaHeader compact title="Travail" subtitle="De la recommandation à l’action, avec votre validation." />
    <NavCard title="Opportunités" description="Choisir les améliorations prioritaires." href="/opportunities" icon="lightbulb-outline" />
    <NavCard title="Documents" description="Préparer, modifier et partager vos contenus." href="/execution-pack" icon="description" />
    <NavCard title="Plan d’action" description="Échéances, approbations et preuves de réalisation." href="/progress" icon="checklist" />
    <NavCard title="Validations" description="Retrouver les décisions et laisser un retour." href="/validations" icon="fact-check" />
    <NavCard title="Automatisations" description="Organiser les tâches récurrentes et leurs validations." href="/automations" icon="auto-awesome" />
    <NavCard title="Suivi des envois" description="Vérifier les e-mails et relancer les échecs." href="/notifications" icon="outgoing-mail" />
  </RobiaScreen>;
}
