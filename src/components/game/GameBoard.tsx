import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { GameState } from '@/types';
import type { BumpFeedback } from '@/store/gameStore';
import { buildOccupancy } from '@/game/engine/occupancy';
import { cellCenterPx, computeBoardLayout } from '@/game/layout/boardLayout';
import { hitTestArrow } from '@/game/layout/hitTest';
import { borderWidths, colors, radii, shadowOffsets, spacing, textStyles } from '@/theme';
import { HardShadow } from '@/components/ui/HardShadow';
import { ANIMALS } from './AnimalFace';
import { ArrowFace } from './ArrowFace';
import { ArrowPath, createArrowMotion, type ArrowMotion } from './ArrowPath';
import { BoardGrid } from './BoardGrid';
import { HammerHover } from './HammerHover';
import { HammerStrike, hammerSize } from './HammerStrike';

interface GameBoardProps {
  game: GameState;
  exitingIds: string[];
  smashingIds: string[];
  hintArrowId: string | null;
  bump: BumpFeedback | null;
  hammerArmed: boolean;
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
  reducedMotion,
  interactive,
  onTapArrow,
  onExitComplete,
}: GameBoardProps) {
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

  // One motion per arrow, recreated per level/restart (a new arrowOrder array).
  const motions = useMemo(() => {
    const m: Record<string, ArrowMotion> = {};
    for (const id of game.arrowOrder) m[id] = createArrowMotion();
    return m;
  }, [game.arrowOrder]);

  const animals = useMemo(() => {
    const a: Record<string, (typeof ANIMALS)[number]> = {};
    game.arrowOrder.forEach((id, i) => (a[id] = ANIMALS[i % ANIMALS.length]));
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

  // Hammer layer coordinates: the board frame's content origin inside this container.
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const onBoardLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, y } = e.nativeEvent.layout;
    setOrigin({ x: x + borderWidths.thick, y: y + borderWidths.thick });
  }, []);
  const hammer =
    layout && origin && space
      ? (() => {
          const size = hammerSize(layout.cellSize);
          return {
            // Hovers by the board's top-right corner, clear of most arrows.
            hoverX: origin.x + layout.width - size * 0.2,
            hoverY: origin.y + size * 0.55,
            // Flies in from below, roughly where the Hammer button sits.
            belowX: origin.x + layout.width * 0.62,
            belowY: space.h + size * 0.6,
          };
        })()
      : null;

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
  const shakeStyle = useAnimatedStyle(() => ({
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
                  {visibleIds.map((id) => (
                    <ArrowPath
                      key={id}
                      arrow={game.arrows[id]}
                      layout={layout}
                      motion={motions[id]}
                      exiting={exitingSet.has(id)}
                      exitMode={smashingSet.has(id) ? 'smash' : 'slide'}
                      hinted={hintArrowId === id}
                      bumpToken={bump?.arrowId === id ? bump.token : 0}
                      flashToken={bump?.blockerId === id ? bump.token : 0}
                      reducedMotion={reducedMotion}
                      onExitComplete={onExitComplete}
                    />
                  ))}
                </Svg>
                {visibleIds.map((id) => (
                  <ArrowFace
                    key={id}
                    arrow={game.arrows[id]}
                    layout={layout}
                    motion={motions[id]}
                    animal={animals[id]}
                    scared={hammerArmed && !exitingSet.has(id)}
                    bumpToken={bump?.arrowId === id ? bump.token : 0}
                    smashing={smashingSet.has(id)}
                    hinted={hintArrowId === id}
                    reducedMotion={reducedMotion}
                  />
                ))}
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
          {strikes.map((s) => (
            <HammerStrike
              key={s.id}
              targetX={s.x}
              targetY={s.y}
              fromX={s.fromHover ? hammer.hoverX : hammer.belowX}
              fromY={s.fromHover ? hammer.hoverY : hammer.belowY}
              spin={!s.fromHover}
              cellSize={layout.cellSize}
              onImpact={onImpact}
              onDone={() => endStrike(s.id)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const GameBoard = memo(GameBoardComponent);

const styles = StyleSheet.create({
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
  bannerText: { ...textStyles.label, color: colors.surface },
  frame: {
    borderWidth: borderWidths.thick,
    borderColor: colors.ink,
    backgroundColor: colors.board,
    overflow: 'hidden',
  },
  frameArmed: { borderColor: colors.danger },
});
