import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { playSound, type SoundName } from '@/audio/sounds';
import { borderWidths, colors, fontSizes, spacing, textStyles, type ShadowSize, type SurfaceColor, themed } from '@/theme';
import { cornerStyles, pressedBySize, rootBySize, shadowBySize } from './HardShadow';
import { isColorFace, surfaceStyles } from './surfaceStyles';
import { OnColor } from './Text';

type ButtonSize = 'sm' | 'md' | 'lg';

interface BrutalistButtonProps {
  label?: string;
  icon?: ReactNode;
  onPress: () => void;
  color?: SurfaceColor;
  size?: ButtonSize;
  disabled?: boolean;
  /** Looks disabled but still receives presses (so the action can explain why it can't run). */
  dimmed?: boolean;
  accessibilityLabel?: string;
  /** Played on press while Sound is on. null = silent (the action plays its own sound). */
  sound?: SoundName | null;
  style?: StyleProp<ViewStyle>;
}

const SHADOW_FOR_SIZE: Record<ButtonSize, ShadowSize> = { sm: 'sm', md: 'md', lg: 'lg' };

export function BrutalistButton({
  label,
  icon,
  onPress,
  color = 'primary',
  size = 'md',
  disabled = false,
  dimmed = false,
  accessibilityLabel,
  sound = 'tap',
  style,
}: BrutalistButtonProps) {
  const shadow = SHADOW_FOR_SIZE[size];
  const iconOnly = !label;
  const looksDisabled = disabled || dimmed;
  return (
    <Pressable
      onPress={() => {
        if (sound) playSound(sound);
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[rootBySize[shadow], style]}
    >
      {({ pressed }) => (
        <>
          <View collapsable={false} style={[styles.shadow, shadowBySize[shadow], cornerStyles.sm]} />
          {/* collapsable={false}: never flattened. A pressed-state change that also flattens or
              unflattens a view makes Android's New Architecture move its children; if that lands in
              the same frame as a navigation, the app crashes ("child already has a parent"). */}
          <View
            collapsable={false}
            style={[
              styles.face,
              cornerStyles.sm,
              iconOnly ? squareBySize[size] : padBySize[size],
              looksDisabled ? styles.faceDisabled : surfaceStyles[color],
              pressed && !disabled && pressedBySize[shadow],
            ]}
          >
            <OnColor value={!looksDisabled && isColorFace(color)}>
              {icon}
              {label ? (
                // One line, shrinking to fit a narrow button (half-width pairs, small phones, big
                // system font) instead of wrapping or running past the edge.
                <Text
                  style={[textStyles.button, labelBySize[size], styles.label, looksDisabled && styles.labelDisabled]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {label}
                </Text>
              ) : null}
            </OnColor>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = themed(() => StyleSheet.create({
  shadow: { position: 'absolute', backgroundColor: colors.shadow },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: borderWidths.thick,
    borderColor: colors.ink,
  },
  faceDisabled: { backgroundColor: colors.disabled },
  label: { flexShrink: 1, textAlign: 'center' },
  labelDisabled: { color: colors.disabledInk },
}));

const padBySize = themed(() => StyleSheet.create({
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 44 },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 52 },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, minHeight: 68 },
}));

const squareBySize = themed(() => StyleSheet.create({
  sm: { width: 44, height: 44 },
  md: { width: 52, height: 52 },
  lg: { width: 64, height: 64 },
}));

const labelBySize = themed(() => StyleSheet.create({
  sm: { fontSize: fontSizes.sm },
  md: { fontSize: fontSizes.lg },
  lg: { fontSize: fontSizes.xl },
}));
