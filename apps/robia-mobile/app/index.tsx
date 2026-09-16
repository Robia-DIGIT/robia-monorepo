import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Brand, Fonts } from "@/constants/theme";

const SLIDES = [
  {
    id: "analyse",
    image: require("@/assets/images/splash.png"),
    secondaryImage: require("@/assets/images/splash2.png"),
    title: "Analyse & détection",
    description:
      "Découvrez ce qui vous rend invisible sur le web. RobIA analyse votre présence en ligne et identifie vos opportunités de visibilité.",
  },
  {
    id: "creation",
    image: require("@/assets/images/splash2.png"),
    secondaryImage: require("@/assets/images/splash3.png"),
    title: "Création",
    description:
      "Donnez vie à votre présence locale. RobIA crée des contenus adaptés à votre entreprise, en plusieurs langues, pour vous aider à être trouvé.",
  },
  {
    id: "execution",
    image: require("@/assets/images/splash3.png"),
    secondaryImage: require("@/assets/images/splash.png"),
    title: "Exécution",
    description:
      "Vous gardez le dernier mot. Vérifiez, modifiez et validez les contenus proposés : aucune publication sans votre validation.",
  },
  {
    id: "pilotage",
    image: require("@/assets/images/spalsh4.png"),
    secondaryImage: require("@/assets/images/splash2.png"),
    title: "Pilotage",
    description:
      "Suivez vos sites et votre visibilité dans le temps. Retrouvez vos actions, vos résultats et vos prochaines priorités au même endroit.",
  },
] as const;

