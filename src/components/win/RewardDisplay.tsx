import { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent, type TextStyle } from 'react-native';
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
import type { RewardBreakdown } from '@/types';
import { playSound } from '@/audio/sounds';
import { CoinIcon } from '@/components/icons';
import { HardShadow, cornerStyles } from '@/components/ui/HardShadow';
import { surfaceStyles } from '@/components/ui/surfaceStyles';
import {
  WIN_COIN_FLIGHT_MS,
  WIN_COIN_FLY_DELAY_MS,
  WIN_COIN_STAGGER_MS,
  WIN_COUNT_UP_DELAY_MS,
  WIN_COUNT_UP_MS,
  WIN_FLYING_COINS,
} from '@/constants/animation';
import { borderWidths, colors, fontSizes, fontWeights, radii, spacing, textStyles, type SurfaceColor } from '@/theme';

interface RewardDisplayProps {
  reward: RewardBreakdown;
  totalCoins: number;
  /** Count up, fly coins into the balance, play sounds. */
  animate?: boolean;
}

const FLY_COIN = 26;

/** Eases from 0 to `target` once the stars have landed; jumps straight there when disabled. */
function useCountUp(target: number, enabled: boolean): number {
  const [value, setValue] = useState(enabled ? 0 : target);
  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now;
      const p = Math.min(1, (now - start) / WIN_COUNT_UP_MS);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => (frame = requestAnimationFrame(tick)), WIN_COUNT_UP_DELAY_MS);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, enabled]);
  return value;
}

/** Its own component so each count-up frame re-renders one Text, not the whole reward block. */
const CountUpText = memo(function CountUpText({ target, enabled, style }: { target: number; enabled: boolean; style: TextStyle }) {
  const value = useCountUp(target, enabled);
  return <Text style={style}>+{value}</Text>;
});

function SpinningCoin({ size, spin }: { size: number; spin: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (spin) t.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.linear }), -1);
  }, [spin, t]);
  // A coin flip seen edge-on: squash horizontally, never fully to zero.
  const style = useAnimatedStyle(() => {
    const c = Math.cos(t.value * Math.PI * 2);
    return { transform: [{ scaleX: Math.sign(c || 1) * Math.max(0.12, Math.abs(c)) }] };
  });
  return (
    <Animated.View style={style}>
      <CoinIcon size={size} />
    </Animated.View>
  );
}

function Chip({ label, value, color }: { label: string; value?: number; color: SurfaceColor }) {
  return (
    <View style={[styles.chip, surfaceStyles[color]]}>
      <Text style={styles.chipLabel}>{label}</Text>
      {value !== undefined ? <Text style={styles.chipValue}>+{value}</Text> : null}
    </View>
  );
}

function FlyingCoin({ index, fromY, toY }: { index: number; fromY: number; toY: number }) {
  const p = useSharedValue(0);
  const side = (index % 2 ? 1 : -1) * (24 + (index % 3) * 14);
  useEffect(() => {
    p.value = withDelay(
      WIN_COIN_FLY_DELAY_MS + index * WIN_COIN_STAGGER_MS,
      withTiming(1, { duration: WIN_COIN_FLIGHT_MS, easing: Easing.inOut(Easing.quad) }),
    );
  }, [index, p]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value > 0 && p.value < 1 ? 1 : 0,
    transform: [
      { translateX: Math.sin(p.value * Math.PI) * side },
      { translateY: fromY + (toY - fromY) * p.value - FLY_COIN / 2 },
      { scale: 1.15 - 0.35 * p.value },
    ],
  }));
  return (
    <Animated.View style={[styles.flyCoin, style]} pointerEvents="none">
      <CoinIcon size={FLY_COIN} />
    </Animated.View>
  );
}

/**
 * Big spinning-coin reward that counts up, a breakdown as colored chips, then coins
 * fly one by one into the balance pill, which ticks up and bumps with a "ching" each.
 */
