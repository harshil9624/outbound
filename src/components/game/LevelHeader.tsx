import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import type { Difficulty } from '@/types';
import { BackIcon } from '@/components/icons';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { CoinDisplay } from '@/components/ui/CoinDisplay';
import { spacing, textStyles, themed } from '@/theme';
import { BoardProgress } from './BoardProgress';
import { DifficultyBadge } from './DifficultyBadge';
import { LivesDisplay } from './LivesDisplay';

interface LevelHeaderProps {
  levelId: number;
  difficulty: Difficulty;
  coins: number;
  lives: number;
  maxLives: number;
  /** Arrows cleared so far, out of the board's total. */
  cleared: number;
  total: number;
  reducedMotion: boolean;
  onBack: () => void;
}

export const LevelHeader = memo(function LevelHeader({
  levelId,
  difficulty,
  coins,
  lives,
  maxLives,
  cleared,
  total,
  reducedMotion,
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
        <BoardProgress cleared={cleared} total={total} reducedMotion={reducedMotion} />
      </View>
    </View>
  );
});

const styles = themed(() => StyleSheet.create({
  root: { gap: spacing.md, paddingTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', gap: spacing.xs },
  livesRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
}));
