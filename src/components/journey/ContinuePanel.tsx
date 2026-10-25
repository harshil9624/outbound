import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import type { Level } from '@/types';
import type { MapNode } from '@/game/journey/types';
import { StarIcon } from '@/components/icons';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { borderWidths, colors, fontWeights, palette, spacing, textStyles, themed } from '@/theme';
import { isChapterEnd } from '@/economy/rewards';
import { LevelThumbnail } from './LevelThumbnail';

const DIFFICULTY_LABEL: Record<Level['difficulty'], string> = { simple: 'Simple', easy: 'Easy', normal: 'Medium', hard: 'Hard', 'extra-hard': 'Extra Hard' };

interface ContinuePanelProps {
  node: MapNode | null;
  level: Level | null;
  /** Shown instead of Play when the selected tile is locked. */
  lockedNote: string | null;
  /** Everything available is finished. */
  allDone: boolean;
  /** Some levels aren't made yet, so "finished" means "more coming". */
  moreComing: boolean;
  onPlay: () => void;
}

/**
 * Fixed at the bottom of the Journey: the selected level (the current one by default) with a
 * board thumbnail, its stars, and one big Play button, so most visits are a single tap.
 */
export const ContinuePanel = memo(function ContinuePanel({ node, level, lockedNote, allDone, moreComing, onPlay }: ContinuePanelProps) {
  if (!node || !level) {
    return (
      <View style={styles.panel}>
        <View style={styles.info}>
          <Text style={styles.eyebrow}>{!allDone ? 'JOURNEY' : moreComing ? 'ALL CAUGHT UP' : 'ALL DONE'}</Text>
          <Text style={styles.title}>{!allDone ? 'Pick a level' : moreComing ? 'New levels soon' : 'You cleared everything!'}</Text>
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
              {DIFFICULTY_LABEL[level.difficulty]}
            </Text>
            {/* A chapter's last level holds its chest, paid on the first clear (economy/config CHAPTER_REWARD). */}
            {!done && isChapterEnd(level.id) ? <Text style={styles.reward}>· Bonus chest</Text> : null}
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
        style={styles.play}
        dimmed={locked}
        sound={locked ? null : 'tap'}
        accessibilityLabel={locked ? `Level ${level.id} is locked` : `${done ? 'Replay' : 'Play'} level ${level.id}`}
      />
    </View>
  );
});

const styles = themed(() => StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 92,
    backgroundColor: colors.paper,
    borderTopWidth: borderWidths.regular,
    borderTopColor: colors.ink,
  },
  thumb: { borderWidth: borderWidths.regular, borderColor: colors.ink },
  // Keeps room for "Level 12"; the button's label shrinks instead.
  info: { flex: 1, minWidth: 96, gap: 1 },
  play: { flexShrink: 1 },
  eyebrow: { ...textStyles.caption, letterSpacing: 1.2 },
  title: { fontSize: 20, fontWeight: fontWeights.heavy, color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  reward: { ...textStyles.caption, color: colors.ink, fontWeight: '900' },
  meta: { ...textStyles.caption, color: colors.inkMuted },
  stars: { flexDirection: 'row', gap: 1 },
}));
