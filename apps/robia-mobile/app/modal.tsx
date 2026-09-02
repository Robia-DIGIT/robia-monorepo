import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { PrimaryButton, RobiaCard, RobiaScreen, robiaStyles } from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <RobiaScreen scroll={false} contentStyle={styles.content}>
      <RobiaCard style={styles.card} accent={Brand.teal}>
        <MaterialIcons name="auto-awesome" size={38} color={Brand.tealDark} />
        <Text style={styles.title}>RobIA est prêt</Text>
        <Text style={robiaStyles.body}>Votre copilote peut maintenant vous accompagner dans votre prochaine action.</Text>
        <PrimaryButton label="Continuer" onPress={() => router.dismiss()} />
      </RobiaCard>
    </RobiaScreen>
  );
}
const styles=StyleSheet.create({
  content:{justifyContent:'center'},
  card:{gap:16,alignItems:'center'},
  title:{color:Brand.navyDark,fontFamily:Fonts?.rounded,fontSize:26,fontWeight:'900'},
});
