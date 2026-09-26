import { TasksWorkspace } from '@/components/tasks-workspace';
import { RobiaScreen } from '@/components/robia-ui';
import { WorkspaceHeader } from '@/components/workspace-header';
export default function ProgressScreen() {
  return <RobiaScreen fixedHeader><WorkspaceHeader title="Suivi" back /><TasksWorkspace /></RobiaScreen>;
}
