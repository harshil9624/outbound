import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { CHAPTERS } from '@/game/journey/chapters';
import { chapterOfLevel } from '@/game/journey/progress';
import { levelProvider } from '@/game/levels/levelProvider';
import { arrowColors, borderWidths, colors, fontWeights, spacing, textStyles, themed } from '@/theme';

interface WinInfoProps {
  levelId: number;
  moves: number;
  mistakes: number;
  /** Hints + hammers. */
  help: number;
  /** Levels the player has cleared, including this one. */
  completedLevels: number[];
}

/**
 * The details under the reward: how the level went (moves, mistakes, help used), and how far the
 * player is through this chapter. Zero mistakes or zero help is shown in green: that's what earns stars.
 */
export const WinInfo = memo(function WinInfo({ levelId, moves, mistakes, help, completedLevels }: WinInfoProps) {
  const chapter = chapterOfLevel(levelId);
  const total = chapter ? chapter.levelIds.filter((id) => levelProvider.hasLevel(id)).length : 0;
  const done = chapter ? chapter.levelIds.filter((id) => completedLevels.includes(id)).length : 0;
  const color = chapter ? arrowColors[chapter.color] : colors.primary;
  const number = chapter ? CHAPTERS.indexOf(chapter) + 1 : 0;

  return (
    <View style={styles.root}>
      <View style={styles.stats}>
        <Stat label="MOVES" value={moves} />
        <Stat label="MISTAKES" value={mistakes} good={mistakes === 0} />
        <Stat label="HELP" value={help} good={help === 0} />
      </View>
      {chapter ? (
        <View style={styles.chapter} accessible accessibilityLabel={`Chapter ${number}, ${chapter.title}: ${done} of ${total} levels done`}>
          <View style={styles.chapterHead}>
            <Text style={styles.chapterTitle} numberOfLines={1}>
              CHAPTER {number} · {chapter.title}
            </Text>
            <Text style={styles.chapterCount}>
              {done}/{total}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(done / Math.max(1, total)) * 100}%`, backgroundColor: color }]} />
          </View>
        </View>
      ) : null}
    </View>
  );
});

function Stat({ label, value, good = false }: { label: string; value: number; good?: boolean }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label.toLowerCase()}: ${value}`}>
      <Text style={[styles.statValue, good && styles.statGood]}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {label}
      </Text>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    root: { alignSelf: 'stretch', gap: spacing.md },
    stats: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
    stat: { alignItems: 'center', minWidth: 64, flexShrink: 1 },
    statValue: { fontSize: 24, fontWeight: fontWeights.heavy, color: colors.ink, fontVariant: ['tabular-nums'] },
    statGood: { color: colors.success },
    statLabel: { ...textStyles.caption, color: colors.inkMuted, letterSpacing: 1 },
    chapter: { gap: spacing.xs },
    chapterHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    chapterTitle: { ...textStyles.label, flexShrink: 1 },
    chapterCount: { ...textStyles.label, fontVariant: ['tabular-nums'] },
    track: { height: 12, borderWidth: borderWidths.thin, borderColor: colors.ink, backgroundColor: colors.paper },
    fill: { height: '100%' },
  }),
);
