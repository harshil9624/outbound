import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { Text } from '@/components/ui/Text';
import Svg from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { GameState } from '@/types';
import type { BumpFeedback } from '@/store/gameStore';
import { buildOccupancy } from '@/game/engine/occupancy';
import { cellCenterPx, computeBoardLayout } from '@/game/layout/boardLayout';
import { hitTestArrow } from '@/game/layout/hitTest';
import { borderWidths, colors, palette, radii, shadowOffsets, spacing, textStyles, themed } from '@/theme';
import { HardShadow } from '@/components/ui/HardShadow';
import { BOARD_ANIMALS, type FaceAnimal } from '@/constants/animals';
import { ArrowFace, StaticArrowFace } from './ArrowFace';
import { ArrowPath, StaticArrowPath, createArrowMotion, type ArrowMotion } from './ArrowPath';
import { BoardGrid } from './BoardGrid';
import { CoachHand } from './CoachHand';
import { HammerHover } from './HammerHover';
import { HammerStrike, hammerSize } from './HammerStrike';

interface GameBoardProps {
  game: GameState;
  exitingIds: string[];
  smashingIds: string[];
  hintArrowId: string | null;
  bump: BumpFeedback | null;
  hammerArmed: boolean;
  /** The guided first level: what to say above the board, and the arrow the hand taps. */
  coach: { text: string; targetId: string | null } | null;
  reducedMotion: boolean;
  interactive: boolean;
  onTapArrow: (arrowId: string) => void;
  onExitComplete: (arrowId: string) => void;
}

const FRAME = borderWidths.thick * 2 + shadowOffsets.md;
/** Room above the board for the hammer banner. */
const BANNER_SPACE = 36;

/**
 * Sizes itself from the space its parent gives it (onLayout), so it fits any phone.
 * One Pressable receives every tap; hitTestArrow decides which arrow it was.
 * Arrow bodies are SVG; their animal faces are views layered on top, both driven by
 * one ArrowMotion per arrow.
 */
