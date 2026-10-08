import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { BottomNav } from '@/components/nav/BottomNav';
import { ThemeBoundary } from '@/components/ui/ThemeBoundary';
import { colors, themed, useThemeMode } from '@/theme';

/** Home, Journey, Streak, Settings. Gameplay routes stay on the root Stack, above the tabs. */
export default function TabsLayout() {
  // Re-renders on a theme switch so screenOptions pick up the new background.
  useThemeMode();
  return (
    <Tabs
      tabBar={(props) => (
        <ThemeBoundary>
          <BottomNav {...props} />
        </ThemeBoundary>
      )}
      screenLayout={({ children }) => <ThemeBoundary>{children}</ThemeBoundary>}
      screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: styles.scene, freezeOnBlur: true }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="journey" />
      <Tabs.Screen name="streak" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = themed(() => StyleSheet.create({
  scene: { backgroundColor: colors.background },
}));
