import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { RequestOptions } from '@/src/api/client';
import { MAX_UPLOAD_BYTES, type DocumentType, type ApplicationDocument } from '@/src/api/odc';
type Request = <T>(path: string, options?: RequestOptions) => Promise<T>;
export async function uploadApplicationDocument(request: Request, applicationId: string, type: DocumentType) {
  const result = await DocumentPicker.getDocumentAsync({ type: type.mimeAllow, multiple: false, copyToCacheDirectory: true });
  if (result.canceled) return false;
  const asset = result.assets[0]; const mime = asset.mimeType || (asset.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
  try {
    if (!type.mimeAllow.includes(mime)) throw new Error('Ce format de fichier n?est pas accept? pour cette pi?ce.');
    if (asset.size == null || asset.size > MAX_UPLOAD_BYTES) throw new Error('Le fichier doit avoir une taille connue et ne pas d?passer 10 Mo.');
    const body = new FormData(); body.append('documentTypeId', type.id!);
    if (Platform.OS === 'web') {
      if (!asset.file) throw new Error('Le fichier s?lectionn? est inaccessible.');
      body.append('file', asset.file, asset.name);
    } else body.append('file', { uri: asset.uri, name: asset.name, type: mime } as unknown as Blob);
    await request('/odc/applications/' + encodeURIComponent(applicationId) + '/documents/upload', { method: 'POST', body, timeoutMs: 120000 });
    return true;
  } finally {
    // The picker copies into the app cache; never delete the user's original.
    if (Platform.OS !== 'web' && asset.uri.startsWith(Paths.cache.uri)) { const copy = new File(asset.uri); if (copy.exists) copy.delete(); }
  }
}
export async function downloadApplicationDocument(request: Request, documentInfo: ApplicationDocument) {
  const blob = await request<Blob>('/odc/documents/' + encodeURIComponent(documentInfo.id) + '/file', { responseType: 'file', timeoutMs: 90000 });
  const name = documentInfo.originalName.replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/^\.+/, '').slice(-120) || 'document';
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
  }
  if (!await Sharing.isAvailableAsync()) throw new Error('Le partage de fichiers est indisponible.');
  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader(); reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.onload = () => reader.result instanceof ArrayBuffer ? resolve(new Uint8Array(reader.result)) : reject(new Error('Fichier illisible.'));
    reader.readAsArrayBuffer(blob);
  });
  const file = new File(Paths.cache, 'robia-' + Date.now() + '-' + name);
  try { file.write(bytes); await Sharing.shareAsync(file.uri, { mimeType: documentInfo.mimeType, dialogTitle: 'Enregistrer ou partager la pi?ce' }); }
  finally { if (file.exists) file.delete(); }
}
