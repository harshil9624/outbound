import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { borderWidths, colors, palette, themed } from '@/theme';

/** Static geometric confetti. Never intercepts touches. */
export const Decorations = memo(function Decorations() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.shape, styles.circle]} />
      <View style={[styles.shape, styles.square]} />
      <View style={[styles.shape, styles.bar]} />
      <View style={styles.zigzag}>
        <Svg width={96} height={24} viewBox="0 0 96 24">
          <Polyline
            points="2,20 14,4 26,20 38,4 50,20 62,4 74,20 86,4 94,14"
            fill="none"
            stroke={colors.ink}
            strokeWidth={4}
            strokeLinejoin="miter"
          />
        </Svg>
      </View>
    </View>
  );
});

const styles = themed(() => StyleSheet.create({
  shape: { position: 'absolute', borderWidth: borderWidths.thick, borderColor: colors.ink },
  circle: { top: 92, right: -26, width: 92, height: 92, borderRadius: 46, backgroundColor: palette.green },
  square: { top: 300, left: -22, width: 58, height: 58, backgroundColor: palette.purple, transform: [{ rotate: '18deg' }] },
  bar: { bottom: 150, right: 18, width: 70, height: 18, backgroundColor: palette.orange, transform: [{ rotate: '-12deg' }] },
  zigzag: { position: 'absolute', bottom: 70, left: 20 },
}));
