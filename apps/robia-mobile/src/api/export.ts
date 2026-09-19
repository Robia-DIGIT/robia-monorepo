import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { RequestOptions } from '@/src/api/client';
export async function shareActionPdf(request: <T>(path: string, options?: RequestOptions) => Promise<T>, websiteId?: string | null) {
  const path = '/actions/export' + (websiteId ? '?website_id=' + encodeURIComponent(websiteId) : '');
  const blob = await request<Blob>(path, { responseType: 'blob', timeoutMs: 90000 });
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'plan-action.pdf'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); return;
  }
  if (!await Sharing.isAvailableAsync()) throw new Error('Le partage de fichiers est indisponible sur cet appareil.');
  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture du PDF impossible.'));
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) { reject(new Error('PDF illisible.')); return; }
      resolve(new Uint8Array(reader.result));
    };
    reader.readAsArrayBuffer(blob);
  });
  const file = new File(Paths.cache, 'robia-plan-' + Date.now() + '.pdf');
  try { file.write(bytes); await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Partager mon plan d’action', UTI: 'com.adobe.pdf' }); }
  finally { if (file.exists) file.delete(); }
}
