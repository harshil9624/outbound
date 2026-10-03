import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LockIcon } from '@/components/icons';
import { borderWidths, colors, spacing, textStyles } from '@/theme';
import { BrutalistCard } from './BrutalistCard';

/** Placeholder only. The Daily Challenge route is intentionally not implemented this sprint. */
export const DailyChallengeWidget = memo(function DailyChallengeWidget() {
  return (
    <BrutalistCard color="info" style={styles.card} contentStyle={styles.face}>
      <LockIcon size={28} />
      <Text style={textStyles.label}>DAILY CHALLENGE</Text>
      <View style={styles.tag}>
        <Text style={styles.tagText}>Coming Soon</Text>
      </View>
    </BrutalistCard>
  );
});

const styles = StyleSheet.create({
  card: { flex: 1, transform: [{ rotate: '1.5deg' }] },
  face: { minHeight: 132, justifyContent: 'space-between' },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: borderWidths.thin,
    borderColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  tagText: textStyles.caption,
});
