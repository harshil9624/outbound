import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { HeartIcon } from '@/components/icons';
import { colors, spacing } from '@/theme';

export const LivesDisplay = memo(function LivesDisplay({ lives, maxLives }: { lives: number; maxLives: number }) {
  const hearts = [];
  for (let i = 0; i < maxLives; i++) {
    hearts.push(<HeartIcon key={i} size={24} color={i < lives ? colors.heart : colors.disabled} />);
  }
  return (
    <View style={styles.row} accessibilityLabel={`${lives} of ${maxLives} lives left`}>
      {hearts}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
});
