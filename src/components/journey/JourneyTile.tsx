import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { OnColor, Text } from '@/components/ui/Text';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { MapNode } from '@/game/journey/types';
import { borderWidths, colors, fontWeights, palette, themed } from '@/theme';
import { mixHex, withAlpha } from '@/utils/color';
import { useMapMotionActive } from './mapMotion';

/** Tile sizes in dp (design spec §9). */
export const TILE = { regular: 56, current: 72, masterW: 112, masterH: 60, bonus: 46, challenge: 48 } as const;

export interface TileCelebration {
  /** Stars shown before the animation (they drop in up to node.stars). */
  fromStars: number;
  /** Pop in as newly unlocked. */
  unlocked: boolean;
  /** Delay before this tile's part of the sequence. */
  delayMs: number;
}

interface JourneyTileProps {
  node: MapNode;
  color: string;
  selected: boolean;
  /** Changes → shake (tapped while locked). 0 = idle. */
  shakeToken: number;
  celebration: TileCelebration | null;
  reducedMotion: boolean;
  onPress: (node: MapNode) => void;
}

/**
 * One level on the Journey route: a square tile with an ink outline and a hard shadow.
 * Shape says what kind of level it is; fill says how far you've got.
 *
 * Most tiles never move, so they render as plain views. Only a tile with something to animate
 * (the current one, one just unlocked, one being shaken) mounts the Reanimated version: a
 * chapter scrolling into view builds ~14 still tiles instead of ~14 sets of animations.
 */
export const JourneyTile = memo(function JourneyTile(props: JourneyTileProps) {
  const moving = props.node.state === 'current' || props.shakeToken > 0 || !!props.celebration?.unlocked;
  if (moving) return <MovingTile {...props} />;
  return <TileShell {...props} wrapStyle={props.node.kind === 'challenge' ? STILL.challenge : null} shadowStyle={STILL.shadow} />;
});

function MovingTile(props: JourneyTileProps) {
  const { node, shakeToken, celebration, reducedMotion } = props;
  const { state, kind } = node;
  const current = state === 'current';
  // Idle loops run on the current tile only, and pause while the map is off screen.
  const loop = useMapMotionActive(current);

  // Current tile: the shadow breathes (the brutalist answer to a glow).
  const breathe = useSharedValue(0);
  useEffect(() => {
    if (!loop || reducedMotion) {
      cancelAnimation(breathe);
      breathe.value = 0;
      return;
    }
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [loop, reducedMotion, breathe]);

  // Challenge diamond rocks gently while it's the next level.
  const rock = useSharedValue(0);
  useEffect(() => {
    if (kind !== 'challenge' || !loop || reducedMotion) {
      cancelAnimation(rock);
      rock.value = 0;
      return;
    }
    rock.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(-1, { duration: 900 })), -1, true);
  }, [kind, loop, reducedMotion, rock]);

  const shake = useSharedValue(0);
  useEffect(() => {
    if (shakeToken === 0 || reducedMotion) return;
    shake.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(-1, { duration: 60 }),
      withTiming(0.6, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  }, [shakeToken, reducedMotion, shake]);

  // Unlock pop.
  const pop = useSharedValue(1);
  useEffect(() => {
    if (!celebration?.unlocked || reducedMotion) return;
    pop.value = 0.8;
    pop.value = withDelay(celebration.delayMs, withSequence(withTiming(1.12, { duration: 160 }), withSpring(1, { damping: 8 })));
  }, [celebration, reducedMotion, pop]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value * 6 },
      { scale: pop.value },
      { rotate: `${(kind === 'challenge' ? 45 : 0) + rock.value * 4}deg` },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => {
    const o = (current ? 6 : 5) + breathe.value * 3;
    return { transform: [{ translateX: o }, { translateY: o }] };
  });

  return <TileShell {...props} wrapStyle={wrapStyle} shadowStyle={shadowStyle} />;
}

/** Shadow offset and challenge rotation for a tile that isn't animating. */
const STILL = {
  shadow: { transform: [{ translateX: 5 }, { translateY: 5 }] },
  challenge: { transform: [{ rotate: '45deg' }] },
} as const;

