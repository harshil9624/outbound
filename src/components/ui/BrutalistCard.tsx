import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { borderWidths, colors, spacing, type ShadowSize, type SurfaceColor } from '@/theme';
import { HardShadow, cornerStyles, type CornerSize } from './HardShadow';
import { surfaceStyles } from './surfaceStyles';

interface BrutalistCardProps {
  color?: SurfaceColor;
  shadow?: ShadowSize;
  corner?: CornerSize;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export function BrutalistCard({
  color = 'surface',
  shadow = 'md',
  corner = 'none',
  style,
  contentStyle,
  children,
}: BrutalistCardProps) {
  return (
    <HardShadow size={shadow} corner={corner} style={style}>
      <View style={[styles.face, surfaceStyles[color], cornerStyles[corner], contentStyle]}>{children}</View>
    </HardShadow>
  );
}

const styles = StyleSheet.create({
  face: {
    borderWidth: borderWidths.thick,
    borderColor: colors.ink,
    padding: spacing.lg,
  },
});
