import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlameIcon } from '@/components/icons';
import { colors, spacing, textStyles } from '@/theme';
import { BrutalistCard } from './BrutalistCard';

interface StreakWidgetProps {
  count: number;
  best: number;
}

export const StreakWidget = memo(function StreakWidget({ count, best }: StreakWidgetProps) {
  return (
    <BrutalistCard color="accent" style={styles.card} contentStyle={styles.face}>
      <View style={styles.row}>
        <FlameIcon size={30} color={colors.primary} />
        <Text style={textStyles.title}>{count}</Text>
      </View>
      <Text style={textStyles.label}>{count === 1 ? 'DAY STREAK' : 'DAYS STREAK'}</Text>
      <Text style={styles.best}>Best: {best}</Text>
    </BrutalistCard>
  );
});

const styles = StyleSheet.create({
  card: { flex: 1, transform: [{ rotate: '-1.5deg' }] },
  face: { minHeight: 132, justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  best: { ...textStyles.caption, color: colors.ink },
});
