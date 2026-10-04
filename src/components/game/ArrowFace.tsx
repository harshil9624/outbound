import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { BoardArrow } from '@/types';
import type { BoardLayout } from '@/game/layout/boardLayout';
import { buildArrowRenderGeometry } from '@/game/layout/arrowGeometry';
import { HINT_PULSE_MS, OUCH_MS } from '@/constants/animation';
import { ARROW_FACE_BOX } from '@/constants/board';
import { arrowColors, colors } from '@/theme';
import { AnimalFace, type Animal, type FaceMood } from './AnimalFace';
import type { ArrowMotion } from './ArrowPath';

interface ArrowFaceProps {
  arrow: BoardArrow;
  layout: BoardLayout;
  motion: ArrowMotion;
  animal: Animal;
  /** Hammer armed: every arrow looks nervous. */
  scared: boolean;
  /** Changes → "ouch" face for a moment (this arrow just bumped into a blocker). 0 = idle. */
  bumpToken: number;
  smashing: boolean;
  /** Hint target: the face hops inside a glowing ring. */
  hinted: boolean;
  reducedMotion: boolean;
}

/**
 * The animal face at an arrow's head. Rendered over the SVG board as a normal view and
 * driven by the same shared values as the body, so it rides along the exit slide,
 * hops in a glowing ring when hinted, and gets flattened when the hammer (HammerStrike) lands.
 */
export const ArrowFace = memo(function ArrowFace({
  arrow,
  layout,
  motion,
  animal,
  scared,
  bumpToken,
  smashing,
  hinted,
  reducedMotion,
}: ArrowFaceProps) {
  const geo = useMemo(() => buildArrowRenderGeometry(arrow, layout), [arrow, layout]);
  const { travel, pulse, smash } = motion;
  const { exitDistance, dir } = geo;
  const size = layout.cellSize * ARROW_FACE_BOX;

  const [ouch, setOuch] = useState(false);
  useEffect(() => {
    if (bumpToken === 0) return;
    setOuch(true);
    const t = setTimeout(() => setOuch(false), OUCH_MS);
    return () => clearTimeout(t);
  }, [bumpToken]);

  const mood: FaceMood = ouch || smashing ? 'ouch' : scared ? 'scared' : 'happy';

  const hop = useSharedValue(0);
  useEffect(() => {
    if (!hinted) {
      cancelAnimation(hop);
      hop.value = withTiming(0, { duration: 120 });
      return;
    }
    hop.value = reducedMotion
      ? 1
      : withRepeat(withSequence(withTiming(1, { duration: HINT_PULSE_MS }), withTiming(0.2, { duration: HINT_PULSE_MS })), -1);
  }, [hinted, reducedMotion, hop]);

  const faceStyle = useAnimatedStyle(() => {
    const s = smash.value;
    const squash = Math.min(1, s * 3);
    return {
      opacity:
        interpolate(travel.value, [exitDistance * 0.55, exitDistance], [1, 0], Extrapolation.CLAMP) *
        pulse.value *
        (s > 0.55 ? 1 - (s - 0.55) / 0.45 : 1),
      transform: [
        { translateX: dir.x * travel.value },
        { translateY: dir.y * travel.value + squash * size * 0.12 - hop.value * size * 0.08 },
        { scaleX: (1 + squash * 0.35) * (1 + hop.value * 0.15) },
        { scaleY: (1 - squash * 0.55) * (1 + hop.value * 0.15) },
      ],
    };
  });

  const ringStyle = useAnimatedStyle(() => ({
    opacity: hop.value,
    transform: [{ translateX: dir.x * travel.value }, { translateY: dir.y * travel.value }, { scale: 0.9 + hop.value * 0.25 }],
  }));

  const box = { left: geo.head.x - size / 2, top: geo.head.y - size / 2, width: size, height: size };

  return (
    <>
      {hinted ? <Animated.View pointerEvents="none" style={[styles.abs, styles.ring, box, { borderRadius: size / 2 }, ringStyle]} /> : null}
      <Animated.View pointerEvents="none" style={[styles.abs, box, faceStyle]}>
        <AnimalFace animal={animal} color={arrowColors[arrow.color]} dir={dir} mood={mood} size={size} />
      </Animated.View>
    </>
  );
});

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  ring: { borderWidth: 4, borderColor: colors.accent, backgroundColor: 'rgba(255,79,163,0.15)' },
});
