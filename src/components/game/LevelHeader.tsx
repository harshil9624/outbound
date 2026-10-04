import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Difficulty } from '@/types';
import { BackIcon } from '@/components/icons';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { CoinDisplay } from '@/components/ui/CoinDisplay';
import { spacing, textStyles } from '@/theme';
import { DifficultyBadge } from './DifficultyBadge';
import { LivesDisplay } from './LivesDisplay';

interface LevelHeaderProps {
  levelId: number;
  difficulty: Difficulty;
  coins: number;
  lives: number;
  maxLives: number;
  onBack: () => void;
}

export const LevelHeader = memo(function LevelHeader({
  levelId,
  difficulty,
  coins,
  lives,
  maxLives,
  onBack,
}: LevelHeaderProps) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <BrutalistButton icon={<BackIcon />} onPress={onBack} color="surface" size="sm" accessibilityLabel="Back" />
        <View style={styles.center}>
          <Text style={textStyles.heading}>Level {levelId}</Text>
          <DifficultyBadge difficulty={difficulty} />
        </View>
        <CoinDisplay coins={coins} showSpend />
      </View>
      <View style={styles.livesRow}>
        <LivesDisplay lives={lives} maxLives={maxLives} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: spacing.md, paddingTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', gap: spacing.xs },
  livesRow: { alignItems: 'center' },
});
