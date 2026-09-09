import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Fonts } from '@/constants/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const SLIDES = [
  {
    id: 'analyse',
    image: require('@/assets/images/splash.png'),
    icon: 'travel-explore' as IconName,
    eyebrow: 'INTELLIGENCE LOCALE',
    title: 'Voyez ce que votre marché révèle.',
    description: 'RobIA analyse votre présence locale et fait émerger les opportunités qui comptent vraiment.',
    metric: '+24%',
    metricLabel: 'de potentiel détecté',
    signal: 'Analyse terminée',
    accent: Brand.teal,
    tint: Brand.tealLight,
  },
  {
    id: 'creation',
    image: require('@/assets/images/splash2.png'),
    icon: 'auto-awesome' as IconName,
    eyebrow: 'CRÉATION ASSISTÉE',
    title: 'Transformez les idées en présence.',
    description: 'Créez des contenus locaux, cohérents et multilingues avec votre copilote à vos côtés.',
    metric: '3×',
    metricLabel: 'plus rapide à publier',
    signal: 'Contenu prêt',
    accent: Brand.electric,
    tint: Brand.electricLight,
  },
  {
    id: 'execution',
    image: require('@/assets/images/splash3.png'),
    icon: 'verified-user' as IconName,
    eyebrow: 'VALIDATION HUMAINE',
    title: 'Gardez toujours le dernier mot.',
    description: 'RobIA prépare, traduit et vérifie. Rien n’est publié sans votre validation explicite.',
    metric: '100%',
    metricLabel: 'sous votre contrôle',
    signal: 'À valider',
    accent: Brand.orange,
    tint: Brand.orangeLight,
  },
  {
    id: 'pilotage',
    image: require('@/assets/images/spalsh4.png'),
    icon: 'insights' as IconName,
    eyebrow: 'PILOTAGE CONTINU',
    title: 'Avancez avec une priorité claire.',
    description: 'Actions, résultats et prochaines étapes restent réunis dans un espace simple à piloter.',
    metric: '4/4',
    metricLabel: 'actions centralisées',
    signal: 'Tout est à jour',
    accent: Brand.navy,
    tint: '#E5EDF6',
  },
] as const;

