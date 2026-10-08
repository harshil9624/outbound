import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { OnColor, Text } from '@/components/ui/Text';
import type { Difficulty } from '@/types';
import { borderWidths, colors, spacing, textStyles, themed } from '@/theme';

const LABELS: Record<Difficulty, string> = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

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
  easy: { backgroundColor: colors.success },
  normal: { backgroundColor: colors.info },
  hard: { backgroundColor: colors.accent },
}));
