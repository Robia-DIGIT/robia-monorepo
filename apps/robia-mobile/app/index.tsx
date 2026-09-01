import { Image, ImageBackground } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';

const SLIDES = [
  { id: 'analyse', image: require('@/assets/images/splash.png'), eyebrow: 'ANALYSE & DÉTECTION', title: 'Révélez votre potentiel local', description: 'RobIA Copilot détecte les opportunités invisibles et transforme vos données en actions concrètes.' },
  { id: 'creation', image: require('@/assets/images/splash2.png'), eyebrow: 'CRÉATION', title: 'Créez une présence qui compte', description: 'Produisez une communication locale, multilingue et cohérente, guidée par votre copilote IA.' },
  { id: 'execution', image: require('@/assets/images/splash3.png'), eyebrow: 'EXÉCUTION', title: 'Gardez le contrôle à chaque étape', description: 'RobIA prépare, traduit et vérifie. Vous validez toujours avant chaque mise en ligne.' },
  { id: 'pilotage', image: require('@/assets/images/spalsh4.png'), eyebrow: 'PILOTAGE', title: 'Pilotez votre visibilité simplement', description: 'Suivez vos actions dans le temps et avancez avec des priorités claires, au même endroit.' },
] as const;

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === SLIDES.length - 1;
  const finish = () => router.replace('/(tabs)');

  const goNext = () => {
    if (isLastSlide) return finish();
    listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => (
          <ImageBackground source={item.image} contentFit="cover" transition={250} style={[styles.slide, { width }]} accessibilityLabel={`Illustration : ${item.title}`}>
            <View style={styles.imageShade} />
            <SafeAreaView edges={['top']} style={styles.slideHeader}>
              <View style={styles.brandRow}>
                <View style={styles.brandMark}><Image source={require('@/assets/images/logo-robia-copilot.svg')} contentFit="contain" style={styles.brandLogo} accessibilityLabel="Logo RobIA Copilot" /></View>

              </View>
            </SafeAreaView>
            <View style={styles.content}>
              <Text style={styles.eyebrow}>{item.eyebrow}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </ImageBackground>
        )}
      />
      <SafeAreaView edges={['bottom']} style={styles.controls}>
        <View style={styles.progressRow} accessibilityLabel={`Étape ${activeIndex + 1} sur 4`}>
          {SLIDES.map((slide, index) => <View key={slide.id} style={[styles.progressDot, index === activeIndex && styles.progressDotActive]} />)}
        </View>
        <View style={styles.actions}>
          {!isLastSlide ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Passer la présentation" hitSlop={10} onPress={finish} style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
              <Text style={styles.skipLabel}>Passer</Text>
            </Pressable>
          ) : <View style={styles.skipButton} />}
          <Pressable accessibilityRole="button" accessibilityLabel={isLastSlide ? "Découvrir l'application" : 'Étape suivante'} onPress={goNext} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryLabel}>{isLastSlide ? 'Découvrir RobIA' : 'Continuer'}</Text>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.navyDark },
  slide: { flex: 1, justifyContent: 'space-between' },
  imageShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 24, 35, 0.26)', borderBottomColor: 'rgba(5, 24, 35, 0.72)', borderBottomWidth: 220 },
  slideHeader: { paddingHorizontal: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8 },
  brandMark: { width: 64, height: 40, alignItems: 'center', justifyContent: 'center' },
  brandLogo: { width: 60, height: 35 },
  brandName: { color: Brand.white, fontSize: 18, lineHeight: 22, fontWeight: '800' },
  brandTagline: { color: 'rgba(255,255,255,0.78)', fontSize: 11, lineHeight: 15 },
  content: { paddingHorizontal: 24, paddingBottom: 150 },
  eyebrow: { alignSelf: 'flex-start', color: '#5EEAD4', fontSize: 12, lineHeight: 16, fontWeight: '800', letterSpacing: 1.4, marginBottom: 10 },
  title: { color: Brand.white, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -0.8 },
  description: { color: 'rgba(255,255,255,0.84)', fontSize: 16, lineHeight: 23, marginTop: 12, maxWidth: 530 },
  controls: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 16, backgroundColor: 'rgba(5, 24, 35, 0.78)' },
  progressRow: { flexDirection: 'row', gap: 7, marginBottom: 18 },
  progressDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.34)' },
  progressDotActive: { width: 30, backgroundColor: Brand.teal },
  actions: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  skipButton: { minWidth: 64, minHeight: 48, justifyContent: 'center' },
  skipLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 15, fontWeight: '600' },
  primaryButton: { minHeight: 52, flex: 1, maxWidth: 245, borderRadius: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Brand.teal },
  primaryLabel: { color: Brand.white, fontSize: 16, fontWeight: '800' },
  arrow: { color: Brand.white, fontSize: 22, lineHeight: 24 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
