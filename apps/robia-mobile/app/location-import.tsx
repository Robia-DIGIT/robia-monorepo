import { useState } from 'react';
import { Platform, Share, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { AsyncButton, Field, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { LOCATION_CSV_EXAMPLE, parseLocationsCsv, type ImportedLocation } from '@/src/api/location-import';
import { useSession } from '@/src/auth/session';
export default function LocationImportScreen() {
  const { request } = useSession(); const [text,setText] = useState(''); const [preview,setPreview] = useState<ImportedLocation[] | null>(null); const [done,setDone] = useState(false);
  function update(value: string) { setText(value); setPreview(null); setDone(false); }
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Importer des établissements" />
    <RobiaCard style={s.stack}><Text style={s.body}>Importez un fichier CSV UTF-8, séparé par des points-virgules. Les identifiants de votre ancien outil évitent les doublons lors d’un nouvel import.</Text>
      <AsyncButton label="Partager le modèle CSV" action={() => Share.share({ title: 'Modèle d’établissements ROBIA', message: LOCATION_CSV_EXAMPLE })} />
      <AsyncButton label="Choisir un fichier CSV" action={async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv','text/plain','application/vnd.ms-excel'], copyToCacheDirectory: true });
        if (result.canceled) return;
        const asset = result.assets[0];
        try {
          if (asset.size == null || asset.size > 2_000_000) throw new Error('Choisissez un fichier de 2 Mo maximum.');
          const content = Platform.OS === 'web' ? await asset.file?.text() : await new File(asset.uri).text();
          if (content == null) throw new Error('Lecture du fichier impossible.');
          update(content); setPreview(parseLocationsCsv(content));
        } finally { if (Platform.OS !== 'web' && asset.uri.startsWith(Paths.cache.uri)) { const file = new File(asset.uri); if (file.exists) file.delete(); } }
      }} />
      <Field label="Ou coller le contenu CSV" value={text} onChangeText={update} multiline placeholder={LOCATION_CSV_EXAMPLE} />
      <AsyncButton label="Vérifier l’import" disabled={!text.trim()} action={async () => setPreview(parseLocationsCsv(text))} />
    </RobiaCard>
    {preview ? <><Text style={s.title}>{preview.length} établissement(s) à importer</Text>{preview.map(l => <RobiaCard key={l.legacyId} style={s.stack}><Text style={s.title}>{l.name}</Text><Text style={s.body}>{[l.address,l.city,l.country].filter(Boolean).join(', ')}{l.isPrimary ? ' · Principal' : ''}</Text><Text style={s.body}>{l.phone}</Text></RobiaCard>)}
      <AsyncButton label={done ? 'Import terminé' : 'Confirmer l’import'} disabled={done} action={async () => { await request('/locations/legacy-import', { method: 'POST', body: { locations: preview } }); setDone(true); }} onSuccess="Établissements importés. Retrouvez-les dans Mes établissements." />
    </> : null}
  </RobiaScreen>;
}
