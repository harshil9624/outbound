import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Tab screens drop 'bottom': the bottom nav owns that inset. */
  edges?: readonly Edge[];
}

/** Fixed, non-scrolling screen frame. Gameplay screens must never scroll. */
export function Screen({ children, style, edges }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
});
