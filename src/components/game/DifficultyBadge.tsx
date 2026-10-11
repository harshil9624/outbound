import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { OnColor, Text } from '@/components/ui/Text';
import type { Difficulty } from '@/types';
import { borderWidths, colors, palette, spacing, textStyles, themed } from '@/theme';

const LABELS: Record<Difficulty, string> = { simple: 'Simple', easy: 'Easy', normal: 'Medium', hard: 'Hard', 'extra-hard': 'Extra Hard' };

export const DifficultyBadge = memo(function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <View style={[styles.badge, badgeColors[difficulty]]}>
      <OnColor>
        <Text style={styles.text}>{LABELS[difficulty]}</Text>
      </OnColor>
    </View>
  );
});

const styles = themed(() => StyleSheet.create({
  badge: {
    borderWidth: borderWidths.thin,
    borderColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  text: { ...textStyles.caption, color: colors.ink },
}));

const badgeColors = themed(() => StyleSheet.create({
  // A fixed light chip (not the card colour, which turns dark in dark mode): its dark text always reads.
  simple: { backgroundColor: palette.paper },
  easy: { backgroundColor: colors.success },
  normal: { backgroundColor: colors.info },
  hard: { backgroundColor: colors.accent },
  'extra-hard': { backgroundColor: colors.danger },
}));
