import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { OnColor, Text } from '@/components/ui/Text';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { ChapterLayout, MapNode } from '@/game/journey/types';
import {
  MAP_METRICS,
  between,
  polylineD,
  polylineLengthPx,
  routePx,
  splitAt,
  trimEnd,
  zoneGeometry,
} from '@/game/journey/mapGeometry';
import { arrowColors, borderWidths, colors, fontWeights, palette, spacing, textStyles, themed } from '@/theme';
import { withAlpha } from '@/utils/color';
import type { Point } from '@/types';
import { HEAD_GAP, JourneyHead } from './JourneyHead';
import { JourneyTile, sizeFor, type TileCelebration } from './JourneyTile';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const ROUTE_OUTLINE = 15;
const ROUTE_FILL = 8;
const ROUTE_SHADOW = 4;
const CHECKER = 48;
const FILL_MS = 500;

export interface ZoneCelebration {
  /** Level → stars before the win (stars drop in up to the current value). */
  fromStars: Record<number, number>;
  /** Tile the player just moved on from, and the newly current tile. */
  fromId: number | null;
  toId: number | null;
  /** The player crossed into this chapter: the card stamps in and the head appears at the start. */
  enteredChapter: boolean;
}

interface ChapterZoneProps {
  layout: ChapterLayout;
  nodes: MapNode[];
  chapterNumber: number;
  width: number;
  /** Route continues up out of this zone into the next chapter. */
  exitsTop: boolean;
  /** Whole chapter travelled (the player is in a later chapter). */
  travelledAll: boolean;
  currentId: number | null;
  selectedId: number | null;
  shake: { levelId: number; token: number } | null;
  celebration: ZoneCelebration | null;
  /** More levels for this chapter are still being made. */
  moreSoon: boolean;
  scrollY: SharedValue<number>;
  /** This zone's distance from the bottom of the map. */
  offsetFromBottom: number;
  reducedMotion: boolean;
  /** Build tiles a frame after the board (zones scrolling in), or straight away (zones on open). */
  deferTiles: boolean;
  onPressNode: (node: MapNode) => void;
}

/** One chapter of the Journey: its patch of board, its route, its tiles, its card. */
export const ChapterZone = memo(function ChapterZone({
  layout,
  nodes,
  chapterNumber,
  width,
  exitsTop,
  travelledAll,
  currentId,
  selectedId,
  shake,
  celebration,
  moreSoon,
  scrollY,
  offsetFromBottom,
  reducedMotion,
  deferTiles,
  onPressNode,
}: ChapterZoneProps) {
  const { chapter } = layout;
  const color = arrowColors[chapter.color];
  const geo = useMemo(() => zoneGeometry(layout, width), [layout, width]);
  const route = useMemo(() => routePx(layout, geo, exitsTop), [layout, geo, exitsTop]);
  const spurD = useMemo(() => (layout.spur ? polylineD(layout.spur.map(geo.toPx)) : null), [layout, geo]);

  // A zone scrolling into view builds its board first and its tiles on the next frame, so the
  // work lands as two small frames instead of one long one (the hitch while scrolling up).
  // Decided once, at mount: zones present when the map opens draw tiles at once (no flicker).
  const [tilesReady, setTilesReady] = useState(!deferTiles);
  useEffect(() => {
    if (tilesReady) return;
    const id = requestAnimationFrame(() => setTilesReady(true));
    return () => cancelAnimationFrame(id);
  }, [tilesReady]);
  const fromId = celebration?.fromId ?? null;
  // Travelled part of the route (everything behind the current tile), the leg that fills in after
  // a win, and the head's path. Memoized: a selection or shake must not redraw the board SVG.
  const { animateLeg, staticTravelled, leg, headPath } = useMemo(() => {
    const px = (levelId: number | null) => {
      const n = levelId === null ? undefined : nodes.find((k) => k.levelId === levelId);
      return n ? geo.toPx(n) : null;
    };
    const currentPx = px(currentId);
    const fromPx = px(fromId);
    const animate = !!(fromPx && currentPx && !reducedMotion);
    const travelled = travelledAll ? route : currentPx ? splitAt(route, currentPx).before : [];
    const legPts = animate ? between(route, fromPx!, currentPx!) : [];
    return {
      animateLeg: animate,
      staticTravelled: animate ? splitAt(route, fromPx!).before : travelled,
      leg: legPts,
      headPath: currentPx ? trimEnd(animate ? legPts : travelled, HEAD_GAP) : null,
    };
  }, [nodes, geo, route, currentId, fromId, travelledAll, reducedMotion]);

  // One stable object per celebrating tile; every other tile gets null, so memo holds.
  const tileCelebrations = useMemo(() => {
    const out = new Map<number, TileCelebration>();
    if (!celebration) return out;
    for (const n of nodes) {
      const from = celebration.fromStars[n.levelId];
      const unlocked = n.levelId === celebration.toId;
      if (from === undefined && !unlocked) continue;
      out.set(n.levelId, { fromStars: from ?? n.stars, unlocked, delayMs: unlocked ? 350 + FILL_MS : 200 });
    }
    return out;
  }, [celebration, nodes]);

  return (
    <View style={{ width, height: geo.height }}>
      <ZoneBoard
        chapterId={chapter.id}
        width={width}
        height={geo.height}
        color={color}
        route={route}
        travelled={staticTravelled}
        leg={animateLeg ? leg : null}
        spur={spurD}
      />

      <Decorations width={width} height={geo.height} color={color} scrollY={scrollY} offsetFromBottom={offsetFromBottom} reducedMotion={reducedMotion} />

      <ChapterCard
        number={chapterNumber}
        title={chapter.title}
        lesson={chapter.lesson}
        color={color}
        left={MAP_METRICS.margin + geo.columnWidth * 0.95}
        right={MAP_METRICS.margin}
        stamp={!!celebration?.enteredChapter && !reducedMotion}
      />

      {moreSoon && nodes.length > 0 ? (
        <MoreSoon at={geo.toPx(nodes[nodes.length - 1])} />
      ) : null}

      {tilesReady ? nodes.map((n) => {
        const p = geo.toPx(n);
        const size = sizeFor(n);
        return (
          <View key={n.levelId} style={[styles.tileSlot, { left: p.x - size.w / 2, top: p.y - size.h / 2 }]}>
            <JourneyTile
              node={n}
              color={color}
              selected={n.levelId === selectedId}
              shakeToken={shake?.levelId === n.levelId ? shake.token : 0}
              celebration={tileCelebrations.get(n.levelId) ?? null}
              reducedMotion={reducedMotion}
              onPress={onPressNode}
            />
            {n.state === 'current' ? (
              <View pointerEvents="none" style={[styles.playRow, { top: size.h + 8 }]}>
                <View style={styles.playTab}>
                  <Text style={styles.playText}>PLAY</Text>
                </View>
              </View>
            ) : null}
          </View>
        );
      }) : null}

      {tilesReady && headPath && headPath.length > 0 ? (
        <JourneyHead
          animal={chapter.mascot}
          color={color}
          path={headPath}
          travel={animateLeg}
          delayMs={celebration ? 250 : 120}
          reducedMotion={reducedMotion}
        />
      ) : null}
    </View>
  );
});

