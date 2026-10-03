import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CoinIcon } from '@/components/icons';
import { borderWidths, colors, spacing, textStyles } from '@/theme';
import { HardShadow, cornerStyles } from './HardShadow';

export const CoinDisplay = memo(function CoinDisplay({ coins }: { coins: number }) {
  return (
    <HardShadow size="sm" corner="sm">
      <View style={[styles.pill, cornerStyles.sm]} accessibilityLabel={`${coins} coins`}>
        <CoinIcon size={22} />
        <Text style={textStyles.number}>{coins}</Text>
      </View>
    </HardShadow>
  );
});

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
  },
});
