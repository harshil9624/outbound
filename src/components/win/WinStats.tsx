import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { OnColor, Text } from '@/components/ui/Text';
import { WIN_STATS_DELAY_MS } from '@/constants/animation';
import { borderWidths, colors, fontWeights, spacing, textStyles, themed } from '@/theme';

interface WinStatsProps {
  moves: number;
  mistakes: number;
  hintsUsed: number;
  hammersUsed: number;
  reducedMotion: boolean;
}

/**
 * How the level went, as three tiles. A clean result (no mistakes, no help) lights up green with
 * its own badge word, so a flawless clear reads at a glance. Hints and hammers both cost a star,
 * so both count as HELP: the tiles can never claim "SOLO" on a clear that lost a star to a boost.
 */
export const WinStats = memo(function WinStats(props: WinStatsProps) {
  const { reducedMotion } = props;
  // Never show NaN: a missing or bad count reads as 0 (e.g. a result from before a field existed).
  const moves = count(props.moves);
  const mistakes = count(props.mistakes);
  const help = count(props.hintsUsed) + count(props.hammersUsed);
  const show = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (!reducedMotion) show.value = withDelay(WIN_STATS_DELAY_MS, withSpring(1, { damping: 13, stiffness: 160 }));
  }, [reducedMotion, show]);
  // One animated style for the whole strip: cheap next to the stars and the count-up.
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, show.value * 1.5),
    transform: [{ translateY: (1 - show.value) * 14 }],
  }));

  return (
    <Animated.View style={[styles.row, style]}>
      <Stat value={String(moves)} label="MOVES" />
      <Stat value={String(mistakes)} label="MISTAKES" clean={mistakes === 0} cleanLabel="FLAWLESS" />
      <Stat value={String(help)} label="HELP USED" clean={help === 0} cleanLabel="SOLO" />
    </Animated.View>
  );
});

function count(v: number | undefined): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function Stat({ value, label, clean = false, cleanLabel }: { value: string; label: string; clean?: boolean; cleanLabel?: string }) {
  return (
    <View style={[styles.tile, clean && styles.tileClean]} accessibilityLabel={`${label.toLowerCase()} ${value}`}>
      <OnColor value={clean}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {clean && cleanLabel ? cleanLabel : label}
        </Text>
      </OnColor>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  row: { flexDirection: 'row', alignSelf: 'stretch', gap: spacing.sm },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
  },
  tileClean: { backgroundColor: colors.success },
  value: { fontSize: 22, lineHeight: 26, fontWeight: fontWeights.heavy, color: colors.ink, fontVariant: ['tabular-nums'] },
  label: { ...textStyles.caption, fontSize: 10, color: colors.inkMuted, fontWeight: fontWeights.heavy, letterSpacing: 1 },
}));