function TileShell({
  node,
  color,
  selected,
  celebration,
  reducedMotion,
  onPress,
  wrapStyle,
  shadowStyle,
}: JourneyTileProps & { wrapStyle: StyleProp<ViewStyle>; shadowStyle: StyleProp<ViewStyle> }) {
  const { state, kind } = node;
  const locked = state === 'locked';
  const current = state === 'current';
  const size = sizeFor(node);
  const fill = locked
    ? colors.paper
    : state === 'available'
      ? colors.surface
      : state === 'completed'
        ? mixHex(color, '#FFFFFF', 0.45)
        : color;
  const shadowColor = locked ? colors.disabled : kind === 'master' ? palette.yellow : colors.shadow;
  // Current, completed and perfect tiles are filled with the chapter colour: dark text in both themes.
  const onColorFace = !locked && state !== 'available' && kind !== 'master';
  const round = kind === 'bonus';

  return (
    <Pressable
      onPress={() => onPress(node)}
      disabled={locked}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={labelFor(node)}
      accessibilityState={{ selected, disabled: locked }}
      style={{ width: size.w, height: size.h }}
    >
      {({ pressed }) => (
        <Animated.View style={[{ width: size.w, height: size.h }, wrapStyle]}>
          <Animated.View
            style={[
              styles.abs,
              { width: size.w, height: size.h, backgroundColor: shadowColor, borderRadius: round ? size.w / 2 : 0 },
              shadowStyle,
            ]}
          />
          {/* Never flattened: see BrutalistButton. */}
          <View
            collapsable={false}
            style={[
              styles.face,
              {
                width: size.w,
                height: size.h,
                backgroundColor: kind === 'master' ? colors.artInk : fill,
                borderRadius: round ? size.w / 2 : 0,
                borderWidth: current ? borderWidths.thick : borderWidths.regular,
              },
              locked && styles.faceLocked,
              selected && !current && styles.faceSelected,
              pressed && !locked && styles.pressed,
            ]}
          >
            <OnColor value={onColorFace}>
              <View style={kind === 'challenge' ? styles.unrotate : null}>
                {kind === 'master' ? <Text style={[styles.masterTag, locked && styles.textLocked]}>MASTER</Text> : null}
                <Text
                  style={[
                    styles.number,
                    current && styles.numberCurrent,
                    kind === 'master' && styles.numberMaster,
                    kind === 'bonus' && styles.numberBonus,
                    locked && styles.textLocked,
                  ]}
                >
                  {kind === 'bonus' ? 'B' : node.levelId}
                </Text>
              </View>
            </OnColor>
            {kind === 'master' ? <View pointerEvents="none" style={[styles.masterInner, locked && styles.masterInnerLocked]} /> : null}
            {state === 'perfect' && kind !== 'challenge' ? <PerfectCorner celebration={celebration} reducedMotion={reducedMotion} /> : null}
          </View>
          {locked ? <View style={styles.lockNotch}><View style={styles.keyhole} /></View> : null}
          {(state === 'completed' || state === 'perfect') && kind !== 'challenge' ? (
            <StarNotches stars={node.stars} width={size.w} celebration={celebration} reducedMotion={reducedMotion} />
          ) : null}
        </Animated.View>
      )}
    </Pressable>
  );
}

function StarNotches({
  stars,
  width,
  celebration,
  reducedMotion,
}: {
  stars: number;
  width: number;
  celebration: TileCelebration | null;
  reducedMotion: boolean;
}) {
  const notch = Math.min(13, width / 5);
  return (
    <View pointerEvents="none" style={[styles.notches, { width }]}>
      {[0, 1, 2].map((i) => (
        <Notch
          key={i}
          earned={i < stars}
          size={notch}
          dropDelay={celebration && i >= celebration.fromStars && i < stars && !reducedMotion ? celebration.delayMs + (i - celebration.fromStars) * 120 : null}
        />
      ))}
    </View>
  );
}

function Notch({ earned, size, dropDelay }: { earned: boolean; size: number; dropDelay: number | null }) {
  if (dropDelay === null) {
    return <View style={[styles.notchSlot, { width: size, height: size * 0.65 }]}>{earned ? <View style={styles.notchStar} /> : null}</View>;
  }
  return <DroppingNotch earned={earned} size={size} dropDelay={dropDelay} />;
}

