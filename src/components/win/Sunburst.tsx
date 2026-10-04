import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SUNBURST_TURN_MS } from '@/constants/animation';
import { colors } from '@/theme';

const RAYS = 16;

/** Slowly turning comic-book rays behind the win card. */
export const Sunburst = memo(function Sunburst({ reducedMotion }: { reducedMotion: boolean }) {
  const { width, height } = useWindowDimensions();
  // Just enough to cover the screen at any rotation (its diagonal); bigger only costs fill-rate.
  const size = Math.hypot(width, height) * 1.02;
  const turn = useSharedValue(0);
  const grow = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    grow.value = withSpring(1, { damping: 14, stiffness: 90 });
    turn.value = withRepeat(withTiming(360, { duration: SUNBURST_TURN_MS, easing: Easing.linear }), -1);
  }, [reducedMotion, grow, turn]);

  const d = useMemo(() => {
    const c = size / 2;
    const step = (Math.PI * 2) / RAYS;
    let path = '';
    for (let i = 0; i < RAYS; i += 2) {
      const a0 = i * step;
      const a1 = a0 + step;
      path += `M${c} ${c} L${c + Math.cos(a0) * c} ${c + Math.sin(a0) * c} L${c + Math.cos(a1) * c} ${c + Math.sin(a1) * c} Z `;
    }
    return path;
  }, [size]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value}deg` }, { scale: grow.value }],
  }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      {/* Cached as a GPU texture: rotating it no longer repaints the SVG every frame. */}
      <Animated.View style={[{ width: size, height: size }, style]} renderToHardwareTextureAndroid shouldRasterizeIOS>
        <Svg width={size} height={size}>
          <Path d={d} fill={colors.primary} opacity={0.35} />
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
