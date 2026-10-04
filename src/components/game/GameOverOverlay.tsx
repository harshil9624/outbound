import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeartIcon } from '@/components/icons';
import { BOOST_COSTS } from '@/constants/gameConfig';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { spacing, textStyles } from '@/theme';

interface GameOverOverlayProps {
  canBuyLife: boolean;
  onBuyLife: () => void;
  onRetry: () => void;
  onHome: () => void;
}

export const GameOverOverlay = memo(function GameOverOverlay({ canBuyLife, onBuyLife, onRetry, onHome }: GameOverOverlayProps) {
  return (
    <View style={styles.backdrop}>
      <BrutalistCard color="danger" shadow="lg" contentStyle={styles.card}>
        <Text style={textStyles.title}>Out of hearts</Text>
        <Text style={textStyles.body}>Blocked arrows cost a heart. Keep going with an extra heart, or try a different order.</Text>
        <BrutalistButton
          icon={<HeartIcon size={24} />}
          label={`+1 HEART · ${BOOST_COSTS.life} COINS`}
          onPress={onBuyLife}
          dimmed={!canBuyLife}
          color="success"
          sound={null}
          style={styles.continue}
        />
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
  continue: { alignSelf: 'stretch', marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md },
});
