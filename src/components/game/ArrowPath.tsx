import { memo, useEffect, useMemo } from 'react';
import { G, Path } from 'react-native-svg';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { BoardArrow } from '@/types';
import type { BoardLayout } from '@/game/layout/boardLayout';
import { arrowheadPathD, buildArrowRenderGeometry } from '@/game/layout/arrowGeometry';
import {
  BUMP_BACK_MS,
  BUMP_DISTANCE_CELLS,
  BUMP_OUT_MS,
  EXIT_MAX_MS,
  EXIT_MIN_MS,
  EXIT_REDUCED_MOTION_MS,
  EXIT_SPEED_PX_PER_S,
  FLASH_STEP_MS,
  HINT_PULSE_MS,
} from '@/constants/animation';
import { arrowColors, colors } from '@/theme';
import { clamp } from '@/utils/math';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface ArrowPathProps {
  arrow: BoardArrow;
  layout: BoardLayout;
  exiting: boolean;
  hinted: boolean;
  /** Changes → nudge toward the blocker and spring back. 0 = idle. */
  bumpToken: number;
  /** Changes → flash (this arrow is the blocker). 0 = idle. */
  flashToken: number;
  reducedMotion: boolean;
  onExitComplete: (arrowId: string) => void;
}

/**
 * Renders one arrow and owns its animation. A single shared value, `travel` (px),
 * drives both the snake-slide body (strokeDashoffset) and the head translation,
 * so the exit and the blocked "bump" use the same physically consistent motion.
 */
function ArrowPathComponent({
  arrow,
  layout,
  exiting,
  hinted,
  bumpToken,
  flashToken,
  reducedMotion,
  onExitComplete,
}: ArrowPathProps) {
  const geo = useMemo(() => buildArrowRenderGeometry(arrow, layout), [arrow, layout]);
  const travel = useSharedValue(0);
  const pulse = useSharedValue(1);

  const { exitDistance, headSize } = geo;
  const hx = geo.head.x;
  const hy = geo.head.y;
  const dx = geo.dir.x;
  const dy = geo.dir.y;

  // Exit
  useEffect(() => {
    if (!exiting) {
      travel.value = 0;
      return;
    }
    const duration = reducedMotion
      ? EXIT_REDUCED_MOTION_MS
      : clamp((exitDistance / EXIT_SPEED_PX_PER_S) * 1000, EXIT_MIN_MS, EXIT_MAX_MS);
    const id = arrow.id;
    travel.value = withTiming(exitDistance, { duration, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onExitComplete)(id);
    });
  }, [exiting, exitDistance, reducedMotion, arrow.id, onExitComplete, travel]);

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

  const outlineProps = useAnimatedProps(() => ({
    strokeDashoffset: -travel.value,
    opacity: interpolate(travel.value, [exitDistance * 0.55, exitDistance], [1, 0], Extrapolation.CLAMP) * pulse.value,
  }));

  const bodyProps = useAnimatedProps(() => ({
    strokeDashoffset: -travel.value,
    opacity: interpolate(travel.value, [exitDistance * 0.55, exitDistance], [1, 0], Extrapolation.CLAMP) * pulse.value,
  }));

  const headProps = useAnimatedProps(() => {
    const t = travel.value;
    return {
      d: arrowheadPathD(hx + dx * t, hy + dy * t, dx, dy, headSize),
      opacity: interpolate(t, [exitDistance * 0.55, exitDistance], [1, 0], Extrapolation.CLAMP) * pulse.value,
    };
  });

  const fill = arrowColors[arrow.color];

  return (
    <G>
      <AnimatedPath
        d={geo.pathD}
        fill="none"
        stroke={colors.ink}
        strokeWidth={geo.outlineWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={geo.dashArray}
        animatedProps={outlineProps}
      />
      <AnimatedPath
        d={geo.pathD}
        fill="none"
        stroke={fill}
        strokeWidth={geo.bodyWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={geo.dashArray}
        animatedProps={bodyProps}
      />
      <AnimatedPath
        d={geo.initialHeadD}
        fill={fill}
        stroke={colors.ink}
        strokeWidth={geo.borderWidth}
        strokeLinejoin="round"
        animatedProps={headProps}
      />
    </G>
  );
}

export const ArrowPath = memo(ArrowPathComponent);
