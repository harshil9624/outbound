import { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import type { SoundName } from '@/audio/sounds';
import { CoinIcon } from '@/components/icons';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { borderWidths, colors, radii, spacing, textStyles, type SurfaceColor, themed, palette } from '@/theme';

interface BoostButtonProps {
  icon: ReactNode;
  label: string;
  /** Coin price; omitted for free actions. */
  cost?: number;
  /** Free boosts of this kind the player holds: shown instead of the price while any are left. */
  free?: number;
  color: SurfaceColor;
  /** Greyed out (unaffordable / not usable now) but still tappable, so the tap can explain why. */
  disabled: boolean;
  /** Armed state (hammer waiting for a target). */
  active?: boolean;
  sound?: SoundName | null;
  onPress: () => void;
}

/** Square boost button with its name underneath and a coin price tag on the corner. */
export const BoostButton = memo(function BoostButton({
  icon,
  label,
  cost,
  free = 0,
  color,
  disabled,
  active = false,
  sound,
  onPress,
}: BoostButtonProps) {
  return (
    <View style={styles.col}>
      <View>
        <BrutalistButton
          icon={icon}
          onPress={onPress}
          dimmed={disabled}
          color={active ? 'danger' : color}
          size="lg"
          sound={sound}
          accessibilityLabel={free > 0 ? `${label}, ${free} free` : cost !== undefined ? `${label}, ${cost} coins` : label}
        />
        {free > 0 ? (
          <View style={styles.free} pointerEvents="none">
            <Text style={styles.freeText}>FREE ×{free}</Text>
          </View>
        ) : cost !== undefined ? (
          <View style={[styles.price, disabled && styles.priceDisabled]} pointerEvents="none">
            <CoinIcon size={14} />
            <Text style={styles.priceText}>{cost}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, disabled && styles.labelDisabled]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {active ? 'CANCEL' : label}
      </Text>
    </View>
  );
});

const styles = themed(() => StyleSheet.create({
  col: { flex: 1, maxWidth: 96, alignItems: 'center', gap: spacing.xs },
  price: {
    position: 'absolute',
    top: -spacing.sm,
    right: -spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 1,
    paddingLeft: 2,
    paddingRight: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: borderWidths.thin,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  priceDisabled: { backgroundColor: colors.disabled },
  free: {
    position: 'absolute',
    top: -spacing.sm,
    right: -spacing.sm,
    paddingVertical: 1,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: borderWidths.thin,
    borderColor: palette.black,
    backgroundColor: palette.green,
  },
  freeText: { ...textStyles.caption, color: palette.black, fontWeight: '900' },
  priceText: { ...textStyles.caption, color: colors.ink, fontWeight: '900' },
  label: { ...textStyles.caption, color: colors.ink, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  labelDisabled: { color: colors.disabledInk },
}));
