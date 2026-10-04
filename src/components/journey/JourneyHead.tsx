import { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Point } from '@/types';
import type { Animal } from '@/constants/animals';
import { AnimalFace } from '@/components/game/AnimalFace';
import { arrivalDirection, pointAlong, polylineLengthPx } from '@/game/journey/mapGeometry';

/** Face box size; the face itself is a third of this across (≈ 40 dp). */
const BOX = 62;
/** How far before the tile the head waits, along the route (dp). */
export const HEAD_GAP = 50;
const MOVE_MS = 600;

interface JourneyHeadProps {
  animal: Animal;
  color: string;
  /** Route leading up to where the head rests (zone pixels), ending at the rest point. */
  path: Point[];
  /** Slide along the whole path (the player just moved on); otherwise appear at the end. */
  travel: boolean;
  delayMs: number;
  reducedMotion: boolean;
}

/**
 * The player's position: the chapter mascot as an arrowhead, resting on the route just before
 * the current tile and looking at it. When the player moves on it slides along the route.
 */
export const JourneyHead = memo(function JourneyHead({ animal, color, path, travel, delayMs, reducedMotion }: JourneyHeadProps) {
  const xs = useMemo(() => path.map((p) => p.x), [path]);
  const ys = useMemo(() => path.map((p) => p.y), [path]);
  const length = useMemo(() => polylineLengthPx(path), [path]);
  const dir = useMemo(() => arrivalDirection(path), [path]);

  const along = useSharedValue(travel && !reducedMotion ? 0 : length);
  const appear = useSharedValue(travel || reducedMotion ? 1 : 0);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      along.value = length;
      appear.value = 1;
      return;
    }
    if (travel) {
      along.value = 0;
      along.value = withDelay(delayMs, withTiming(length, { duration: MOVE_MS, easing: Easing.inOut(Easing.cubic) }));
    } else {
      along.value = length;
      appear.value = withDelay(delayMs, withSpring(1, { damping: 9, stiffness: 180 }));
    }
    bob.value = withDelay(
      delayMs + MOVE_MS,
      withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0, { duration: 700 })), -1),
    );
  }, [travel, delayMs, length, reducedMotion, along, appear, bob]);

  const style = useAnimatedStyle(() => {
    const p = pointAlong(xs, ys, along.value);
    return {
      opacity: Math.min(1, appear.value * 2),
      transform: [
        { translateX: p.x - BOX / 2 },
        { translateY: p.y - BOX / 2 - bob.value * 3 },
        { scale: 0.4 + appear.value * 0.6 },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.head, style]}>
      <AnimalFace animal={animal} color={color} dir={dir} mood="happy" size={BOX} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  head: { position: 'absolute', left: 0, top: 0, width: BOX, height: BOX },
});