function GameBoardComponent({
  game,
  exitingIds,
  smashingIds,
  hintArrowId,
  bump,
  hammerArmed,
  coach,
  reducedMotion,
  interactive,
  onTapArrow,
  onExitComplete,
}: GameBoardProps) {
  const coachTarget = coach?.targetId ?? null;
  const [space, setSpace] = useState<{ w: number; h: number } | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSpace((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
  }, []);

  const layout = useMemo(
    () =>
      space
        ? computeBoardLayout({
            availableWidth: space.w - FRAME,
            availableHeight: space.h - FRAME - BANNER_SPACE,
            columns: game.boardWidth,
            rows: game.boardHeight,
          })
        : null,
    [space, game.boardWidth, game.boardHeight],
  );

  const occupancy = useMemo(() => buildOccupancy(game), [game.arrows, game.remainingIds]);

  // Faces are the heaviest part of a board (an SVG canvas each). They mount one frame after the
  // arrows to split the work, but the board stays hidden until both are in, then fades in whole:
  // the player never sees arrows without their faces.
  const hasLayout = layout !== null;
  const [facesReady, setFacesReady] = useState(false);
  useEffect(() => {
    setFacesReady(false);
    if (!hasLayout) return;
    const frame = requestAnimationFrame(() => setFacesReady(true));
    return () => cancelAnimationFrame(frame);
  }, [game.arrowOrder, hasLayout]);

  // One motion per arrow, recreated per level/restart (a new arrowOrder array).
  const motions = useMemo(() => {
    const m: Record<string, ArrowMotion> = {};
    for (const id of game.arrowOrder) m[id] = createArrowMotion();
    return m;
  }, [game.arrowOrder]);

  const animals = useMemo(() => {
    const a: Record<string, FaceAnimal> = {};
    game.arrowOrder.forEach((id, i) => (a[id] = BOARD_ANIMALS[i % BOARD_ANIMALS.length]));
    return a;
  }, [game.arrowOrder]);

  const visibleIds = useMemo(() => {
    const exiting = new Set(exitingIds);
    const remaining = new Set(game.remainingIds);
    const still = game.arrowOrder.filter((id) => remaining.has(id));
    // Exiting arrows draw on top so they slide over the board cleanly.
    return [...still, ...game.arrowOrder.filter((id) => exiting.has(id))];
  }, [game.arrowOrder, game.remainingIds, exitingIds]);

  const exitingSet = useMemo(() => new Set(exitingIds), [exitingIds]);
  const smashingSet = useMemo(() => new Set(smashingIds), [smashingIds]);

  // Arrows start as plain drawings and switch to their animated version the first time they move
  // (exit, bump, blocker flash, hint, hammer), then stay animated. Most arrows sit still until
  // tapped, so a level mounts without hundreds of animation hooks.
  const everLive = useRef(new Set<string>());
  const liveFor = useRef(game.arrowOrder);
  if (liveFor.current !== game.arrowOrder) {
    liveFor.current = game.arrowOrder;
    everLive.current = new Set();
  }
  const isLive = (id: string) => {
    if (
      exitingSet.has(id) ||
      bump?.arrowId === id ||
      bump?.blockerId === id ||
      hintArrowId === id ||
      coachTarget === id
    ) {
      everLive.current.add(id);
    }
    return everLive.current.has(id);
  };

  // Hammer layer coordinates: the board frame's content origin inside this container.
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const onBoardLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, y } = e.nativeEvent.layout;
    const next = { x: x + borderWidths.thick, y: y + borderWidths.thick };
    setOrigin((prev) => (prev && prev.x === next.x && prev.y === next.y ? prev : next));
  }, []);
  const hammer = useMemo(() => {
    if (!layout || !origin || !space) return null;
    const size = hammerSize(layout.cellSize);
    return {
      // Hovers by the board's top-right corner, clear of most arrows.
      hoverX: origin.x + layout.width - size * 0.2,
      hoverY: origin.y + size * 0.55,
      // Flies in from below, roughly where the Hammer button sits.
      belowX: origin.x + layout.width * 0.62,
      belowY: space.h + size * 0.6,
    };
  }, [layout, origin, space]);

  // Hovering hammer while armed. On cancel it flies out; on a strike it hands over instantly.
  const [hoverShown, setHoverShown] = useState(false);
  useEffect(() => {
    if (hammerArmed && !reducedMotion) {
      setHoverShown(true);
      return;
    }
    const t = setTimeout(() => setHoverShown(false), 320);
    return () => clearTimeout(t);
  }, [hammerArmed, reducedMotion]);

  // A strike per smashed arrow, aimed at its head (overlay pixels).
  const [strikes, setStrikes] = useState<{ id: string; x: number; y: number; fromHover: boolean }[]>([]);
  const struck = useRef(new Set<string>());
  useEffect(() => {
    struck.current = new Set();
    setStrikes([]);
  }, [game.arrowOrder]);
  useEffect(() => {
    if (!layout || !origin || reducedMotion) return;
    const fresh = smashingIds.filter((id) => !struck.current.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => struck.current.add(id));
    setStrikes((s) => [
      ...s,
      ...fresh.map((id) => {
        const head = cellCenterPx(layout, game.arrows[id].head);
        return { id, x: origin.x + head.x, y: origin.y + head.y, fromHover: hoverShown };
      }),
    ]);
    setHoverShown(false);
  }, [smashingIds, layout, origin, reducedMotion, game.arrows, hoverShown]);
  // Where the coach's hand taps: the target arrow's head, in overlay pixels.
  const coachArrow = coachTarget ? game.arrows[coachTarget] : undefined;
  const coachPoint = useMemo(() => {
    if (!coachArrow || !layout || !origin) return null;
    const head = cellCenterPx(layout, coachArrow.head);
    return { x: origin.x + head.x, y: origin.y + head.y };
  }, [coachArrow, layout, origin]);

  const endStrike = useCallback((id: string) => setStrikes((s) => s.filter((k) => k.id !== id)), []);

  // Board shudders when the hammer lands.
  const shake = useSharedValue(0);
  const onImpact = useCallback(() => {
    shake.value = withSequence(
      withTiming(7, { duration: 40 }),
      withTiming(-6, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(-2, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shake]);
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = facesReady ? withTiming(1, { duration: reducedMotion ? 0 : 120 }) : 0;
  }, [facesReady, reducedMotion, reveal]);
  const shakeStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateX: shake.value }, { translateY: Math.abs(shake.value) * 0.5 }],
  }));

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (!layout || !interactive) return;
      const { locationX, locationY } = e.nativeEvent;
      const id = hitTestArrow(game, occupancy, layout, locationX, locationY);
      if (id) onTapArrow(id);
    },
    [layout, interactive, game, occupancy, onTapArrow],
  );

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.bannerSlot}>
        {hammerArmed ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>TAP AN ARROW TO SMASH IT!</Text>
          </View>
        ) : coach ? (
          <View style={styles.coachBubble} accessibilityLiveRegion="polite">
            <Text style={styles.coachText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {coach.text}
            </Text>
          </View>
        ) : null}
      </View>
      {layout ? (
        <Animated.View style={shakeStyle} onLayout={onBoardLayout}>
          <HardShadow size="md">
            <View style={[styles.frame, hammerArmed && styles.frameArmed]}>
              <Pressable
                onPress={handlePress}
                style={{ width: layout.width, height: layout.height }}
                accessibilityLabel={hammerArmed ? 'Puzzle board, hammer ready' : 'Puzzle board'}
              >
                <Svg width={layout.width} height={layout.height} pointerEvents="none">
                  <BoardGrid layout={layout} />
                  {visibleIds.map((id) =>
                    !isLive(id) ? (
                      <StaticArrowPath key={id} arrow={game.arrows[id]} layout={layout} />
                    ) : (
                    <ArrowPath
                      key={id}
                      arrow={game.arrows[id]}
                      layout={layout}
                      motion={motions[id]}
                      exiting={exitingSet.has(id)}
                      exitMode={smashingSet.has(id) ? 'smash' : 'slide'}
                      hinted={hintArrowId === id || coachTarget === id}
                      bumpToken={bump?.arrowId === id ? bump.token : 0}
                      flashToken={bump?.blockerId === id ? bump.token : 0}
                      reducedMotion={reducedMotion}
                      onExitComplete={onExitComplete}
                    />
                    ),
                  )}
                </Svg>
                {facesReady && visibleIds.map((id) =>
                  !isLive(id) ? (
                    <StaticArrowFace
                      key={id}
                      arrow={game.arrows[id]}
                      layout={layout}
                      animal={animals[id]}
                      scared={hammerArmed && !exitingSet.has(id)}
                    />
                  ) : (
                  <ArrowFace
                    key={id}
                    arrow={game.arrows[id]}
                    layout={layout}
                    motion={motions[id]}
                    animal={animals[id]}
                    scared={hammerArmed && !exitingSet.has(id)}
                    bumpToken={bump?.arrowId === id ? bump.token : 0}
                    smashing={smashingSet.has(id)}
                    hinted={hintArrowId === id || coachTarget === id}
                    reducedMotion={reducedMotion}
                  />
                  ),
                )}
              </Pressable>
            </View>
          </HardShadow>
        </Animated.View>
      ) : null}
      {/* Above everything and unclipped, so the hammer can fly in from the boost bar. */}
      {layout && hammer ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {hoverShown ? (
            <HammerHover
              x={hammer.hoverX}
              y={hammer.hoverY}
              fromX={hammer.belowX}
              fromY={hammer.belowY}
              cellSize={layout.cellSize}
              visible={hammerArmed}
            />
          ) : null}
          {coachPoint ? <CoachHand x={coachPoint.x} y={coachPoint.y} cellSize={layout.cellSize} reducedMotion={reducedMotion} /> : null}
          {strikes.map((s) => (
            <HammerStrike
              key={s.id}
              targetX={s.x}
              targetY={s.y}
              fromX={s.fromHover ? hammer.hoverX : hammer.belowX}
              fromY={s.fromHover ? hammer.hoverY : hammer.belowY}
              spin={!s.fromHover}
              cellSize={layout.cellSize}
              id={s.id}
              onImpact={onImpact}
              onDone={endStrike}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const GameBoard = memo(GameBoardComponent);

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  bannerSlot: { height: BANNER_SPACE, justifyContent: 'center' },
  banner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
    backgroundColor: colors.danger,
  },
  bannerText: { ...textStyles.label, color: palette.white },
  coachBubble: {
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: borderWidths.regular,
    borderColor: palette.black,
    backgroundColor: palette.yellow,
  },
  coachText: { ...textStyles.label, color: palette.black, textAlign: 'center' },
  frame: {
    borderWidth: borderWidths.thick,
    borderColor: colors.ink,
    backgroundColor: colors.board,
    overflow: 'hidden',
  },
  frameArmed: { borderColor: colors.danger },
}));
