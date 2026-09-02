import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { RobiaCard, RobiaHeader, RobiaScreen, SectionTitle, robiaStyles } from '@/components/robia-ui';
import { Brand } from '@/constants/theme';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(true);
  return (
    <RobiaScreen>
      <RobiaHeader eyebrow="PRÉFÉRENCES" title="Paramètres du compte" subtitle="Personnalisez votre expérience RobIA et vos communications." />
      <SectionTitle title="Notifications" />
      <RobiaCard style={styles.group}>
        <Setting icon="notifications-none" title="Alertes d’opportunités" description="Recevoir les nouvelles recommandations" value={notifications} onValueChange={setNotifications} />
        <Setting icon="assessment" title="Rapport mensuel" description="Recevoir la synthèse de performance" value={monthlyReport} onValueChange={setMonthlyReport} border />
      </RobiaCard>
      <SectionTitle title="Compte" />
      <RobiaCard style={styles.group}>
        <Info icon="business" title="Établissement" value="Salon Lova Coiffure" />
        <Info icon="language" title="Langue" value="Français" border />
        <Info icon="security" title="Confidentialité" value="Gérer" border />
      </RobiaCard>
      <View style={styles.security}><MaterialIcons name="verified-user" size={20} color={Brand.tealDark}/><Text style={robiaStyles.body}>Vos données restent protégées et ne sont jamais publiées sans validation.</Text></View>
    </RobiaScreen>
  );
}
function Setting({icon,title,description,value,onValueChange,border}:{icon:React.ComponentProps<typeof MaterialIcons>['name'];title:string;description:string;value:boolean;onValueChange:(value:boolean)=>void;border?:boolean}){return <View style={[styles.row,border&&styles.border]}><View style={styles.icon}><MaterialIcons name={icon} size={20} color={Brand.tealDark}/></View><View style={styles.copy}><Text style={robiaStyles.cardTitle}>{title}</Text><Text style={robiaStyles.caption}>{description}</Text></View><Switch value={value} onValueChange={onValueChange} trackColor={{false:Brand.slate200,true:Brand.tealLight}} thumbColor={value?Brand.teal:Brand.slate400}/></View>}
function Info({icon,title,value,border}:{icon:React.ComponentProps<typeof MaterialIcons>['name'];title:string;value:string;border?:boolean}){return <View style={[styles.row,border&&styles.border]}><View style={styles.icon}><MaterialIcons name={icon} size={20} color={Brand.tealDark}/></View><View style={styles.copy}><Text style={robiaStyles.cardTitle}>{title}</Text><Text style={robiaStyles.caption}>{value}</Text></View><MaterialIcons name="chevron-right" size={21} color={Brand.slate400}/></View>}
const styles=StyleSheet.create({
  group:{paddingVertical:3},
  row:{minHeight:72,paddingVertical:11,flexDirection:'row',alignItems:'center',gap:12},
  border:{borderTopWidth:1,borderTopColor:Brand.slate100},
  icon:{width:40,height:40,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:Brand.tealLight},
  copy:{flex:1,gap:2},
  security:{padding:15,borderRadius:18,flexDirection:'row',alignItems:'center',gap:10,backgroundColor:Brand.tealLight},
});
