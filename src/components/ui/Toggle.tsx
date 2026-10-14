import { Pressable, StyleSheet, View } from 'react-native';
import { borderWidths, colors, spacing, themed } from '@/theme';

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const TRACK_W = 58;
const TRACK_H = 32;

/** On/off switch in the app's style: green track with the knob right when on. */
export function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={spacing.sm}
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}
    >
      <View style={styles.knob} />
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    track: {
      width: TRACK_W,
      height: TRACK_H,
      borderRadius: TRACK_H / 2,
      borderWidth: borderWidths.regular,
      borderColor: colors.ink,
      padding: 2,
    },
    trackOn: { backgroundColor: colors.success, alignItems: 'flex-end' },
    trackOff: { backgroundColor: colors.disabled, alignItems: 'flex-start' },
    knob: {
      width: TRACK_H - 10,
      height: TRACK_H - 10,
      borderRadius: (TRACK_H - 10) / 2,
      backgroundColor: colors.surface,
      borderWidth: borderWidths.thin,
      borderColor: colors.ink,
    },
  }),
);
