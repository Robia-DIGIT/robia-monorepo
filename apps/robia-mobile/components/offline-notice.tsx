import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import * as IntentLauncher from 'expo-intent-launcher';
import { useEffect, useState } from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { Brand, Fonts } from '@/constants/theme';

export function OfflineNotice() {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (mounted) setNetworkState(state);
    });
    void NetInfo.fetch().then((state) => {
      if (mounted) setNetworkState(state);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const visible = networkState?.isConnected === false || networkState?.isInternetReachable === false;

  async function openNetworkSettings() {
    try {
      if (Platform.OS === 'android') {
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.WIRELESS_SETTINGS);
      } else if (Platform.OS === 'ios') {
        await Linking.openURL('App-Prefs:WIFI');
      } else {
        await Linking.openSettings();
      }
    } catch {
      // The fallback keeps the popup usable if the platform rejects the intent.
      await Linking.openSettings().catch(() => NetInfo.refresh());
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal accessibilityRole="alert" style={styles.dialog}>
          <View style={styles.iconShell}>
            <AppIcon name="warning" size={34} color={Brand.orangeDark} accessible accessibilityLabel="Hors ligne" />
          </View>
          <Text style={styles.title}>Connexion internet indisponible</Text>
          <Text style={styles.message}>
            Vérifiez votre Wi-Fi ou vos données mobiles pour continuer à utiliser RobIA.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir les réglages Wi-Fi et réseau"
            onPress={() => void openNetworkSettings()}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <AppIcon name="settings" size={19} color={Brand.white} />
            <Text style={styles.buttonLabel}>Ouvrir les réglages réseau</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(23, 45, 71, 0.48)',
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 14,
    padding: 24,
    borderRadius: 16,
    backgroundColor: Brand.white,
  },
  iconShell: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 34,
    backgroundColor: Brand.orangeLight,
  },
  title: {
    color: Brand.navyDark,
    fontFamily: Fonts.rounded,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    color: Brand.slate500,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    minHeight: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Brand.navyDark,
  },
  buttonPressed: { opacity: 0.82 },
  buttonLabel: {
    flexShrink: 1,
    color: Brand.white,
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});