/**
 * The zone's static drawing: checkerboard, route outline, travelled colour. Its own memo so it
 * only redraws when the route changes, never on a tap or a focus change.
 */
const ZoneBoard = memo(function ZoneBoard({
  chapterId,
  width,
  height,
  color,
  route,
  travelled,
  leg,
  spur,
}: {
  chapterId: string;
  width: number;
  height: number;
  color: string;
  route: Point[];
  travelled: Point[];
  leg: Point[] | null;
  spur: string | null;
}) {
  const routeD = useMemo(() => polylineD(route), [route]);
  const travelledD = useMemo(() => (travelled.length > 1 ? polylineD(travelled) : null), [travelled]);
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id={`chk-${chapterId}`} width={CHECKER * 2} height={CHECKER * 2} patternUnits="userSpaceOnUse">
          <Rect width={CHECKER} height={CHECKER} fill={withAlpha(color, 0.08)} />
          <Rect x={CHECKER} y={CHECKER} width={CHECKER} height={CHECKER} fill={withAlpha(color, 0.08)} />
        </Pattern>
      </Defs>
      <Rect width={width} height={height} fill={colors.board} />
      <Rect width={width} height={height} fill={`url(#chk-${chapterId})`} />
      {route.length > 1 ? (
        <>
          <Path d={routeD} transform={`translate(${ROUTE_SHADOW} ${ROUTE_SHADOW})`} {...routeStroke(colors.artInk, ROUTE_OUTLINE)} />
          <Path d={routeD} {...routeStroke(colors.artInk, ROUTE_OUTLINE)} />
          <Path d={routeD} {...routeStroke(palette.cream, ROUTE_FILL)} />
          {travelledD ? <Path d={travelledD} {...routeStroke(color, ROUTE_FILL)} /> : null}
          {leg ? <FillingLeg points={leg} color={color} /> : null}
        </>
      ) : null}
      {spur ? <Path d={spur} stroke={colors.ink} strokeWidth={3} strokeDasharray="2 7" strokeLinecap="round" fill="none" /> : null}
    </Svg>
  );
});

