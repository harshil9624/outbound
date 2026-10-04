import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Level } from '@/types';
import type { MapNode } from '@/game/journey/types';
import { StarIcon } from '@/components/icons';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { borderWidths, colors, fontWeights, palette, spacing, textStyles } from '@/theme';
import { LevelThumbnail } from './LevelThumbnail';

const DIFFICULTY_LABEL: Record<Level['difficulty'], string> = { easy: 'Easy', normal: 'Medium', hard: 'Hard' };

interface ContinuePanelProps {
  node: MapNode | null;
  level: Level | null;
  /** Shown instead of Play when the selected tile is locked. */
  lockedNote: string | null;
  /** Everything available is finished. */
  allDone: boolean;
  onPlay: () => void;
}

/**
 * Fixed at the bottom of the Journey: the selected level (the current one by default) with a
 * board thumbnail, its stars, and one big Play button, so most visits are a single tap.
 */
export const ContinuePanel = memo(function ContinuePanel({ node, level, lockedNote, allDone, onPlay }: ContinuePanelProps) {
  if (!node || !level) {
    return (
      <View style={styles.panel}>
        <View style={styles.info}>
          <Text style={styles.eyebrow}>{allDone ? 'ALL CAUGHT UP' : 'JOURNEY'}</Text>
          <Text style={styles.title}>{allDone ? 'New levels soon' : 'Pick a level'}</Text>
        </View>
      </View>
    );
  }
  const locked = node.state === 'locked';
  const done = node.state === 'completed' || node.state === 'perfect';
  const eyebrow = locked ? 'LOCKED' : done ? 'REPLAY' : node.kind === 'master' ? 'MASTER LEVEL' : node.kind === 'challenge' ? 'CHALLENGE' : 'CONTINUE';
  return (
    <View style={styles.panel}>
      <View style={styles.thumb}>
        <LevelThumbnail level={level} size={60} locked={locked} />
      </View>
      <View style={styles.info}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>Level {level.id}</Text>
        {locked && lockedNote ? (
          <Text style={styles.meta}>{lockedNote}</Text>
        ) : (
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {level.arrows.length} arrows · {DIFFICULTY_LABEL[level.difficulty]}
            </Text>
            {done ? (
              <View style={styles.stars}>
                {[1, 2, 3].map((i) => (
                  <StarIcon key={i} size={13} color={i <= node.stars ? palette.yellow : colors.surface} />
                ))}
              </View>
            ) : null}
          </View>
        )}
      </View>
      <BrutalistButton
        label={done ? 'REPLAY' : 'PLAY'}
        onPress={onPlay}
        color="success"
        size="md"
        dimmed={locked}
        accessibilityLabel={locked ? `Level ${level.id} is locked` : `${done ? 'Replay' : 'Play'} level ${level.id}`}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 92,
    backgroundColor: palette.cream,
    borderTopWidth: borderWidths.regular,
    borderTopColor: colors.ink,
  },
  thumb: { borderWidth: borderWidths.regular, borderColor: colors.ink },
  info: { flex: 1, minWidth: 0, gap: 1 },
  eyebrow: { ...textStyles.caption, letterSpacing: 1.2 },
  title: { fontSize: 20, fontWeight: fontWeights.heavy, color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  meta: { ...textStyles.caption, color: colors.inkMuted },
  stars: { flexDirection: 'row', gap: 1 },
});
