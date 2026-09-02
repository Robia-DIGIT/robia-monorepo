import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import { IconBadge, RobiaCard, RobiaHeader, RobiaScreen, StatusPill, robiaStyles } from '@/components/robia-ui';
import { Brand } from '@/constants/theme';
import { MOCK_OPPORTUNITIES, type ImpactLevel } from '@/src/data/mock';

export default function OpportunitiesScreen() {
  return (
    <RobiaScreen>
      <RobiaHeader eyebrow="RECOMMANDATIONS IA" title="Opportunités" subtitle="Les actions les plus utiles pour renforcer votre visibilité locale." />
      <View style={styles.summary}>
        <Text style={styles.summaryCount}>{MOCK_OPPORTUNITIES.length}</Text>
        <Text style={robiaStyles.body}>opportunités détectées et classées par impact.</Text>
      </View>
      {MOCK_OPPORTUNITIES.map((item, index) => (
        <RobiaCard key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <IconBadge name={index === 0 ? 'storefront' : index === 1 ? 'language' : index === 2 ? 'reviews' : 'insights'} backgroundColor={index === 0 ? Brand.orangeLight : Brand.tealLight} color={index === 0 ? Brand.orangeDark : Brand.tealDark} />
            <StatusPill label={item.impact === 'Élevé' ? 'Prioritaire' : item.impact} tone={item.impact === 'Élevé' ? 'orange' : 'teal'} />
          </View>
          <Text style={robiaStyles.cardTitle}>{item.title}</Text>
          <Text style={robiaStyles.body}>{item.description}</Text>
          <View style={styles.metaRow}>
            <Meta label="Effort" value={item.effort} />
            <View style={styles.separator} />
            <Meta label="Confiance IA" value={`${item.confidence} %`} />
            <MaterialIcons name="arrow-forward" size={20} color={Brand.tealDark} />
          </View>
        </RobiaCard>
      ))}
    </RobiaScreen>
  );
}

function Meta({ label, value }: { label: string; value: ImpactLevel | string }) {
  return <View style={styles.meta}><Text style={robiaStyles.caption}>{label}</Text><Text style={styles.metaValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  summary: { padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Brand.tealLight },
  summaryCount: { color: Brand.tealDark, fontSize: 28, fontWeight: '900' },
  card: { gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaRow: { marginTop: 2, paddingTop: 12, borderTopWidth: 1, borderTopColor: Brand.slate100, flexDirection: 'row', alignItems: 'center', gap: 14 },
  meta: { gap: 2 },
  metaValue: { color: Brand.navyDark, fontSize: 13, fontWeight: '800' },
  separator: { width: 1, height: 28, backgroundColor: Brand.slate200 },
});