function routeStroke(stroke: string, strokeWidth: number) {
  return { stroke, strokeWidth, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
}

/** Colour flowing along the route from the tile just finished to the newly unlocked one. */
function FillingLeg({ points, color }: { points: { x: number; y: number }[]; color: string }) {
  const len = polylineLengthPx(points);
  const offset = useSharedValue(len);
  useEffect(() => {
    offset.value = withDelay(250, withTiming(0, { duration: FILL_MS, easing: Easing.inOut(Easing.cubic) }));
  }, [offset, len]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  return (
    <AnimatedPath
      d={polylineD(points)}
      {...routeStroke(color, ROUTE_FILL)}
      strokeDasharray={[len, len]}
      animatedProps={props}
    />
  );
}

const ChapterCard = memo(function ChapterCard({
  number,
  title,
  lesson,
  color,
  left,
  right,
  stamp,
}: {
  number: number;
  title: string;
  lesson: string;
  color: string;
  left: number;
  right: number;
  stamp: boolean;
}) {
  const s = useSharedValue(stamp ? 0 : 1);
  useEffect(() => {
    if (!stamp) return;
    s.value = withDelay(150, withSpring(1, { damping: 9, stiffness: 200 }));
  }, [stamp, s]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, s.value * 2),
    transform: [{ scale: 1.6 - 0.6 * s.value }, { rotate: '-1.5deg' }],
  }));
  return (
    <Animated.View style={[styles.card, { left, right }, style]}>
      <View style={styles.cardShadow} />
      <View style={styles.cardFace}>
        <View style={[styles.cardBadge, { backgroundColor: color }]}>
          <OnColor>
            <Text style={styles.cardBadgeText}>{number}</Text>
          </OnColor>
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardEyebrow}>CHAPTER {number}</Text>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.cardLesson} numberOfLines={2}>
            {lesson}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
});

const MoreSoon = memo(function MoreSoon({ at }: { at: { x: number; y: number } }) {
  return (
    <View pointerEvents="none" style={[styles.soon, { top: at.y - 92 }]}>
      <Text style={styles.soonText}>MORE LEVELS ON THE WAY</Text>
    </View>
  );
});

/** A few outlined arrow fragments drifting slower than the map (subtle parallax). */
/** Each fragment fits a 28-unit box; the box adds room for the stroke. */
const DECOR_BOX = 34;
const DECOR = [
  { d: 'M0 30 H22 V0', x: 0.86, y: 0.3 },
  { d: 'M0 0 V24 H26 V6', x: 0.08, y: 0.62 },
  { d: 'M0 14 L14 0 L28 14', x: 0.9, y: 0.82 },
];

const Decorations = memo(function Decorations({
  width,
  height,
  color,
  scrollY,
  offsetFromBottom,
  reducedMotion,
}: {
  width: number;
  height: number;
  color: string;
  scrollY: SharedValue<number>;
  offsetFromBottom: number;
  reducedMotion: boolean;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: reducedMotion ? 0 : Math.max(-60, Math.min(60, (scrollY.value - offsetFromBottom) * 0.12)) }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {/* A small SVG per fragment: one zone-sized SVG for three short strokes was a big draw. */}
      {DECOR.map((dcr, i) => (
        <Svg
          key={i}
          width={DECOR_BOX}
          height={DECOR_BOX}
          viewBox={`-3 -3 ${DECOR_BOX} ${DECOR_BOX}`}
          style={[styles.decor, { left: dcr.x * width - 14 - 3, top: dcr.y * height - 3 }]}
        >
          <Path d={dcr.d} stroke={withAlpha(color, 0.45)} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      ))}
    </Animated.View>
  );
});

const styles = themed(() => StyleSheet.create({
  tileSlot: { position: 'absolute', alignItems: 'center' },
  decor: { position: 'absolute' },
  playRow: { position: 'absolute', left: -20, right: -20, alignItems: 'center' },
  playTab: { backgroundColor: colors.ink, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  playText: { ...textStyles.caption, color: colors.inverseInk, fontWeight: fontWeights.heavy, letterSpacing: 1.5 },
  card: { position: 'absolute', bottom: 22 },
  cardShadow: { position: 'absolute', left: 5, top: 5, right: -5, bottom: -5, backgroundColor: colors.shadow },
  cardFace: {
    minHeight: 84,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
  },
  cardBadge: {
    width: 44,
    height: 44,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeText: { fontSize: 22, fontWeight: fontWeights.heavy, color: colors.ink },
  cardText: { flex: 1, minWidth: 0 },
  cardEyebrow: { ...textStyles.caption, color: colors.inkMuted, letterSpacing: 1 },
  cardTitle: { fontSize: 18, fontWeight: fontWeights.heavy, color: colors.ink },
  cardLesson: { fontSize: 11, color: colors.inkMuted },
  soon: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  soonText: {
    ...textStyles.caption,
    color: colors.inkMuted,
    letterSpacing: 1.5,
    backgroundColor: colors.paper,
    borderWidth: borderWidths.thin,
    borderColor: withAlpha(colors.ink, 0.35),
    borderStyle: 'dashed',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
}));