export const RewardDisplay = memo(function RewardDisplay({ reward, totalCoins, animate = false }: RewardDisplayProps) {
  const before = totalCoins - reward.total;
  const coinCount = animate && reward.total > 0 ? WIN_FLYING_COINS : 0;
  const [balance, setBalance] = useState(coinCount ? before : totalCoins);
  const bump = useSharedValue(1);

  // Flight path: centre of the earned chip → centre of the balance pill (root coordinates).
  const ys = useRef({ from: 0, to: 0 });
  const [path, setPath] = useState<{ from: number; to: number } | null>(null);
  const onEarnedLayout = (e: LayoutChangeEvent) => {
    ys.current.from = e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2;
    if (ys.current.to) setPath({ ...ys.current });
  };
  const onBalanceLayout = (e: LayoutChangeEvent) => {
    ys.current.to = e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2;
    if (ys.current.from) setPath({ ...ys.current });
  };

  useEffect(() => {
    if (!coinCount) {
      setBalance(totalCoins);
      return;
    }
    const timers = Array.from({ length: coinCount }, (_, i) =>
      setTimeout(
        () => {
          setBalance(before + Math.round((reward.total * (i + 1)) / coinCount));
          bump.value = withSequence(withTiming(1.14, { duration: 70 }), withSpring(1, { damping: 8, stiffness: 260 }));
          playSound('coin');
        },
        WIN_COIN_FLY_DELAY_MS + i * WIN_COIN_STAGGER_MS + WIN_COIN_FLIGHT_MS,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [coinCount, before, reward.total, totalCoins, bump]);

  const bumpStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));

  return (
    <View style={styles.root}>
      <View onLayout={onEarnedLayout}>
        <HardShadow size="sm" corner="pill">
          <View style={[styles.earned, cornerStyles.pill]}>
            <SpinningCoin size={42} spin={animate} />
            <CountUpText target={reward.total} enabled={animate} style={styles.earnedText} />
          </View>
        </HardShadow>
      </View>

      <View style={styles.chips}>
        {reward.firstClearBonus > 0 ? (
          <>
            <Chip label="CLEAR" value={reward.base} color="info" />
            <Chip label="STARS" value={reward.starBonus} color="primary" />
            <Chip label="FIRST CLEAR" value={reward.firstClearBonus} color="success" />
          </>
        ) : (
          <Chip label="REPLAY REWARD" color="surface" />
        )}
      </View>

      <Animated.View style={[styles.balance, bumpStyle]} onLayout={onBalanceLayout}>
        <Text style={styles.balanceLabel}>BALANCE</Text>
        <CoinIcon size={22} />
        <Text style={styles.balanceValue}>{balance}</Text>
      </Animated.View>

      {path
        ? Array.from({ length: coinCount }, (_, i) => <FlyingCoin key={i} index={i} fromY={path.from} toY={path.to} />)
        : null}
    </View>
  );
});

const hardTextShadow = {
  textShadowColor: colors.ink,
  textShadowOffset: { width: 3, height: 3 },
  // Android drops the shadow entirely at radius 0.
  textShadowRadius: 1,
};

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', alignItems: 'center', gap: spacing.md },
  earned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xl,
    backgroundColor: colors.primary,
    borderWidth: borderWidths.thick,
    borderColor: colors.ink,
  },
  earnedText: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.heavy,
    color: colors.surface,
    fontVariant: ['tabular-nums'],
    ...hardTextShadow,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    borderWidth: borderWidths.thin,
    borderColor: colors.ink,
  },
  chipLabel: { ...textStyles.caption, color: colors.ink, fontWeight: fontWeights.heavy },
  chipValue: { ...textStyles.caption, color: colors.ink, fontWeight: fontWeights.heavy },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
  },
  balanceLabel: { ...textStyles.caption, color: colors.disabled, letterSpacing: 1 },
  balanceValue: { ...textStyles.number, color: colors.surface },
  flyCoin: { position: 'absolute', top: 0, left: '50%', marginLeft: -FLY_COIN / 2 },
});
