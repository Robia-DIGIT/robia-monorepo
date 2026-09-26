import { DocumentsLibrary } from '@/components/documents-library';
import { RobiaScreen } from '@/components/robia-ui';
import { WorkspaceHeader } from '@/components/workspace-header';
import { useRobiaData } from '@/src/api/data';
export default function ExecutionPackScreen() {
  const { isLoading, refresh } = useRobiaData();
  return <RobiaScreen fixedHeader refreshing={isLoading} onRefresh={refresh}>
    <WorkspaceHeader title="Documents" back />
    <DocumentsLibrary />
  </RobiaScreen>;
}
