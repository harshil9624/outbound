import { StyleSheet } from 'react-native';
import { colors, type SurfaceColor } from '@/theme';

export const surfaceStyles = StyleSheet.create<Record<SurfaceColor, { backgroundColor: string }>>({
  surface: { backgroundColor: colors.surface },
  primary: { backgroundColor: colors.primary },
  accent: { backgroundColor: colors.accent },
  info: { backgroundColor: colors.info },
  success: { backgroundColor: colors.success },
  danger: { backgroundColor: colors.danger },
  background: { backgroundColor: colors.background },
});
