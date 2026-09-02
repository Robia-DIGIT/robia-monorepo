import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, RobiaCard, RobiaHeader, RobiaScreen, robiaStyles } from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';

export default function AuditScreen() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [city, setCity] = useState('');
  const [industry, setIndustry] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  async function launchAudit() {
    if (isRunning) return;
    setIsRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    setIsRunning(false);
    router.dismissTo('/(tabs)');
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <RobiaScreen>
        <RobiaHeader eyebrow="ANALYSE & DÉTECTION" title="Audit gratuit" subtitle="Trois informations suffisent à RobIA pour identifier vos premières opportunités." />
        <RobiaCard style={styles.form} accent={Brand.teal}>
          <LabeledInput icon="language" label="URL du site" placeholder="https://salon-lova.mg" value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" keyboardType="url" />
          <LabeledInput icon="location-on" label="Ville" placeholder="Antananarivo" value={city} onChangeText={setCity} />
          <LabeledInput icon="storefront" label="Secteur d’activité" placeholder="Coiffure" value={industry} onChangeText={setIndustry} />
        </RobiaCard>
        <View style={styles.notice}><MaterialIcons name="verified-user" size={21} color={Brand.tealDark} /><Text style={robiaStyles.body}>Aucune action ne sera publiée sans votre validation.</Text></View>
        {isRunning ? (
          <RobiaCard style={styles.loading}><ActivityIndicator color={Brand.teal} /><View style={styles.loadingCopy}><Text style={robiaStyles.cardTitle}>Analyse en cours…</Text><Text style={robiaStyles.caption}>RobIA explore votre présence locale.</Text></View></RobiaCard>
        ) : (
          <PrimaryButton label="Lancer l’audit gratuit" icon="radar" onPress={launchAudit} />
        )}
      </RobiaScreen>
    </KeyboardAvoidingView>
  );
}

function LabeledInput({ label, icon, ...inputProps }: { label: string; icon: ComponentProps<typeof MaterialIcons>['name'] } & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}><MaterialIcons name={icon} size={20} color={Brand.tealDark} /><TextInput placeholderTextColor={Brand.slate400} style={styles.input} {...inputProps} /></View>
    </View>
  );
}

const styles=StyleSheet.create({
  flex:{flex:1},
  form:{gap:18},
  field:{gap:8},
  label:{color:Brand.navyDark,fontFamily:Fonts?.sans,fontSize:13,fontWeight:'800'},
  inputShell:{minHeight:52,paddingHorizontal:14,borderRadius:17,flexDirection:'row',alignItems:'center',gap:10,backgroundColor:Brand.slate50,borderWidth:1,borderColor:Brand.slate200},
  input:{flex:1,color:Brand.slate800,fontFamily:Fonts?.sans,fontSize:15},
  notice:{paddingHorizontal:4,flexDirection:'row',alignItems:'center',gap:10},
  loading:{flexDirection:'row',alignItems:'center',gap:14},
  loadingCopy:{gap:2},
});
