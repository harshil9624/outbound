import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Difficulty } from '@/types';
import { borderWidths, colors, spacing, textStyles } from '@/theme';

const LABELS: Record<Difficulty, string> = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

export const DifficultyBadge = memo(function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <View style={[styles.badge, badgeColors[difficulty]]}>
      <Text style={styles.text}>{LABELS[difficulty]}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    borderWidth: borderWidths.thin,
    borderColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  text: { ...textStyles.caption, color: colors.ink },
});

const badgeColors = StyleSheet.create({
  easy: { backgroundColor: colors.success },
  normal: { backgroundColor: colors.info },
  hard: { backgroundColor: colors.accent },
});
