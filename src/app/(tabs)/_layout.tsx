import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { BottomNav } from '@/components/nav/BottomNav';
import { colors } from '@/theme';

/** Home, Challenges, Streak, Settings. Gameplay routes stay on the root Stack, above the tabs. */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: styles.scene }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="challenges" />
      <Tabs.Screen name="streak" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.background },
});
