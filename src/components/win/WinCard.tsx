import { useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import type { StarCount } from '@/types';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { WIN_CARD_DROP_DELAY_MS, WIN_RIBBON_DELAY_MS, WIN_TITLE_STAMP_DELAY_MS } from '@/constants/animation';
import { borderWidths, colors, fontWeights, radii, spacing, textStyles } from '@/theme';

const PRAISE: Record<StarCount, string> = { 3: 'PERFECT!', 2: 'GREAT!', 1: 'NICE!' };

const STRIPE_GAP = 26;
/** Diagonal comic stripes for the header band; wider than any phone, clipped by the band. */
const STRIPES_D = Array.from({ length: 34 }, (_, i) => `M${i * STRIPE_GAP - 120} 140 L${i * STRIPE_GAP} 0`).join(' ');

interface WinCardProps {
  levelId: number;
  stars: StarCount;
  reducedMotion: boolean;
  children: ReactNode;
}

/**
 * White card with a striped pink header. It drops in with a wobble, "YOU WIN"
 * stamps down, and a praise ribbon pops onto the corner.
 */
export function WinCard({ levelId, stars, reducedMotion, children }: WinCardProps) {
  const drop = useSharedValue(reducedMotion ? 1 : 0);
  const stamp = useSharedValue(reducedMotion ? 1 : 0);
  const ribbon = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    drop.value = withDelay(WIN_CARD_DROP_DELAY_MS, withSpring(1, { damping: 11, stiffness: 120 }));
    stamp.value = withDelay(WIN_TITLE_STAMP_DELAY_MS, withSpring(1, { damping: 10, stiffness: 220 }));
    ribbon.value = withDelay(WIN_RIBBON_DELAY_MS, withSpring(1, { damping: 7, stiffness: 200 }));
  }, [reducedMotion, drop, stamp, ribbon]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, drop.value * 3),
    transform: [{ translateY: (1 - drop.value) * -500 }, { rotate: `${-1 - (1 - drop.value) * 14}deg` }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, stamp.value * 2),
    transform: [{ scale: 2.6 - 1.6 * stamp.value }, { rotate: `${(1 - stamp.value) * -10}deg` }],
  }));

  const ribbonStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, ribbon.value * 2),
    transform: [{ scale: ribbon.value }, { rotate: '10deg' }],
  }));

  return (
    <Animated.View style={[styles.wrap, cardStyle]}>
      <BrutalistCard shadow="lg" corner="md" contentStyle={styles.face}>
        <View style={styles.band}>
          <Svg style={StyleSheet.absoluteFill} width={900} height={140}>
            <Path d={STRIPES_D} stroke={colors.surface} strokeWidth={9} opacity={0.18} />
          </Svg>
          <Animated.Text style={[styles.title, titleStyle]}>YOU WIN!</Animated.Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>LEVEL {levelId} CLEARED</Text>
        </View>
        <View style={styles.body}>{children}</View>
      </BrutalistCard>
      <Animated.View style={[styles.ribbon, ribbonStyle]}>
        <BrutalistCard color={stars === 3 ? 'primary' : 'info'} shadow="sm" corner="sm" contentStyle={styles.ribbonFace}>
          <Text style={styles.ribbonText}>{PRAISE[stars]}</Text>
        </BrutalistCard>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  face: { padding: 0, overflow: 'hidden', backgroundColor: colors.surface },
  band: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.accent,
    borderBottomWidth: borderWidths.thick,
    borderBottomColor: colors.ink,
    overflow: 'hidden',
  },
  title: {
    ...textStyles.display,
    fontSize: 50,
    color: colors.surface,
    textShadowColor: colors.ink,
    textShadowOffset: { width: 4, height: 4 },
    // Android drops the shadow entirely at radius 0.
    textShadowRadius: 1,
  },
  tag: {
    alignSelf: 'center',
    marginTop: -16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    borderWidth: borderWidths.thin,
    borderColor: colors.surface,
  },
  tagText: { ...textStyles.label, color: colors.surface, letterSpacing: 1.5 },
  body: { alignItems: 'center', gap: spacing.lg, padding: spacing.lg, paddingTop: spacing.md },
  ribbon: { position: 'absolute', top: -spacing.md, right: -spacing.sm },
  ribbonFace: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  ribbonText: { ...textStyles.subheading, fontWeight: fontWeights.heavy, letterSpacing: 0.5 },
});
