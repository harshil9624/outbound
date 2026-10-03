import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { APP_NAME, APP_TAGLINE, SPLASH_DURATION_MS } from '@/constants/app';
import { BrutalistCard, Decorations } from '@/components/ui';
import { colors, spacing, textStyles } from '@/theme';

/** Splash. Stores hydrate synchronously from MMKV, so no loading gate is needed. */
export default function SplashRoute() {
  const router = useRouter();
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 140 });
    const t = setTimeout(() => router.replace('/home'), SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, [router, scale]);

  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { rotate: '-3deg' }] }));

  return (
    <View style={styles.root}>
      <Decorations />
      <Animated.View style={logoStyle}>
        <BrutalistCard color="primary" shadow="lg" contentStyle={styles.logo}>
          <Text style={textStyles.display}>{APP_NAME}</Text>
        </BrutalistCard>
      </Animated.View>
      <Text style={styles.tagline}>{APP_TAGLINE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: spacing.xl },
  logo: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  tagline: textStyles.label,
});
