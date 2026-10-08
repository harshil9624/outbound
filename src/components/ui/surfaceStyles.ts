import { StyleSheet } from 'react-native';
import { colors, type SurfaceColor, themed } from '@/theme';

export const surfaceStyles = themed(() => StyleSheet.create<Record<SurfaceColor, { backgroundColor: string }>>({
  surface: { backgroundColor: colors.surface },
  primary: { backgroundColor: colors.primary },
  accent: { backgroundColor: colors.accent },
  info: { backgroundColor: colors.info },
  success: { backgroundColor: colors.success },
  danger: { backgroundColor: colors.danger },
  background: { backgroundColor: colors.paper },
}));

/** Faces that carry dark text in both themes (see OnColor). */
export function isColorFace(color: SurfaceColor): boolean {
  return color !== 'surface' && color !== 'background';
}