const GRID_DOTS = Array.from({ length: 35 });

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === SLIDES.length - 1;
  const compact = height < 720;
  const visualHeight = Math.min(390, Math.max(280, height * (compact ? 0.37 : 0.43)));

  const finish = () => router.replace('/auth');

  const goNext = () => {
    if (isLastSlide) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/logo-robia-copilot.svg')}
          contentFit="contain"
          style={styles.logo}
          accessibilityLabel="RobIA Copilot"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Passer la présentation"
          hitSlop={10}
          onPress={finish}
          style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item, index }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.visual, { height: visualHeight, backgroundColor: item.tint }]}>
              <View pointerEvents="none" style={styles.dotGrid}>
                {GRID_DOTS.map((_, dotIndex) => <View key={dotIndex} style={styles.dot} />)}
              </View>
              <View style={styles.orbitTop} />
              <View style={styles.orbitBottom} />

              <View style={styles.imageFrame}>
                <Image
                  source={item.image}
                  contentFit="cover"
                  contentPosition="center"
                  transition={220}
                  style={styles.heroImage}
                  accessibilityLabel={'Illustration : ' + item.title}
                />
                <View style={styles.imageShade} />
                <View style={styles.imageCaption}>
                  <View style={[styles.captionIcon, { backgroundColor: item.accent }]}>
                    <MaterialIcons name={item.icon} size={18} color={Brand.white} />
                  </View>
                  <View>
                    <Text style={styles.captionOverline}>ROBIA COPILOT</Text>
                    <Text style={styles.captionText}>{item.signal}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricMark, { backgroundColor: item.accent }]} />
                <Text style={styles.metricValue}>{item.metric}</Text>
                <Text style={styles.metricLabel}>{item.metricLabel}</Text>
              </View>

              <View style={[styles.aiChip, { backgroundColor: item.accent }]}>
                <MaterialIcons name="auto-awesome" size={15} color={Brand.white} />
                <Text style={styles.aiChipText}>Insight {index + 1}</Text>
              </View>
            </View>

            <View style={[styles.copy, compact && styles.copyCompact]}>
              <Text style={[styles.eyebrow, { color: item.accent }]}>{item.eyebrow}</Text>
              <Text style={[styles.title, compact && styles.titleCompact]}>{item.title}</Text>
              <Text style={[styles.description, compact && styles.descriptionCompact]}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.progress} accessibilityLabel={'Étape ' + (activeIndex + 1) + ' sur ' + SLIDES.length}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.progressTrack, index === activeIndex && styles.progressTrackActive]}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? 'Commencer avec RobIA' : 'Continuer'}
          onPress={goNext}
          style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}>
          <Text style={styles.nextText}>{isLastSlide ? 'Commencer' : 'Continuer'}</Text>
          <View style={styles.nextIcon}>
            <MaterialIcons name={isLastSlide ? 'check' : 'arrow-forward'} size={19} color={Brand.white} />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.slate50 },
  header: {
    height: 62,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 74, height: 38 },
  skipButton: {
    minHeight: 38,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.slate200,
  },
  skipText: { color: Brand.navyDark, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '800' },
  slide: { paddingHorizontal: 18 },
  visual: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.08)',
  },
  dotGrid: {
    position: 'absolute',
    width: 170,
    right: -8,
    top: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    opacity: 0.25,
  },
  dot: { width: 2, height: 2, borderRadius: 1, backgroundColor: Brand.navyDark },
  orbitTop: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    left: -65,
    top: -55,
    borderWidth: 28,
    borderColor: 'rgba(255,255,255,0.46)',
  },
  orbitBottom: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    right: -75,
    bottom: -100,
    borderWidth: 1,
    borderColor: 'rgba(23,45,71,0.12)',
  },
  imageFrame: {
    position: 'absolute',
    width: '64%',
    height: '78%',
    right: '8%',
    top: '9%',
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: Brand.white,
    backgroundColor: Brand.slate200,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    transform: [{ rotate: '3deg' }],
  },
  heroImage: { width: '100%', height: '100%' },
  imageShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: 'rgba(23,45,71,0.56)',
  },
  imageCaption: {
    position: 'absolute',
    left: 13,
    right: 10,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  captionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  captionOverline: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: Fonts.sans,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  captionText: { color: Brand.white, fontFamily: Fonts.rounded, fontSize: 13, fontWeight: '900', marginTop: 2 },
  metricCard: {
    position: 'absolute',
    left: '5%',
    bottom: '10%',
    width: 132,
    minHeight: 108,
    padding: 15,
    borderRadius: 22,
    backgroundColor: Brand.white,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 9,
    transform: [{ rotate: '-4deg' }],
  },
  metricMark: { width: 24, height: 4, borderRadius: 2, marginBottom: 9 },
  metricValue: { color: Brand.navyDark, fontFamily: Fonts.rounded, fontSize: 27, lineHeight: 30, fontWeight: '900' },
  metricLabel: {
    color: Brand.slate500,
    fontFamily: Fonts.sans,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    marginTop: 3,
  },
  aiChip: {
    position: 'absolute',
    left: '7%',
    top: '12%',
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 5,
  },
  aiChipText: { color: Brand.white, fontFamily: Fonts.sans, fontSize: 10, fontWeight: '800' },
  copy: { alignItems: 'flex-start', paddingHorizontal: 7, paddingTop: 24 },
  copyCompact: { paddingTop: 16 },
  eyebrow: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.35,
    marginBottom: 8,
  },
  title: {
    color: Brand.navyDark,
    fontFamily: Fonts.rounded,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900',
    letterSpacing: -0.8,
    maxWidth: 470,
  },
  titleCompact: { fontSize: 26, lineHeight: 30 },
  description: {
    color: Brand.slate500,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 470,
  },
  descriptionCompact: { fontSize: 13, lineHeight: 18, marginTop: 7 },
  footer: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 8, gap: 15 },
  progress: { height: 4, flexDirection: 'row', gap: 6 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Brand.slate200 },
  progressTrackActive: { backgroundColor: Brand.teal },
  nextButton: {
    minHeight: 56,
    paddingLeft: 22,
    paddingRight: 7,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.navyDark,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 7,
  },
  nextText: { color: Brand.white, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '800' },
  nextIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.teal,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
