import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { playSound, type SoundName } from '@/audio/sounds';
import { borderWidths, colors, fontSizes, spacing, textStyles, type ShadowSize, type SurfaceColor } from '@/theme';
import { cornerStyles, pressedBySize, rootBySize, shadowBySize } from './HardShadow';
import { surfaceStyles } from './surfaceStyles';

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
          <View style={[styles.shadow, shadowBySize[shadow], cornerStyles.sm]} />
          <View
            style={[
              styles.face,
              cornerStyles.sm,
              iconOnly ? squareBySize[size] : padBySize[size],
              looksDisabled ? styles.faceDisabled : surfaceStyles[color],
              pressed && !disabled && pressedBySize[shadow],
            ]}
          >
            {icon}
            {label ? (
              <Text style={[textStyles.button, labelBySize[size], looksDisabled && styles.labelDisabled]}>{label}</Text>
            ) : null}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', backgroundColor: colors.ink },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: borderWidths.thick,
    borderColor: colors.ink,
  },
  faceDisabled: { backgroundColor: colors.disabled },
  labelDisabled: { color: colors.disabledInk },
});

const padBySize = StyleSheet.create({
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 44 },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 52 },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, minHeight: 68 },
});

const squareBySize = StyleSheet.create({
  sm: { width: 44, height: 44 },
  md: { width: 52, height: 52 },
  lg: { width: 64, height: 64 },
});

const labelBySize = StyleSheet.create({
  sm: { fontSize: fontSizes.sm },
  md: { fontSize: fontSizes.lg },
  lg: { fontSize: fontSizes.xl },
});
