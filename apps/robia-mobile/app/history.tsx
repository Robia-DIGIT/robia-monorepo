import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import { RobiaCard, RobiaHeader, RobiaScreen, StatusPill, robiaStyles } from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';

const AUDITS = [
  { date: '28 août 2026', score: 62, delta: '+8', label: 'Audit complet' },
  { date: '12 août 2026', score: 54, delta: '+5', label: 'Audit de contrôle' },
  { date: '30 juillet 2026', score: 49, delta: 'Initial', label: 'Premier diagnostic' },
];

export default function HistoryScreen() {
  return (
    <RobiaScreen>
      <RobiaHeader eyebrow="VOTRE PROGRESSION" title="Historique des audits" subtitle="Comparez vos diagnostics et mesurez l’évolution de votre visibilité." />
      {AUDITS.map((audit, index) => (
        <RobiaCard key={audit.date} style={styles.card} accent={index === 0 ? Brand.teal : undefined}>
          <View style={styles.timeline}><View style={[styles.dot,index === 0 && styles.dotActive]} />{index < AUDITS.length - 1 ? <View style={styles.line} /> : null}</View>
          <View style={styles.copy}><Text style={robiaStyles.cardTitle}>{audit.label}</Text><Text style={robiaStyles.caption}>{audit.date}</Text><StatusPill label={audit.delta === 'Initial' ? audit.delta : `${audit.delta} points`} tone={index === 0 ? 'teal' : 'neutral'} /></View>
          <View style={styles.score}><Text style={styles.scoreValue}>{audit.score}</Text><Text style={robiaStyles.caption}>/100</Text><MaterialIcons name="chevron-right" size={20} color={Brand.slate400} /></View>
        </RobiaCard>
      ))}
    </RobiaScreen>
  );
}
const styles=StyleSheet.create({
  card:{minHeight:116,flexDirection:'row',gap:13},
  timeline:{width:14,alignItems:'center'},
  dot:{width:10,height:10,borderRadius:5,backgroundColor:Brand.slate200},
  dotActive:{backgroundColor:Brand.teal},
  line:{position:'absolute',top:16,bottom:-36,width:2,backgroundColor:Brand.slate100},
  copy:{flex:1,gap:6},
  score:{alignItems:'baseline',flexDirection:'row',gap:2},
  scoreValue:{color:Brand.navyDark,fontFamily:Fonts?.rounded,fontSize:28,fontWeight:'900'},
});
