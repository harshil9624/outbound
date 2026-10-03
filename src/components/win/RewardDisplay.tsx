import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RewardBreakdown } from '@/types';
import { CoinIcon } from '@/components/icons';
import { borderWidths, colors, spacing, textStyles } from '@/theme';

interface RewardDisplayProps {
  reward: RewardBreakdown;
  totalCoins: number;
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <Text style={textStyles.body}>{label}</Text>
      <Text style={textStyles.label}>+{value}</Text>
    </View>
  );
}

export const RewardDisplay = memo(function RewardDisplay({ reward, totalCoins }: RewardDisplayProps) {
  return (
    <View style={styles.root}>
      <View style={styles.earned}>
        <CoinIcon size={34} />
        <Text style={textStyles.title}>+{reward.total}</Text>
      </View>
      {reward.firstClearBonus > 0 ? (
        <View style={styles.breakdown}>
          <Row label="Level clear" value={reward.base} />
          <Row label="Stars" value={reward.starBonus} />
          <Row label="First clear" value={reward.firstClearBonus} />
        </View>
      ) : (
        <Text style={textStyles.caption}>Replay reward</Text>
      )}
      <Text style={textStyles.label}>Balance: {totalCoins}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.sm, alignSelf: 'stretch' },
  earned: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  breakdown: {
    alignSelf: 'stretch',
    borderTopWidth: borderWidths.thin,
    borderBottomWidth: borderWidths.thin,
    borderColor: colors.ink,
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
