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

const SLIDES = [
  {
    id: 'analyse',
    image: require('@/assets/images/splash.png'),
    secondaryImage: require('@/assets/images/splash2.png'),
    eyebrow: 'ANALYSE & DÉTECTION',
    title: 'Révélez votre potentiel local',
    description:
      'RobIA Copilot détecte les opportunités invisibles et transforme vos données en actions concrètes.',
  },
  {
    id: 'creation',
    image: require('@/assets/images/splash2.png'),
    secondaryImage: require('@/assets/images/splash3.png'),
    eyebrow: 'CRÉATION',
    title: 'Créez une présence qui compte',
    description:
      'Produisez une communication locale, multilingue et cohérente, guidée par votre copilote IA.',
  },
  {
    id: 'execution',
    image: require('@/assets/images/splash3.png'),
    secondaryImage: require('@/assets/images/spalsh4.png'),
    eyebrow: 'EXÉCUTION',
    title: 'Gardez le contrôle à chaque étape',
    description:
      'RobIA prépare, traduit et vérifie. Vous validez toujours avant chaque mise en ligne.',
  },
  {
    id: 'pilotage',
    image: require('@/assets/images/spalsh4.png'),
    secondaryImage: require('@/assets/images/splash.png'),
    eyebrow: 'PILOTAGE',
    title: 'Pilotez votre visibilité simplement',
    description:
      'Suivez vos actions dans le temps et avancez avec des priorités claires, au même endroit.',
  },
] as const;

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === SLIDES.length - 1;
  const heroHeight = Math.min(370, Math.max(285, height * 0.4));

  const finish = () => router.replace('/(tabs)');

  const goNext = () => {
    if (isLastSlide) return finish();
    listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.brandHeader}>
        <Image
          source={require('@/assets/images/logo-robia-copilot.svg')}
          contentFit="contain"
          style={styles.brandLogo}
          accessibilityLabel="Logo RobIA Copilot"
        />
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
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.hero, { height: heroHeight }]}>
              <View style={styles.heroBlob} />
              <View style={[styles.photoCard, styles.photoCardLeft]}>
                <Image
                  source={item.secondaryImage}
                  contentFit="cover"
                  contentPosition="center"
                  transition={200}
                  style={styles.photo}
                  accessibilityLabel=""
                />
              </View>
              <View style={[styles.photoCard, styles.photoCardRight]}>
                <Image
                  source={item.image}
                  contentFit="cover"
                  contentPosition="center"
                  transition={200}
                  style={styles.photo}
                  accessibilityLabel={`Illustration : ${item.title}`}
                />
              </View>
            </View>

            <View style={styles.copy}>
              <Text style={styles.eyebrow}>{item.eyebrow}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.progressRow} accessibilityLabel={`Étape ${activeIndex + 1} sur 4`}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.progressDot, index === activeIndex && styles.progressDotActive]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          {!isLastSlide ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Passer la présentation"
              hitSlop={10}
              onPress={finish}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
              <Text style={styles.skipLabel}>Passer</Text>
            </Pressable>
          ) : (
            <View style={styles.skipButton} />
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLastSlide ? "Découvrir l'application" : 'Étape suivante'}
            onPress={goNext}
            style={({ pressed }) => [styles.nextButtonOuter, pressed && styles.pressed]}>
            <View style={styles.nextButton}>
              <MaterialIcons
                name={isLastSlide ? 'check' : 'arrow-forward'}
                size={20}
                color={Brand.white}
              />
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.slate50,
  },
  brandHeader: {
    height: 64,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 58,
    height: 38,
  },
  brandDivider: {
    width: 1,
    height: 22,
    marginHorizontal: 12,
    backgroundColor: Brand.slate200,
  },
  brandTagline: {
    color: Brand.slate500,
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
  },
  slide: {
    paddingHorizontal: 24,
  },
  hero: {
    position: 'relative',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  heroBlob: {
    position: 'absolute',
    width: '72%',
    height: '72%',
    left: '14%',
    top: '14%',
    borderRadius: 48,
    backgroundColor: Brand.tealLight,
    transform: [{ rotate: '5deg' }],
  },
  photoCard: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: Brand.white,
    backgroundColor: Brand.slate200,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 7,
  },
  photoCardLeft: {
    width: '52%',
    height: '66%',
    left: '7%',
    top: '20%',
    transform: [{ rotate: '-8deg' }],
  },
  photoCardRight: {
    width: '54%',
    height: '72%',
    right: '6%',
    top: '9%',
    transform: [{ rotate: '7deg' }],
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  copy: {
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: -6,
  },
  eyebrow: {
    color: Brand.tealDark,
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 10,
  },
  title: {
    color: Brand.navyDark,
    fontFamily: Fonts.rounded,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
    maxWidth: 430,
  },
  description: {
    color: Brand.slate500,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    textAlign: 'center',
    maxWidth: 430,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  progressDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: Brand.slate200,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: Brand.teal,
  },
  actions: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    minWidth: 72,
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Brand.white,
  },
  skipLabel: {
    color: Brand.slate500,
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  nextButtonOuter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 3,
    borderWidth: 1.5,
    borderColor: Brand.teal,
  },
  nextButton: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.teal,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.97 }],
  },
});
