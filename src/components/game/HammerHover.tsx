import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { HammerIcon } from '@/components/icons';
import { RAISED, hammerSize, hammerTransform } from './HammerStrike';
import { themed } from '@/theme';

const ENTER_MS = 480;
const BOB_MS = 520;

interface HammerHoverProps {
  /** Hover spot for the handle end, in the overlay's pixels. */
  x: number;
  y: number;
  /** Below the board, where it flies in from and back out to. */
  fromX: number;
  fromY: number;
  cellSize: number;
  /** false → fly back out (cancelled). */
  visible: boolean;
}

/**
 * Shown while the hammer is armed: flies up from the boost bar with a spin, then hovers
 * over the board bobbing and rocking, ready to strike. Flies back out when cancelled.
 */
export const HammerHover = memo(function HammerHover({ x, y, fromX, fromY, cellSize, visible }: HammerHoverProps) {
  const size = hammerSize(cellSize);
  const enter = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      enter.value = withTiming(1, { duration: ENTER_MS, easing: Easing.out(Easing.back(1.4)) });
      bob.value = withRepeat(
        withSequence(
          withTiming(1, { duration: BOB_MS, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: BOB_MS, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(bob);
      enter.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) });
    }
  }, [visible, enter, bob]);

  const style = useAnimatedStyle(() => {
    const p = enter.value;
    const px = fromX + (x - fromX) * p;
    const py = fromY + (y - fromY) * p - Math.sin(Math.PI * Math.min(1, p)) * size * 0.8 + bob.value * 6 * p;
    const angle = RAISED - 360 * (1 - Math.min(1, p)) + bob.value * 8 * p;
    return {
      opacity: Math.min(1, p * 2),
      transform: hammerTransform(px, py, angle, size, 0.6 + 0.4 * Math.min(1, p)),
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.hammer, { width: size, height: size }, style]}>
      <HammerIcon size={size} />
    </Animated.View>
  );
});

const styles = themed(() => StyleSheet.create({
  hammer: { position: 'absolute', left: 0, top: 0 },
}));