type Slide = (typeof SLIDES)[number];

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    let receivedChange = false;
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        receivedChange = true;
        setReduceMotion(enabled);
      },
    );
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted && !receivedChange) setReduceMotion(enabled);
      })
      .catch(() => {});
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  // Keep interpolation aligned with the restored page when the viewport changes.
  const previousWidth = useRef(width);
  useEffect(() => {
    if (previousWidth.current !== width) {
      scrollX.setValue(activeIndex * width);
      previousWidth.current = width;
    }
  }, [activeIndex, scrollX, width]);

  const interpolatePage = (index: number, outputRange: number[]) =>
    scrollX.interpolate({
      inputRange: [(index - 1) * width, index * width, (index + 1) * width],
      outputRange,
      extrapolate: "clamp",
    });

  const pageMotion = (index: number, distance: number, scale = 1) =>
    reduceMotion
      ? {}
      : {
          opacity: interpolatePage(index, [0.15, 1, 0.15]),
          transform: [
            { translateX: interpolatePage(index, [distance, 0, -distance]) },
            { translateY: interpolatePage(index, [12, 0, 12]) },
            { scale: interpolatePage(index, [scale, 1, scale]) },
          ],
        };

  const compact = height < 720;
  const stageWidth = Math.min(width - 40, 360);
  const stageHeight = stageWidth * (compact ? 0.88 : 1.02);
  const isLastSlide = activeIndex === SLIDES.length - 1;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Slide>[] }) => {
      const index = viewableItems[0]?.index;
      if (index != null) setActiveIndex(index);
    },
  ).current;

  const finish = () => router.replace("/auth");
  const goToSlide = (index: number) => {
    listRef.current?.scrollToIndex({ index, animated: !reduceMotion });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.header, compact && styles.headerCompact]}>
        <Image
          source={require("@/assets/images/logo-robia-copilot.png")}
          contentFit="contain"
          style={styles.logo}
          accessibilityLabel="RobIA Copilot"
        />
        <Text style={styles.brandName}>
          RobIA <Text style={styles.brandAccent}>Copilot</Text>
        </Text>
      </View>

      <Animated.FlatList
        key={width}
        ref={listRef}
        data={SLIDES}
        style={styles.carousel}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: Platform.OS !== "web" },
        )}
        initialScrollIndex={activeIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={({ item, index }) => (
          <ScrollView
            style={{ width }}
            contentContainerStyle={[
              styles.slide,
              compact && styles.slideCompact,
            ]}
            showsVerticalScrollIndicator={false}
            accessible={false}
            importantForAccessibility={
              index === activeIndex ? "auto" : "no-hide-descendants"
            }
            accessibilityElementsHidden={index !== activeIndex}
          >
            <Animated.View
              pointerEvents="none"
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.visual,
                { width: stageWidth, height: stageHeight },
                pageMotion(index, 28, 0.94),
              ]}
            >
              <View
                style={[
                  styles.backdrop,
                  index % 2 === 1 && styles.backdropAlternate,
                ]}
              />
              <View
                style={[
                  styles.photo,
                  styles.backPhoto,
                  index % 2 === 1 && styles.backPhotoAlternate,
                ]}
              >
                <Animated.View
                  style={[
                    styles.photoImage,
                    reduceMotion
                      ? undefined
                      : {
                          transform: [
                            {
                              translateY: interpolatePage(index, [18, 0, -18]),
                            },
                            { scale: 1.12 },
                          ],
                        },
                  ]}
                >
                  <Image
                    source={item.secondaryImage}
                    contentFit="cover"
                    style={styles.photoImage}
                  />
                </Animated.View>
              </View>
              <View
                style={[
                  styles.photo,
                  styles.frontPhoto,
                  index % 2 === 1 && styles.frontPhotoAlternate,
                ]}
              >
                <Animated.View
                  style={[
                    styles.photoImage,
                    reduceMotion
                      ? undefined
                      : {
                          transform: [
                            {
                              translateY: interpolatePage(index, [-12, 0, 12]),
                            },
                            { scale: 1.1 },
                          ],
                        },
                  ]}
                >
                  <Image
                    source={item.image}
                    contentFit="cover"
                    style={styles.photoImage}
                  />
                </Animated.View>
              </View>
            </Animated.View>

            <View
              style={styles.pagination}
              accessibilityLabel={"Étape " + (index + 1) + " sur 4"}
            >
              {SLIDES.map((slide, dotIndex) => (
                <Pressable
                  key={slide.id}
                  accessibilityRole="button"
                  accessibilityLabel={
                    "Étape " + (dotIndex + 1) + " : " + slide.title
                  }
                  accessibilityState={{ selected: dotIndex === index }}
                  onPress={() => goToSlide(dotIndex)}
                  style={styles.dotTarget}
                >
                  <View style={styles.dot}>
                    <Animated.View
                      style={[
                        styles.dotHighlight,
                        reduceMotion
                          ? {
                              opacity: dotIndex === activeIndex ? 1 : 0,
                              transform: [{ scaleX: 1 }],
                            }
                          : {
                              opacity: interpolatePage(dotIndex, [0, 1, 0]),
                              transform: [
                                {
                                  scaleX: interpolatePage(
                                    dotIndex,
                                    [0.2, 1, 0.2],
                                  ),
                                },
                              ],
                            },
                      ]}
                    />
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={[styles.copy, compact && styles.copyCompact]}>
              <Animated.Text
                accessibilityRole="header"
                style={[
                  styles.title,
                  compact && styles.titleCompact,
                  pageMotion(index, 48),
                ]}
              >
                {item.title}
              </Animated.Text>
              <Animated.Text
                style={[styles.description, pageMotion(index, 68)]}
              >
                {item.description}
              </Animated.Text>
            </View>
          </ScrollView>
        )}
      />

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Passer la présentation"
          onPress={finish}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isLastSlide ? "Commencer avec RobIA" : "Étape suivante"
          }
          onPress={() => (isLastSlide ? finish() : goToSlide(activeIndex + 1))}
          style={({ pressed }) => [
            styles.nextButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.nextCore}>
            <MaterialIcons
              name={isLastSlide ? "check" : "chevron-right"}
              size={28}
              color={Brand.navyDark}
            />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.white },
  header: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerCompact: { height: 48 },
  logo: { width: 37, height: 29 },
  brandName: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: "700",
    color: Brand.navyDark,
  },
  brandAccent: { color: Brand.tealDark },
  carousel: { flex: 1 },
  slide: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 24,
  },
  slideCompact: { paddingTop: 8, paddingBottom: 16 },
  visual: { alignSelf: "center" },
  backdrop: {
    position: "absolute",
    top: "13%",
    left: "13%",
    width: "74%",
    height: "77%",
    borderRadius: 30,
    backgroundColor: "#F1F8E2",
    transform: [{ rotate: "13deg" }],
  },
  backdropAlternate: { transform: [{ rotate: "-12deg" }] },
  photo: {
    position: "absolute",
    width: "53%",
    height: "68%",
    overflow: "hidden",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Brand.white,
    backgroundColor: "#EEF2EA",
  },
  backPhoto: { left: "6%", top: "19%", transform: [{ rotate: "-11deg" }] },
  frontPhoto: { right: "5%", top: "8%", transform: [{ rotate: "7deg" }] },
  backPhotoAlternate: { top: "6%", transform: [{ rotate: "-10deg" }] },
  frontPhotoAlternate: { top: "24%", transform: [{ rotate: "9deg" }] },
  photoImage: { width: "100%", height: "100%" },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  dotTarget: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#E9ECE4" },
  dotHighlight: {
    position: "absolute",
    left: -10.5,
    top: 0,
    width: 26,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#B9E463",
  },
  copy: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 14,
    maxWidth: 410,
  },
  copyCompact: { paddingTop: 4 },
  title: {
    color: "#14181B",
    fontFamily: Fonts.sans,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.7,
    textAlign: "center",
  },
  titleCompact: { fontSize: 24, lineHeight: 30 },
  description: {
    color: "#63686B",
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 330,
  },
  footer: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipButton: {
    minWidth: 72,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: "#F6F6F6",
    justifyContent: "center",
    alignItems: "center",
  },
  skipText: { fontFamily: Fonts.sans, fontSize: 12, color: "#33383B" },
  nextButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: "#B3DB60",
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  nextCore: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C2E970",
  },
  pressed: { opacity: 0.65 },
});
