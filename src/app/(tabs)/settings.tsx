import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { playSound } from '@/audio/sounds';
import { useSettingsStore } from '@/store/settingsStore';
import { BrutalistCard, Screen } from '@/components/ui';
import { borderWidths, colors, spacing, textStyles } from '@/theme';

type SettingKey = 'soundEnabled' | 'vibrationEnabled' | 'reducedMotion';

const ROWS: { key: SettingKey; label: string; hint: string }[] = [
  { key: 'soundEnabled', label: 'Sound', hint: 'Sound effects' },
  { key: 'vibrationEnabled', label: 'Vibration', hint: 'Buzz on a blocked tap' },
  { key: 'reducedMotion', label: 'Reduced motion', hint: 'Faster exits, no hint pulse' },
];

export default function SettingsRoute() {
  const { setSetting, ...values } = useSettingsStore(
    useShallow((s) => ({
      soundEnabled: s.soundEnabled,
      vibrationEnabled: s.vibrationEnabled,
      reducedMotion: s.reducedMotion,
      setSetting: s.setSetting,
    })),
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={textStyles.title}>Settings</Text>
        <BrutalistCard contentStyle={styles.card}>
          {ROWS.map(({ key, label, hint }, i) => (
            <View key={key} style={[styles.row, i > 0 && styles.rowDivider]}>
              <View style={styles.rowText}>
                <Text style={textStyles.subheading}>{label}</Text>
                <Text style={textStyles.caption}>{hint}</Text>
              </View>
              <Toggle
                label={label}
                value={values[key]}
                onChange={(v) => {
                  // Set first: turning Sound on clicks, turning it off stays silent.
                  setSetting(key, v);
                  playSound('tap');
                }}
              />
            </View>
          ))}
        </BrutalistCard>
      </View>
    </Screen>
  );
}

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, value, onChange }: ToggleProps) {
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

const TRACK_W = 58;
const TRACK_H = 32;

const styles = StyleSheet.create({
  content: { flex: 1, gap: spacing.xl, paddingTop: spacing.md },
  card: { paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowDivider: { borderTopWidth: borderWidths.thin, borderTopColor: colors.ink },
  rowText: { flex: 1, gap: spacing.xxs },
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
});
