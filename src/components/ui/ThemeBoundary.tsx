import { Fragment, type ReactNode } from 'react';
import { useThemeMode } from '@/theme';

/**
 * Remounts its children when the theme changes, so module styles rebuild from the new colours.
 * Wraps screen content and the tab bar, never a navigator: navigation state and the native
 * screens stay put, and the swap lands in a single frame with no blank in between.
 */
export function ThemeBoundary({ children }: { children: ReactNode }) {
  const themeMode = useThemeMode();
  return <Fragment key={themeMode}>{children}</Fragment>;
}
