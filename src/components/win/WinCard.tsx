import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { spacing, textStyles } from '@/theme';

export function WinCard({ levelId, children }: { levelId: number; children: ReactNode }) {
  return (
    <BrutalistCard color="primary" shadow="lg" style={styles.card} contentStyle={styles.face}>
      <Text style={textStyles.display}>YOU WIN</Text>
      <Text style={textStyles.label}>Level {levelId} cleared</Text>
      {children}
    </BrutalistCard>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'stretch', transform: [{ rotate: '-1deg' }] },
  face: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
});
