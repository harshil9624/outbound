import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { spacing, textStyles, themed } from '@/theme';

interface LeaveOverlayProps {
  onStay: () => void;
  onLeave: () => void;
}

/** "Leave this level?" Staying is the big, easy button: a mis-tap on Back shouldn't cost the board. */
export const LeaveOverlay = memo(function LeaveOverlay({ onStay, onLeave }: LeaveOverlayProps) {
  return (
    <View style={styles.backdrop}>
      <BrutalistCard color="surface" shadow="lg" contentStyle={styles.card}>
        <Text style={textStyles.title}>Leave this level?</Text>
        <Text style={textStyles.body}>The arrows you cleared will come back next time.</Text>
        <BrutalistButton label="KEEP PLAYING" onPress={onStay} color="success" size="lg" style={styles.stay} />
        <BrutalistButton label="Leave" onPress={onLeave} color="surface" size="sm" style={styles.leave} />
      </BrutalistCard>
    </View>
  );
});

const styles = themed(() => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,17,17,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: { gap: spacing.md, alignItems: 'flex-start' },
  stay: { alignSelf: 'stretch', marginTop: spacing.sm },
  leave: { alignSelf: 'center' },
}));
