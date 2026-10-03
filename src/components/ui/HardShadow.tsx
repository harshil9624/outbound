import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radii, shadowColor, shadowOffsets, type ShadowSize } from '@/theme';

export type CornerSize = 'none' | 'sm' | 'md' | 'pill';

interface HardShadowProps {
  size?: ShadowSize;
  corner?: CornerSize;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/** Solid offset block behind its child. The child is the "face". */
export function HardShadow({ size = 'md', corner = 'none', style, children }: HardShadowProps) {
  return (
    <View style={[rootBySize[size], style]}>
      <View style={[styles.shadow, shadowBySize[size], cornerStyles[corner]]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', backgroundColor: shadowColor },
});

const makeRoot = (o: number): ViewStyle => ({ marginRight: o, marginBottom: o });
const makeShadow = (o: number): ViewStyle => ({ top: o, left: o, right: -o, bottom: -o });

export const rootBySize = StyleSheet.create({
  sm: makeRoot(shadowOffsets.sm),
  md: makeRoot(shadowOffsets.md),
  lg: makeRoot(shadowOffsets.lg),
});

export const shadowBySize = StyleSheet.create({
  sm: makeShadow(shadowOffsets.sm),
  md: makeShadow(shadowOffsets.md),
  lg: makeShadow(shadowOffsets.lg),
});

export const cornerStyles = StyleSheet.create({
  none: { borderRadius: radii.none },
  sm: { borderRadius: radii.sm },
  md: { borderRadius: radii.md },
  pill: { borderRadius: radii.pill },
});

/** Face translation used by pressable faces to "sink" onto their shadow. */
export const pressedBySize = StyleSheet.create({
  sm: { transform: [{ translateX: shadowOffsets.sm }, { translateY: shadowOffsets.sm }] },
  md: { transform: [{ translateX: shadowOffsets.md }, { translateY: shadowOffsets.md }] },
  lg: { transform: [{ translateX: shadowOffsets.lg }, { translateY: shadowOffsets.lg }] },
});
