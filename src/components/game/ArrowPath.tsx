import { memo, useEffect, useMemo } from 'react';
import { G, Path } from 'react-native-svg';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  makeMutable,
  runOnJS,
  useAnimatedProps,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { BoardArrow } from '@/types';
import type { BoardLayout } from '@/game/layout/boardLayout';
import { buildArrowRenderGeometry } from '@/game/layout/arrowGeometry';
import {
  BUMP_BACK_MS,
  BUMP_DISTANCE_CELLS,
  BUMP_OUT_MS,
  EXIT_MAX_MS,
  EXIT_MIN_MS,
  EXIT_REDUCED_MOTION_MS,
  EXIT_SPEED_PX_PER_S,
  FLASH_STEP_MS,
  HAMMER_IMPACT_MS,
  HINT_PULSE_MS,
  SMASH_MS,
} from '@/constants/animation';
import { arrowColors, colors } from '@/theme';
import { clamp } from '@/utils/math';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Per-arrow animation state, shared by the SVG body (ArrowPath) and the face overlay (ArrowFace),
 * which live in different view trees. Created with makeMutable so one registry can serve both.
 */
export interface ArrowMotion {
  /** px travelled along the exit direction (slide-out and blocked nudge). */
  travel: SharedValue<number>;
  /** Opacity multiplier for hint pulse and blocker flash. */
  pulse: SharedValue<number>;
  /** 0 → 1 while the hammer smashes the arrow. */
  smash: SharedValue<number>;
}

export function createArrowMotion(): ArrowMotion {
  return { travel: makeMutable(0), pulse: makeMutable(1), smash: makeMutable(0) };
}

export type ExitMode = 'slide' | 'smash';

interface ArrowPathProps {
  arrow: BoardArrow;
  layout: BoardLayout;
  motion: ArrowMotion;
  exiting: boolean;
  exitMode: ExitMode;
  hinted: boolean;
  /** Changes → nudge toward the blocker and spring back. 0 = idle. */
  bumpToken: number;
  /** Changes → flash (this arrow is the blocker). 0 = idle. */
  flashToken: number;
  reducedMotion: boolean;
  onExitComplete: (arrowId: string) => void;
}

/**
 * Draws one arrow's slim outlined body and owns its animations. `travel` drives the
 * snake slide (strokeDashoffset) and, in ArrowFace, the face translation, so both move together.
 */
function ArrowPathComponent({
  arrow,
  layout,
  motion,
  exiting,
  exitMode,
  hinted,
  bumpToken,
  flashToken,
  reducedMotion,
  onExitComplete,
}: ArrowPathProps) {
  const geo = useMemo(() => buildArrowRenderGeometry(arrow, layout), [arrow, layout]);
  const { travel, pulse, smash } = motion;
  const { exitDistance } = geo;

  // Exit: slide out along the path, or get smashed in place.
  useEffect(() => {
    if (!exiting) {
      travel.value = 0;
      smash.value = 0;
      return;
    }
    const id = arrow.id;
    if (exitMode === 'smash') {
      // Wait for the flying hammer (HammerStrike) to land before flattening.
      const hitAt = reducedMotion ? 0 : HAMMER_IMPACT_MS;
      const jolt = layout.cellSize * 0.08;
      travel.value = withDelay(
        hitAt,
        withSequence(
          withTiming(jolt, { duration: 40 }),
          withTiming(-jolt, { duration: 60 }),
          withTiming(0, { duration: 60 }),
        ),
      );
      smash.value = withDelay(
        hitAt,
        withTiming(1, { duration: reducedMotion ? EXIT_REDUCED_MOTION_MS : SMASH_MS }, (finished) => {
          if (finished) runOnJS(onExitComplete)(id);
        }),
      );
      return;
    }
    const duration = reducedMotion
      ? EXIT_REDUCED_MOTION_MS
      : clamp((exitDistance / EXIT_SPEED_PX_PER_S) * 1000, EXIT_MIN_MS, EXIT_MAX_MS);
    travel.value = withTiming(exitDistance, { duration, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onExitComplete)(id);
    });
  }, [exiting, exitMode, exitDistance, reducedMotion, arrow.id, layout.cellSize, onExitComplete, travel, smash]);

  // Blocked nudge
  useEffect(() => {
    if (bumpToken === 0 || exiting) return;
    const nudge = layout.cellSize * BUMP_DISTANCE_CELLS;
    travel.value = withSequence(
      withTiming(nudge, { duration: BUMP_OUT_MS, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: BUMP_BACK_MS, easing: Easing.out(Easing.back(2)) }),
    );
  }, [bumpToken, exiting, layout.cellSize, travel]);

  // Blocker flash
  useEffect(() => {
    if (flashToken === 0) return;
    pulse.value = withSequence(
      withTiming(0.3, { duration: FLASH_STEP_MS }),
      withTiming(1, { duration: FLASH_STEP_MS }),
      withTiming(0.3, { duration: FLASH_STEP_MS }),
      withTiming(1, { duration: FLASH_STEP_MS * 1.5 }),
    );
  }, [flashToken, pulse]);

  // Hint pulse
  useEffect(() => {
    if (hinted && !reducedMotion) {
      pulse.value = withRepeat(
        withSequence(withTiming(0.35, { duration: HINT_PULSE_MS }), withTiming(1, { duration: HINT_PULSE_MS })),
        -1,
      );
      return () => {
        cancelAnimation(pulse);
        pulse.value = 1;
      };
    }
    return undefined;
  }, [hinted, reducedMotion, pulse]);

  // One animatedProps per path: Reanimated binds each to a single view.
  const strokeProps = () => {
    'worklet';
    return {
      strokeDashoffset: -travel.value,
      opacity:
        interpolate(travel.value, [exitDistance * 0.55, exitDistance], [1, 0], Extrapolation.CLAMP) *
        pulse.value *
        (1 - smash.value),
    };
  };
  const shadowProps = useAnimatedProps(strokeProps);
  const outlineProps = useAnimatedProps(strokeProps);
  const bodyProps = useAnimatedProps(strokeProps);
  const highlightProps = useAnimatedProps(strokeProps);

  const fill = arrowColors[arrow.color];
  const common = {
    d: geo.pathD,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeDasharray: geo.dashArray,
  } as const;

  // Layers, bottom to top: hard shadow, ink outline, colour, glint.
  return (
    <G>
      <AnimatedPath {...common} d={geo.shadowD} stroke={colors.ink} strokeWidth={geo.outlineWidth} animatedProps={shadowProps} />
      <AnimatedPath {...common} stroke={colors.ink} strokeWidth={geo.outlineWidth} animatedProps={outlineProps} />
      <AnimatedPath {...common} stroke={fill} strokeWidth={geo.bodyWidth} animatedProps={bodyProps} />
      <AnimatedPath
        {...common}
        d={geo.highlightD}
        stroke="#FFFFFF"
        strokeOpacity={0.5}
        strokeWidth={geo.highlightWidth}
        animatedProps={highlightProps}
      />
    </G>
  );
}

export const ArrowPath = memo(ArrowPathComponent);
