import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import type { StarCount } from '@/types';
import type { FaceAnimal } from '@/constants/animals';
import { AnimalFace } from '@/components/game/AnimalFace';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { WIN_AVATAR_DELAY_MS, WIN_CARD_DROP_DELAY_MS, WIN_RIBBON_DELAY_MS, WIN_TITLE_STAMP_DELAY_MS } from '@/constants/animation';
import { MAX_FONT_SCALE, borderWidths, colors, fontWeights, palette, radii, spacing, textStyles, themed } from '@/theme';

const PRAISE: Record<StarCount, string> = { 3: 'PERFECT!', 2: 'GREAT!', 1: 'NICE!' };

const STRIPE_GAP = 26;
const AVATAR = 64;
/** Diagonal comic stripes for the header band; wider than any phone, clipped by the band. */
const STRIPES_D = Array.from({ length: 34 }, (_, i) => `M${i * STRIPE_GAP - 120} 140 L${i * STRIPE_GAP} 0`).join(' ');

interface WinCardProps {
  levelId: number;
  stars: StarCount;
  /** The chapter's wild mascot, cheering from the card's corner, in the chapter colour. */
  mascot: { animal: FaceAnimal; color: string };
  reducedMotion: boolean;
  children: ReactNode;
}

/**
 * White card with a striped pink header. It drops in with a wobble, "YOU WIN"
 * stamps down, the chapter's mascot pops up on one corner and a praise ribbon on the other.
 */
export function WinCard({ levelId, stars, mascot, reducedMotion, children }: WinCardProps) {
  const drop = useSharedValue(reducedMotion ? 1 : 0);
  const stamp = useSharedValue(reducedMotion ? 1 : 0);
  const ribbon = useSharedValue(reducedMotion ? 1 : 0);
  const pop = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    drop.value = withDelay(WIN_CARD_DROP_DELAY_MS, withSpring(1, { damping: 11, stiffness: 120 }));
    stamp.value = withDelay(WIN_TITLE_STAMP_DELAY_MS, withSpring(1, { damping: 10, stiffness: 220 }));
    ribbon.value = withDelay(WIN_RIBBON_DELAY_MS, withSpring(1, { damping: 7, stiffness: 200 }));
    pop.value = withDelay(WIN_AVATAR_DELAY_MS, withSpring(1, { damping: 6, stiffness: 180 }));
  }, [reducedMotion, drop, stamp, ribbon, pop]);

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

  // Springs up from behind the card edge; the low damping gives it a happy bounce.
  const avatarStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 3),
    transform: [{ translateY: (1 - pop.value) * 40 }, { scale: 0.4 + 0.6 * pop.value }, { rotate: '-8deg' }],
  }));

  return (
    <Animated.View style={[styles.wrap, cardStyle]}>
      <BrutalistCard shadow="lg" corner="md" contentStyle={styles.face}>
        <View style={styles.band}>
          <Svg style={StyleSheet.absoluteFill} width={900} height={140}>
            <Path d={STRIPES_D} stroke={palette.white} strokeWidth={9} opacity={0.18} />
          </Svg>
          <Animated.Text
            style={[styles.title, titleStyle]}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityRole="header"
          >
            YOU WIN!
          </Animated.Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText} numberOfLines={1} adjustsFontSizeToFit>
            LEVEL {levelId} CLEARED
          </Text>
        </View>
        <View style={styles.body}>{children}</View>
      </BrutalistCard>
      <Animated.View style={[styles.avatar, avatarStyle]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.avatarShadow} />
        <View style={styles.avatarFace}>
          <AnimalFace animal={mascot.animal} color={mascot.color} dir={{ x: 0, y: -1 }} mood="happy" size={66} />
        </View>
      </Animated.View>
      <Animated.View style={[styles.ribbon, ribbonStyle]}>
        <BrutalistCard color={stars === 3 ? 'primary' : 'info'} shadow="sm" corner="sm" contentStyle={styles.ribbonFace}>
          <Text style={styles.ribbonText}>{PRAISE[stars]}</Text>
        </BrutalistCard>
      </Animated.View>
    </Animated.View>
  );
}

const styles = themed(() => StyleSheet.create({
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
    color: palette.white,
    textShadowColor: colors.artInk,
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
  body: { alignItems: 'center', gap: spacing.md, padding: spacing.lg, paddingTop: spacing.md },
  avatar: { position: 'absolute', top: -AVATAR / 2, left: -spacing.xs, width: AVATAR, height: AVATAR },
  avatarShadow: { ...StyleSheet.absoluteFillObject, top: 4, left: 4, right: -4, bottom: -4, borderRadius: AVATAR / 2, backgroundColor: colors.shadow },
  avatarFace: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: borderWidths.thick,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ribbon: { position: 'absolute', top: -spacing.md, right: -spacing.sm },
  ribbonFace: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  ribbonText: { ...textStyles.subheading, fontWeight: fontWeights.heavy, letterSpacing: 0.5 },
}));
