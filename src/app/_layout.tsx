import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { preloadSounds } from '@/audio/sounds';
import { followSystemMotion } from '@/store/followSystemMotion';
import { ThemeBoundary } from '@/components/ui/ThemeBoundary';
import { colors, themed, useThemeMode } from '@/theme';

export default function RootLayout() {
  useEffect(preloadSounds, []);
  useEffect(followSystemMotion, []);
  // Re-renders on a theme switch so screenOptions pick up the new background.
  const themeMode = useThemeMode();
  // Bundled with the app, so this resolves in a few frames. Keys must match theme/typography fonts.
  const [fontsLoaded, fontError] = useFonts({
    LilitaOne: require('../../assets/fonts/LilitaOne-Regular.ttf'),
    'Nunito-SemiBold': require('../../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('../../assets/fonts/Nunito-Bold.ttf'),
    'Nunito-ExtraBold': require('../../assets/fonts/Nunito-ExtraBold.ttf'),
    'Nunito-Black': require('../../assets/fonts/Nunito-Black.ttf'),
  });
  // On a load error, carry on: text falls back to the system font rather than a blank app.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      {/* freezeOnBlur: screens under the game (the tabs) stop re-rendering while hidden. */}
      <Stack
        screenOptions={{ headerShown: false, animation: 'fade', contentStyle: styles.content, freezeOnBlur: true }}
        // The tabs are a navigator: they wrap their own screens, so they aren't remounted here.
        screenLayout={({ route, children }) => (route.name === '(tabs)' ? children : <ThemeBoundary>{children}</ThemeBoundary>)}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        {/* No screen fade into a level: it waited for the whole board to build. The board fades itself in. */}
        <Stack.Screen name="level/[levelId]" options={{ gestureEnabled: false, animation: 'none' }} />
        <Stack.Screen name="win/index" options={{ gestureEnabled: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = themed(() => StyleSheet.create({
  content: { backgroundColor: colors.background },
}));
