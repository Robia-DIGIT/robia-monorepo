import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import { IconBadge, RobiaCard, RobiaHeader, RobiaScreen, StatusPill, robiaStyles } from '@/components/robia-ui';
import { Brand } from '@/constants/theme';
import { MOCK_DOCUMENTS } from '@/src/data/mock';

export default function ExecutionPackScreen() {
  const ready = MOCK_DOCUMENTS.filter((document) => document.status === 'Prêt').length;
  return (
    <RobiaScreen>
      <RobiaHeader eyebrow="CENTRE DE PRODUCTION" title="Documents" subtitle="Tout ce que RobIA prépare reste sous votre contrôle avant publication." />
      <View style={styles.progressCard}>
        <IconBadge name="task-alt" />
        <View style={styles.progressCopy}>
          <Text style={robiaStyles.cardTitle}>{ready} documents prêts</Text>
          <Text style={robiaStyles.body}>Votre pack d’exécution avance.</Text>
        </View>
      </View>
      {MOCK_DOCUMENTS.map((doc) => (
        <RobiaCard key={doc.id} style={styles.card}>
          <View style={styles.documentIcon}><MaterialIcons name="description" size={23} color={Brand.tealDark} /></View>
          <View style={styles.documentCopy}>
            <Text style={robiaStyles.cardTitle}>{doc.title}</Text>
            <Text style={robiaStyles.caption}>Généré par RobIA · Validation humaine requise</Text>
          </View>
          <View style={styles.right}>
            <StatusPill label={doc.status} tone={doc.status === 'Prêt' ? 'teal' : 'neutral'} />
            <MaterialIcons name="chevron-right" size={20} color={Brand.slate400} />
          </View>
        </RobiaCard>
      ))}
    </RobiaScreen>
  );
}

const styles = StyleSheet.create({
  progressCard: { padding: 16, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Brand.tealLight },
  progressCopy: { flex: 1, gap: 2 },
  card: { minHeight: 98, flexDirection: 'row', alignItems: 'center', gap: 12 },
  documentIcon: { width: 46, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.slate100 },
  documentCopy: { flex: 1, gap: 5 },
  right: { alignItems: 'flex-end', gap: 12 },
});
