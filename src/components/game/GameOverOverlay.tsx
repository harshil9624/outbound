import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { spacing, textStyles } from '@/theme';

interface GameOverOverlayProps {
  onRetry: () => void;
  onHome: () => void;
}

export const GameOverOverlay = memo(function GameOverOverlay({ onRetry, onHome }: GameOverOverlayProps) {
  return (
    <View style={styles.backdrop}>
      <BrutalistCard color="danger" shadow="lg" contentStyle={styles.card}>
        <Text style={textStyles.title}>Out of hearts</Text>
        <Text style={textStyles.body}>Blocked arrows cost a heart. Try a different order.</Text>
        <View style={styles.actions}>
          <BrutalistButton label="Retry" onPress={onRetry} color="primary" />
          <BrutalistButton label="Home" onPress={onHome} color="surface" />
        </View>
      </BrutalistCard>
    </View>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,17,17,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: { gap: spacing.md, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
