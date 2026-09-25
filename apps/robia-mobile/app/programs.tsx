import { ProgramsContent } from '@/components/programs-content';
import { RobiaHeader, RobiaScreen } from '@/components/robia-ui';
export default function ProgramsScreen() {
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Candidatures" /><ProgramsContent /></RobiaScreen>;
}
