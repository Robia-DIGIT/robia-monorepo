import { router } from 'expo-router';
import { RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { ProgramEditor } from '@/components/program-editor';
export default function NewProgramScreen() {
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Créer un programme" /><ProgramEditor onSaved={async p => router.replace({ pathname: '/program', params: { id: p.id } })} /></RobiaScreen>;
}
