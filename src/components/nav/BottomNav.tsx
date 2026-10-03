import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { playSound } from '@/audio/sounds';
import { FlameIcon, GearIcon, HomeIcon, TrophyIcon } from '@/components/icons';
import { HardShadow, cornerStyles } from '@/components/ui/HardShadow';
import { surfaceStyles } from '@/components/ui/surfaceStyles';
import { borderWidths, colors, spacing, textStyles, type SurfaceColor } from '@/theme';

interface TabSpec {
  label: string;
  Icon: ComponentType<{ size?: number; color?: string }>;
  color: SurfaceColor;
}

/** Keyed by route file name in src/app/(tabs). Order comes from the Tabs layout. */
export const TAB_SPECS: Record<string, TabSpec> = {
  home: { label: 'HOME', Icon: HomeIcon, color: 'primary' },
  challenges: { label: 'CHALLENGES', Icon: TrophyIcon, color: 'info' },
  streak: { label: 'STREAK', Icon: FlameIcon, color: 'accent' },
  settings: { label: 'SETTINGS', Icon: GearIcon, color: 'success' },
};

const BUBBLE = 44;
const ICON = 26;

/** Floating pill-shaped tab bar. The active tab sits in a round colored bubble. */
export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.sm }]}>
      <HardShadow size="md" corner="pill">
        <View style={[styles.panel, cornerStyles.pill]} accessibilityRole="tablist">
          {state.routes.map((route, index) => {
            const spec = TAB_SPECS[route.name];
            if (!spec) return null;
            const focused = state.index === index;
            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                playSound('tap');
                navigation.navigate(route.name, route.params);
              }
            };
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.item}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={spec.label}
              >
                {({ pressed }) => (
                  <>
                    <View
                      style={[
                        styles.bubble,
                        focused ? [styles.bubbleActive, surfaceStyles[spec.color]] : null,
                        pressed && styles.bubblePressed,
                      ]}
                    >
                      <spec.Icon size={ICON} color={focused ? colors.surface : colors.disabled} />
                    </View>
                    <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                      {spec.label}
                    </Text>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      </HardShadow>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  panel: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: borderWidths.thick,
    borderColor: colors.ink,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  item: { flex: 1, alignItems: 'center', gap: spacing.xxs },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.regular,
    borderColor: 'transparent',
  },
  bubbleActive: { borderColor: colors.ink },
  bubblePressed: { transform: [{ scale: 0.92 }] },
  label: { ...textStyles.caption, fontSize: 10, color: colors.inkMuted },
  labelActive: { color: colors.ink, fontWeight: '900' },
});
