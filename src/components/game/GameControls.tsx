import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BulbIcon, HammerIcon, HeartIcon, RestartIcon } from '@/components/icons';
import { BOOST_COSTS } from '@/constants/gameConfig';
import { spacing, themed } from '@/theme';
import { BoostButton } from './BoostButton';
import { BoostNotice } from './BoostNotice';

interface GameControlsProps {
  canHint: boolean;
  canHammer: boolean;
  canBuyLife: boolean;
  hammerArmed: boolean;
  /** Why the last boost tap did nothing. */
  notice: { text: string; token: number } | null;
  onHint: () => void;
  onHammer: () => void;
  onBuyLife: () => void;
  onRestart: () => void;
}

// Built once: a fresh icon element on every render would defeat BoostButton's memo.
const RESTART_ICON = <RestartIcon size={28} />;
const HINT_ICON = <BulbIcon size={30} />;
const HAMMER_ICON = <HammerIcon size={30} />;
const HEART_ICON = <HeartIcon size={30} />;

/** Restart is free; Hint, Hammer and +1 Heart cost coins and disable when unaffordable. */
export const GameControls = memo(function GameControls({
  canHint,
  canHammer,
  canBuyLife,
  hammerArmed,
  notice,
  onHint,
  onHammer,
  onBuyLife,
  onRestart,
}: GameControlsProps) {
  return (
    <View style={styles.row}>
      <BoostNotice notice={notice} />
      <BoostButton icon={RESTART_ICON} label="RESTART" color="surface" disabled={false} onPress={onRestart} />
      <BoostButton
        icon={HINT_ICON}
        label="HINT"
        cost={BOOST_COSTS.hint}
        color="primary"
        disabled={!canHint}
        sound={null}
        onPress={onHint}
      />
      <BoostButton
        icon={HAMMER_ICON}
        label="HAMMER"
        cost={BOOST_COSTS.hammer}
        color="info"
        disabled={!canHammer}
        active={hammerArmed}
        sound={null}
        onPress={onHammer}
      />
      <BoostButton
        icon={HEART_ICON}
        label="+1 HEART"
        cost={BOOST_COSTS.life}
        color="accent"
        disabled={!canBuyLife}
        sound={null}
        onPress={onBuyLife}
      />
    </View>
  );
});

const styles = themed(() => StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-start', paddingTop: spacing.lg },
}));
