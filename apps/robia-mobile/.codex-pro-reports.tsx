import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import { IconBadge, RobiaCard, RobiaHeader, RobiaScreen, SectionTitle, StatusPill, robiaStyles } from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';

export default function ReportsScreen() {
  return (
    <RobiaScreen>
      <RobiaHeader eyebrow="PERFORMANCE" title="Rapports mensuels" subtitle="Une lecture simple de vos progrès et des prochaines actions recommandées." />
      <RobiaCard style={styles.hero} accent={Brand.teal}>
        <View style={styles.heroTop}><View><Text style={styles.month}>Août 2026</Text><Text style={robiaStyles.body}>Visibilité locale</Text></View><StatusPill label="+15 %" tone="teal" /></View>
        <View style={styles.chart}>{[35,48,42,63,58,76,82].map((height,index)=><View key={index} style={[styles.bar,{height:`${height}%`},index===6&&styles.barActive]} />)}</View>
      </RobiaCard>
      <View style={styles.metrics}>
        <Metric icon="visibility" value="1,8 k" label="Vues locales" />
        <Metric icon="touch-app" value="126" label="Interactions" />
      </View>
      <SectionTitle title="Rapports disponibles" />
      {['Août 2026','Juillet 2026','Juin 2026'].map((month,index)=>(
        <RobiaCard key={month} style={styles.report}>
          <IconBadge name="assessment" backgroundColor={index===0?Brand.tealLight:Brand.slate100} color={index===0?Brand.tealDark:Brand.slate500} />
          <View style={styles.reportCopy}><Text style={robiaStyles.cardTitle}>{month}</Text><Text style={robiaStyles.caption}>Synthèse de performance · PDF</Text></View>
          <MaterialIcons name="file-download" size={21} color={Brand.tealDark} />
        </RobiaCard>
      ))}
    </RobiaScreen>
  );
}
function Metric({icon,value,label}:{icon:React.ComponentProps<typeof MaterialIcons>['name'];value:string;label:string}){return <RobiaCard style={styles.metric}><MaterialIcons name={icon} size={22} color={Brand.tealDark}/><Text style={styles.metricValue}>{value}</Text><Text style={robiaStyles.caption}>{label}</Text></RobiaCard>}
const styles=StyleSheet.create({
  hero:{gap:16},
  heroTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  month:{color:Brand.navyDark,fontFamily:Fonts?.rounded,fontSize:20,fontWeight:'900'},
  chart:{height:110,flexDirection:'row',alignItems:'flex-end',gap:8},
  bar:{flex:1,minHeight:8,borderRadius:8,backgroundColor:Brand.tealLight},
  barActive:{backgroundColor:Brand.teal},
  metrics:{flexDirection:'row',gap:12},
  metric:{flex:1,gap:7},
  metricValue:{color:Brand.navyDark,fontFamily:Fonts?.rounded,fontSize:25,fontWeight:'900'},
  report:{flexDirection:'row',alignItems:'center',gap:12},
  reportCopy:{flex:1,gap:3},
});
