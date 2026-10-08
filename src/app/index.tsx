import { memo, useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { AnimalFace } from '@/components/game/AnimalFace';
import { APP_NAME, SPLASH_DURATION_MS } from '@/constants/app';
import type { FaceAnimal } from '@/constants/animals';
import { BrutalistCard, Decorations } from '@/components/ui';
import { useSettingsStore } from '@/store/settingsStore';
import { arrowColors, colors, fontSizes, fonts, palette, spacing, textStyles, themed } from '@/theme';

/** When the arrows zip away (on "ESCAPE."), and how long the zip takes. */
const ZIP_AT_MS = 1020;
const ZIP_MS = 360;
/** The three beats of the tagline. */
const WORDS = [
  { text: 'TAP.', at: 300 },
  { text: 'THINK.', at: 560 },
  { text: 'ESCAPE.', at: 820 },
] as const;

/** The logo stage: arrows sit above and below the card, in fractions of the stage. */
const STAGE_H = 290;
interface SplashArrowSpec {
  animal: FaceAnimal;
  color: string;
  /** Head position, as fractions of the stage width / height. */
  head: { x: number; y: number };
  dir: { x: number; y: number };
  /** Body length in px, behind the head. */
  length: number;
}
const ARROWS: SplashArrowSpec[] = [
  { animal: 'lion', color: arrowColors.orange, head: { x: 0.2, y: 0.12 }, dir: { x: 0, y: -1 }, length: 58 },
  { animal: 'elephant', color: arrowColors.blue, head: { x: 0.86, y: 0.15 }, dir: { x: 1, y: 0 }, length: 96 },
  { animal: 'monkey', color: arrowColors.pink, head: { x: 0.14, y: 0.86 }, dir: { x: -1, y: 0 }, length: 96 },
  { animal: 'fox', color: arrowColors.green, head: { x: 0.8, y: 0.88 }, dir: { x: 0, y: 1 }, length: 58 },
];
const HEAD = 50;

/**
 * Splash: the logo pops in with the game's own animal arrows around it, the tagline lands in
 * three beats, then on "ESCAPE." the arrows zip off the screen, which is the whole game in a second
 * and a half. Tap anywhere to skip. Stores hydrate synchronously from MMKV, so no loading gate.
 */
export default function SplashRoute() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const stageW = Math.min(screenW - spacing.lg * 2, 360);

  const left = useRef(false);
  const go = useCallback(() => {
    if (left.current) return;
    left.current = true;
    router.replace('/home');
  }, [router]);
  useEffect(() => {
    const t = setTimeout(go, SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, [go]);

  const scale = useSharedValue(reducedMotion ? 1 : 0.6);
  useEffect(() => {
    if (!reducedMotion) scale.value = withSpring(1, { damping: 8, stiffness: 140 });
  }, [reducedMotion, scale]);
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { rotate: '-3deg' }] }));

  return (
    <Pressable style={styles.root} onPress={go} accessibilityRole="button" accessibilityLabel={`${APP_NAME}. Tap to start`}>
      <Decorations />
      <View style={[styles.stage, { width: stageW, height: STAGE_H }]}>
        {ARROWS.map((a, i) => (
          <SplashArrow key={a.animal} spec={a} index={i} stageW={stageW} reducedMotion={reducedMotion} />
        ))}
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <BrutalistCard color="primary" shadow="lg" contentStyle={styles.logo}>
            {/* Two tones read as ARROW + ZING; shrinks to fit a 320dp phone. */}
            <Text style={styles.logoText} numberOfLines={1} adjustsFontSizeToFit>
              ARROW<Text style={styles.logoZing}>ZING</Text>
            </Text>
          </BrutalistCard>
        </Animated.View>
      </View>
      <View style={styles.tagline}>
        {WORDS.map((w, i) => (
          <Word key={w.text} text={w.text} at={w.at} accent={i === WORDS.length - 1} reducedMotion={reducedMotion} />
        ))}
      </View>
    </Pressable>
  );
}

/** One tagline word, popping in on its beat. */
const Word = memo(function Word({ text, at, accent, reducedMotion }: { text: string; at: number; accent: boolean; reducedMotion: boolean }) {
  const s = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (!reducedMotion) s.value = withDelay(at, withSpring(1, { damping: 9, stiffness: 220 }));
  }, [reducedMotion, at, s]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, s.value * 2), transform: [{ scale: 0.4 + 0.6 * s.value }] }));
  return (
    <Animated.View style={style}>
      <Text style={[styles.word, accent && styles.wordAccent]}>{text}</Text>
    </Animated.View>
  );
});

/** An animal arrow: pops in, waits, then zips off the screen the way it faces. */
const SplashArrow = memo(function SplashArrow({
  spec,
  index,
  stageW,
  reducedMotion,
}: {
  spec: SplashArrowSpec;
  index: number;
  stageW: number;
  reducedMotion: boolean;
}) {
  const pop = useSharedValue(reducedMotion ? 1 : 0);
  const zip = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    pop.value = withDelay(120 + index * 80, withSpring(1, { damping: 10, stiffness: 200 }));
    zip.value = withDelay(ZIP_AT_MS + index * 50, withTiming(1, { duration: ZIP_MS, easing: Easing.in(Easing.cubic) }));
  }, [reducedMotion, index, pop, zip]);

  const hx = spec.head.x * stageW;
  const hy = spec.head.y * STAGE_H;
  const tx = hx - spec.dir.x * spec.length;
  const ty = hy - spec.dir.y * spec.length;
  // Far enough to clear any screen edge from anywhere on the stage.
  const travel = 900;
  const style = useAnimatedStyle(() => ({
    opacity: pop.value > 0 ? 1 : 0,
    transform: [
      { translateX: spec.dir.x * travel * zip.value },
      { translateY: spec.dir.y * travel * zip.value },
      { scale: 0.3 + 0.7 * Math.min(1, pop.value) },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg style={StyleSheet.absoluteFill} width={stageW} height={STAGE_H}>
        <Line x1={tx} y1={ty} x2={hx} y2={hy} stroke={colors.artInk} strokeWidth={16} strokeLinecap="round" />
        <Line x1={tx} y1={ty} x2={hx} y2={hy} stroke={spec.color} strokeWidth={9} strokeLinecap="round" />
      </Svg>
      <View style={[styles.head, { left: hx - HEAD / 2, top: hy - HEAD / 2 }]}>
        <AnimalFace animal={spec.animal} color={spec.color} dir={spec.dir} mood="happy" size={HEAD} />
      </View>
    </Animated.View>
  );
});

const styles = themed(() => StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  stage: { justifyContent: 'center', alignItems: 'center' },
  logoWrap: { maxWidth: '100%' },
  logo: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  logoText: { ...textStyles.display, color: palette.black },
  logoZing: {
    color: palette.white,
    textShadowColor: palette.black,
    textShadowOffset: { width: 3, height: 3 },
    // Android drops the shadow entirely at radius 0.
    textShadowRadius: 1,
  },
  head: { position: 'absolute', width: HEAD, height: HEAD },
  tagline: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md },
  word: { fontSize: fontSizes.lg, fontFamily: fonts.display, color: colors.ink, letterSpacing: 1 },
  wordAccent: { color: palette.orange },
}));
