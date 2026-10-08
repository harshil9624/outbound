import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
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
    LilitaOne_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
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
        <Stack.Screen name="level/[levelId]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="win/index" options={{ gestureEnabled: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = themed(() => StyleSheet.create({
  content: { backgroundColor: colors.background },
}));
