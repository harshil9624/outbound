import { memo, useCallback, useEffect, useRef } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { APP_NAME, SPLASH_DURATION_MS } from '@/constants/app';
import { Decorations } from '@/components/ui';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, fontSizes, fonts, palette, spacing, themed } from '@/theme';

/** The app logo (assets/images/logo.png: the icon artwork with transparent corners). */
const LOGO = require('../../assets/images/logo.png');
/** The three beats of the tagline. */
const WORDS = [
  { text: 'TAP.', at: 300 },
  { text: 'THINK.', at: 560 },
  { text: 'ESCAPE.', at: 820 },
] as const;

/**
 * Splash: the app logo (the same artwork as the icon and the launch screen) pops in, and the
 * tagline lands in three beats. Tap anywhere to skip. Stores hydrate synchronously from MMKV,
 * so no loading gate.
 */
export default function SplashRoute() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  // About the launch splash's size (200 dp), so the two screens match; half the width on small phones.
  const logoSize = Math.min(Math.round(screenW * 0.5), 200);

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
      <Animated.View style={logoStyle}>
        <Image source={LOGO} style={{ width: logoSize, height: logoSize }} resizeMode="contain" accessibilityIgnoresInvertColors />
      </Animated.View>
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

const styles = themed(() => StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  tagline: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md },
  word: { fontSize: fontSizes.lg, fontFamily: fonts.display, color: colors.ink, letterSpacing: 1 },
  wordAccent: { color: palette.orange },
}));
