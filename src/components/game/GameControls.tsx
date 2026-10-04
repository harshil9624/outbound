import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BulbIcon, HammerIcon, HeartIcon, RestartIcon } from '@/components/icons';
import { BOOST_COSTS } from '@/constants/gameConfig';
import { spacing } from '@/theme';
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
      <BoostButton icon={<RestartIcon size={28} />} label="RESTART" color="surface" disabled={false} onPress={onRestart} />
      <BoostButton
        icon={<BulbIcon size={30} />}
        label="HINT"
        cost={BOOST_COSTS.hint}
        color="primary"
        disabled={!canHint}
        sound={null}
        onPress={onHint}
      />
      <BoostButton
        icon={<HammerIcon size={30} />}
        label="HAMMER"
        cost={BOOST_COSTS.hammer}
        color="info"
        disabled={!canHammer}
        active={hammerArmed}
        sound={null}
        onPress={onHammer}
      />
      <BoostButton
        icon={<HeartIcon size={30} />}
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-start', paddingTop: spacing.lg },
});
