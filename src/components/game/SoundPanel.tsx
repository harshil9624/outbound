import { memo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Text } from '@/components/ui/Text';
import { playSound } from '@/audio/sounds';
import { GearIcon } from '@/components/icons';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { HardShadow } from '@/components/ui/HardShadow';
import { Toggle } from '@/components/ui/Toggle';
import { useSettingsStore } from '@/store/settingsStore';
import { vibrateBlocked } from '@/utils/haptics';
import { borderWidths, colors, palette, spacing, textStyles, themed } from '@/theme';
import { withAlpha } from '@/utils/color';

/** Volume steps the bars stand for: 25% each. */
const LEVELS = [0.25, 0.5, 0.75, 1];

/**
 * Sound controls from the play screen: effects on/off, volume, vibration. Same settings as
 * Settings → Sound & feel. Tap outside the panel or Done to close.
 */
export const SoundPanel = memo(function SoundPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { soundEnabled, vibrationEnabled, volume, setSetting, setVolume } = useSettingsStore(
    useShallow((s) => ({
      soundEnabled: s.soundEnabled,
      vibrationEnabled: s.vibrationEnabled,
      volume: s.volume,
      setSetting: s.setSetting,
      setVolume: s.setVolume,
    })),
  );

  const pickVolume = (v: number) => {
    setVolume(v);
    // Choosing a level while muted turns sound back on, then plays a sample at the new level.
    if (!soundEnabled) setSetting('soundEnabled', true);
    playSound('tap');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close settings">
        {/* Taps inside the panel stay in the panel. */}
        <Pressable onPress={() => {}} style={styles.panelWrap} accessible={false}>
          <HardShadow size="lg">
            <View style={styles.panel}>
              <View style={styles.head}>
                <GearIcon size={26} />
                <Text style={styles.title}>Settings</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={textStyles.subheading}>Sound effects</Text>
                  <Text style={textStyles.caption}>{soundEnabled ? 'On' : 'Off'}</Text>
                </View>
                <Toggle
                  label="Sound effects"
                  value={soundEnabled}
                  onChange={(v) => {
                    setSetting('soundEnabled', v);
                    playSound('tap');
                  }}
                />
              </View>

              <View style={[styles.volume, !soundEnabled && styles.dim]}>
                <View style={styles.rowText}>
                  <Text style={textStyles.subheading}>Volume</Text>
                  <Text style={textStyles.caption}>{soundEnabled ? `${Math.round(volume * 100)}%` : 'Muted'}</Text>
                </View>
                <View style={styles.bars} accessibilityRole="adjustable" accessibilityLabel={`Volume ${Math.round(volume * 100)} percent`}>
                  {LEVELS.map((level, i) => {
                    const on = soundEnabled && volume >= level;
                    return (
                      <Pressable
                        key={level}
                        onPress={() => pickVolume(level)}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel={`Volume ${level * 100} percent`}
                        style={[styles.bar, { height: 14 + i * 8 }, on ? styles.barOn : styles.barOff]}
                      />
                    );
                  })}
                </View>
              </View>

              <View style={[styles.row, styles.divider]}>
                <View style={styles.rowText}>
                  <Text style={textStyles.subheading}>Vibration</Text>
                  <Text style={textStyles.caption}>Buzz on a blocked tap</Text>
                </View>
                <Toggle
                  label="Vibration"
                  value={vibrationEnabled}
                  onChange={(v) => {
                    setSetting('vibrationEnabled', v);
                    if (v) vibrateBlocked(true);
                  }}
                />
              </View>

              <BrutalistButton label="DONE" onPress={onClose} color="success" style={styles.done} />
            </View>
          </HardShadow>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = themed(() =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: withAlpha(palette.black, 0.55), justifyContent: 'center', paddingHorizontal: spacing.xl },
    panelWrap: { alignSelf: 'stretch' },
    panel: {
      backgroundColor: colors.surface,
      borderWidth: borderWidths.thick,
      borderColor: colors.ink,
      padding: spacing.lg,
      gap: spacing.md,
    },
    head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    title: { ...textStyles.heading },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
    divider: { borderTopWidth: borderWidths.thin, borderTopColor: withAlpha(colors.ink, 0.25), paddingTop: spacing.md },
    rowText: { flex: 1, minWidth: 0, gap: 2 },
    volume: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
    dim: { opacity: 0.55 },
    bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    bar: { width: 18, borderWidth: borderWidths.regular, borderColor: colors.ink },
    barOn: { backgroundColor: palette.yellow },
    barOff: { backgroundColor: colors.disabled },
    done: { alignSelf: 'stretch', marginTop: spacing.xs },
  }),
);
