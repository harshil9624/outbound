import { memo, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { playSound } from '@/audio/sounds';
import { Text } from '@/components/ui/Text';
import { CoinIcon, HeartIcon, HomeIcon, RestartIcon } from '@/components/icons';
import { BOOST_COSTS } from '@/constants/gameConfig';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { MAX_FONT_SCALE, borderWidths, colors, fontWeights, palette, spacing, textStyles, themed } from '@/theme';
import { MoodHeart } from './MoodHeart';

interface GameOverOverlayProps {
  coins: number;
  canBuyLife: boolean;
  reducedMotion: boolean;
  onBuyLife: () => void;
  onRetry: () => void;
  onHome: () => void;
}

/** Built once each: fresh icon elements would re-render the buttons for nothing. */
const HEART_ICON = <HeartIcon size={28} color={palette.white} />;
const RETRY_ICON = <RestartIcon size={20} />;
const HOME_ICON = <HomeIcon size={18} />;

/**
 * Out of hearts. A broken heart up top, one line of why, then the choices in order of how much
 * the player keeps: an extra heart (keep the board), try again, or go home.
 */
export const GameOverOverlay = memo(function GameOverOverlay({
  coins,
  canBuyLife,
  reducedMotion,
  onBuyLife,
  onRetry,
  onHome,
}: GameOverOverlayProps) {
  const cost = BOOST_COSTS.life;
  const short = Math.max(0, cost - coins);

  // Backdrop fades in, the card pops up from slightly small.
  const show = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    show.value = withSpring(1, { damping: 14, stiffness: 180 });
  }, [reducedMotion, show]);
  const backdropStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, show.value * 1.6) }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, show.value * 2),
    transform: [{ scale: 0.86 + 0.14 * show.value }, { translateY: (1 - show.value) * 24 }],
  }));

  // The broken heart drops in with a little wobble.
  const drop = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    drop.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.back(2.2)) });
  }, [reducedMotion, drop]);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - drop.value) * -26 }, { rotate: `${(1 - drop.value) * -14}deg` }],
  }));

  // Can't afford it: the price line shakes and goes "nope", right where the player is looking.
  const nope = useSharedValue(0);
  const priceStyle = useAnimatedStyle(() => ({ transform: [{ translateX: nope.value }] }));
  const buyLife = useCallback(() => {
    if (!canBuyLife) {
      playSound('blocked');
      if (!reducedMotion) {
        nope.value = withSequence(
          withTiming(8, { duration: 50 }),
          withTiming(-7, { duration: 60 }),
          withTiming(4, { duration: 60 }),
          withTiming(0, { duration: 60 }),
        );
      }
    }
    onBuyLife();
  }, [canBuyLife, reducedMotion, nope, onBuyLife]);

  return (
    <Animated.View style={[styles.backdrop, backdropStyle]} accessibilityViewIsModal>
      <Animated.View style={[styles.cardWrap, cardStyle]}>
        <BrutalistCard shadow="lg" corner="md" contentStyle={styles.face}>
          <View style={styles.band}>
            <Animated.View style={heartStyle}>
              <MoodHeart size={76} mood="broken" beatMs={0} reducedMotion={reducedMotion} />
            </Animated.View>
            <Text
              style={styles.title}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
              numberOfLines={1}
              adjustsFontSizeToFit
              accessibilityRole="header"
            >
              Out of hearts!
            </Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.why}>A blocked arrow breaks a heart. Want to keep going?</Text>

            <BrutalistButton
              icon={HEART_ICON}
              label="+1 HEART"
              onPress={buyLife}
              dimmed={!canBuyLife}
              color="success"
              size="lg"
              sound={null}
              style={styles.stretch}
              accessibilityLabel={`Add one heart for ${cost} coins`}
            />
            <Animated.View style={[styles.price, priceStyle]} accessibilityLabel={short > 0 ? `You need ${short} more coins` : `Costs ${cost} coins. You have ${coins}`}>
              {short > 0 ? (
                <>
                  <Text style={[styles.priceText, styles.priceShort]}>Need</Text>
                  <CoinIcon size={16} />
                  <Text style={[styles.priceText, styles.priceShort]}>{short} more coins</Text>
                </>
              ) : (
                <>
                  <Text style={styles.priceText}>costs</Text>
                  <CoinIcon size={16} />
                  <Text style={styles.priceStrong}>{cost}</Text>
                  <Text style={styles.priceText}>· you have</Text>
                  <CoinIcon size={16} />
                  <Text style={styles.priceStrong}>{coins}</Text>
                </>
              )}
            </Animated.View>

            <View style={styles.divider} />

            {/* Stacked, not side by side: two icon buttons in half a small phone squeezed their labels. */}
            <BrutalistButton label="TRY AGAIN" icon={RETRY_ICON} onPress={onRetry} color="primary" style={styles.stretch} />
            <BrutalistButton label="Home" icon={HOME_ICON} onPress={onHome} color="surface" size="sm" style={styles.home} />
          </View>
        </BrutalistCard>
      </Animated.View>
    </Animated.View>
  );
});

const styles = themed(() => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,17,17,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  cardWrap: { alignSelf: 'stretch', maxWidth: 420, width: '100%' },
  face: { padding: 0, overflow: 'hidden', backgroundColor: colors.surface },
  band: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.danger,
    borderBottomWidth: borderWidths.thick,
    borderBottomColor: colors.ink,
  },
  title: {
    ...textStyles.title,
    fontSize: 32,
    color: palette.white,
    textShadowColor: colors.artInk,
    textShadowOffset: { width: 3, height: 3 },
    // Android drops the shadow entirely at radius 0.
    textShadowRadius: 1,
  },
  body: { padding: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  why: { ...textStyles.body, textAlign: 'center', marginBottom: spacing.sm },
  stretch: { alignSelf: 'stretch' },
  price: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 4 },
  priceText: { ...textStyles.caption },
  priceStrong: { ...textStyles.caption, color: colors.ink, fontWeight: fontWeights.heavy },
  priceShort: { color: colors.danger, fontWeight: fontWeights.heavy },
  divider: {
    alignSelf: 'stretch',
    height: borderWidths.thin,
    backgroundColor: colors.ink,
    opacity: 0.15,
    marginVertical: spacing.sm,
  },
  home: { marginTop: spacing.xs },
}));
