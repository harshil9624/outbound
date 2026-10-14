import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import type { Difficulty } from '@/types';
import { BackIcon, GearIcon } from '@/components/icons';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { CoinDisplay } from '@/components/ui/CoinDisplay';
import { palette, spacing, textStyles, themed } from '@/theme';
import { BoardProgress } from './BoardProgress';
import { DifficultyBadge } from './DifficultyBadge';
import { LivesDisplay } from './LivesDisplay';
import { SoundPanel } from './SoundPanel';
import { useSettingsStore } from '@/store/settingsStore';

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
  const soundOn = useSettingsStore((s) => s.soundEnabled);
  const [soundPanel, setSoundPanel] = useState(false);
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <BrutalistButton icon={<BackIcon />} onPress={onBack} color="surface" size="sm" accessibilityLabel="Back" />
        <View style={styles.center}>
          <Text style={textStyles.heading} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            Level {levelId}
          </Text>
          <DifficultyBadge difficulty={difficulty} />
        </View>
        <View style={styles.right}>
          <CoinDisplay coins={coins} showSpend />
          {/* A gear like the Settings tab, on a yellow face so its black teeth read in dark mode too. */}
          <BrutalistButton
            icon={<GearIcon size={24} color={palette.white} />}
            onPress={() => setSoundPanel(true)}
            color="primary"
            size="sm"
            accessibilityLabel={soundOn ? 'Settings, sound on' : 'Settings, sound off'}
          />
        </View>
      </View>
      <SoundPanel visible={soundPanel} onClose={() => setSoundPanel(false)} />
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
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  // Between two buttons and the coins: on a narrow phone the title shrinks rather than overflows.
  center: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  livesRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
}));
