import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { RestartIcon } from '@/components/icons';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { spacing } from '@/theme';
import { HintButton } from './HintButton';
import { UndoButton } from './UndoButton';

interface GameControlsProps {
  canUndo: boolean;
  canHint: boolean;
  onUndo: () => void;
  onHint: () => void;
  onRestart: () => void;
}

export const GameControls = memo(function GameControls({ canUndo, canHint, onUndo, onHint, onRestart }: GameControlsProps) {
  return (
    <View style={styles.row}>
      <UndoButton onPress={onUndo} disabled={!canUndo} />
      <BrutalistButton icon={<RestartIcon />} onPress={onRestart} color="surface" size="md" accessibilityLabel="Restart level" />
      <HintButton onPress={onHint} disabled={!canHint} />
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.md, paddingTop: spacing.md },
});