function DroppingNotch({ earned, size, dropDelay }: { earned: boolean; size: number; dropDelay: number }) {
  const drop = useSharedValue(0);
  useEffect(() => {
    drop.value = withDelay(dropDelay, withSpring(1, { damping: 9, stiffness: 240 }));
  }, [dropDelay, drop]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, drop.value * 2),
    transform: [{ translateY: (1 - drop.value) * -18 }, { scale: 0.6 + drop.value * 0.4 }],
  }));
  return (
    <View style={[styles.notchSlot, { width: size, height: size * 0.65 }]}>
      {earned ? <Animated.View style={[styles.notchStar, style]} /> : null}
    </View>
  );
}

function PerfectCorner({ celebration, reducedMotion }: { celebration: TileCelebration | null; reducedMotion: boolean }) {
  if (!celebration || celebration.fromStars >= 3 || reducedMotion) {
    return (
      <View pointerEvents="none" style={styles.corner}>
        <CornerGlyph />
      </View>
    );
  }
  return <FoldingCorner delayMs={celebration.delayMs} />;
}

function CornerGlyph() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path d="M0 0 H18 V18 Z" fill={palette.yellow} stroke={colors.artInk} strokeWidth={2.5} strokeLinejoin="round" />
    </Svg>
  );
}

function FoldingCorner({ delayMs }: { delayMs: number }) {
  const fold = useSharedValue(0);
  useEffect(() => {
    fold.value = withDelay(delayMs + 400, withSpring(1, { damping: 7, stiffness: 260 }));
  }, [delayMs, fold]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: fold.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.corner, style]}>
      <CornerGlyph />
    </Animated.View>
  );
}

export function sizeFor(node: MapNode): { w: number; h: number } {
  if (node.kind === 'master') return { w: TILE.masterW, h: TILE.masterH };
  if (node.kind === 'bonus') return { w: TILE.bonus, h: TILE.bonus };
  if (node.kind === 'challenge') return { w: TILE.challenge, h: TILE.challenge };
  return node.state === 'current' ? { w: TILE.current, h: TILE.current } : { w: TILE.regular, h: TILE.regular };
}

function labelFor(node: MapNode): string {
  const name = node.kind === 'master' ? `Master level ${node.levelId}` : node.kind === 'challenge' ? `Challenge level ${node.levelId}` : node.kind === 'bonus' ? 'Bonus level' : `Level ${node.levelId}`;
  if (node.state === 'locked') return `${name}, locked`;
  if (node.state === 'current') return `${name}, play next`;
  if (node.state === 'completed' || node.state === 'perfect') return `${name}, ${node.stars} stars`;
  return name;
}

const styles = themed(() => StyleSheet.create({
  abs: { position: 'absolute', left: 0, top: 0 },
  face: { alignItems: 'center', justifyContent: 'center', borderColor: colors.ink },
  faceLocked: { borderStyle: 'dashed', borderColor: withAlpha(colors.ink, 0.35) },
  faceSelected: { borderColor: colors.info },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  unrotate: { transform: [{ rotate: '-45deg' }] },
  number: { fontSize: 22, fontWeight: fontWeights.heavy, color: colors.ink, fontVariant: ['tabular-nums'] },
  numberCurrent: { fontSize: 28 },
  numberMaster: { fontSize: 20, color: palette.cream, textAlign: 'center' },
  numberBonus: { fontSize: 18 },
  textLocked: { color: withAlpha(colors.ink, 0.35) },
  masterTag: { fontSize: 10, fontWeight: fontWeights.heavy, color: palette.yellow, letterSpacing: 1.5, textAlign: 'center' },
  masterInner: {
    position: 'absolute',
    left: 6,
    top: 6,
    right: 6,
    bottom: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: palette.cream,
  },
  masterInnerLocked: { borderColor: withAlpha(palette.cream, 0.4) },
  lockNotch: {
    position: 'absolute',
    top: -7,
    right: 6,
    width: 18,
    height: 14,
    backgroundColor: withAlpha(colors.ink, 0.55),
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyhole: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.paper },
  notches: { position: 'absolute', top: -5, left: 0, flexDirection: 'row', justifyContent: 'center', gap: 3 },
  notchSlot: { borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.paper, overflow: 'visible' },
  notchStar: { ...StyleSheet.absoluteFillObject, backgroundColor: palette.yellow },
  corner: { position: 'absolute', top: -1.5, right: -1.5 },
}));
