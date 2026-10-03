import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg from 'react-native-svg';
import type { GameState } from '@/types';
import type { BumpFeedback } from '@/store/gameStore';
import { buildOccupancy } from '@/game/engine/occupancy';
import { computeBoardLayout } from '@/game/layout/boardLayout';
import { hitTestArrow } from '@/game/layout/hitTest';
import { borderWidths, colors, shadowOffsets } from '@/theme';
import { HardShadow } from '@/components/ui/HardShadow';
import { ArrowPath } from './ArrowPath';
import { BoardGrid } from './BoardGrid';

interface GameBoardProps {
  game: GameState;
  exitingIds: string[];
  hintArrowId: string | null;
  bump: BumpFeedback | null;
  reducedMotion: boolean;
  interactive: boolean;
  onTapArrow: (arrowId: string) => void;
  onExitComplete: (arrowId: string) => void;
}

const FRAME = borderWidths.thick * 2 + shadowOffsets.md;

/**
 * Sizes itself from the space its parent gives it (onLayout), so it fits any phone.
 * One Pressable receives every tap; hitTestArrow decides which arrow it was.
 * No per-arrow touch views → no overlapping invisible hit areas.
 */
function GameBoardComponent({
  game,
  exitingIds,
  hintArrowId,
  bump,
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
            availableHeight: space.h - FRAME,
            columns: game.boardWidth,
            rows: game.boardHeight,
          })
        : null,
    [space, game.boardWidth, game.boardHeight],
  );

  const occupancy = useMemo(() => buildOccupancy(game), [game.arrows, game.remainingIds]);

  const visibleIds = useMemo(() => {
    const exiting = new Set(exitingIds);
    const remaining = new Set(game.remainingIds);
    const still = game.arrowOrder.filter((id) => remaining.has(id));
    // Exiting arrows draw on top so they slide over the board cleanly.
    return [...still, ...game.arrowOrder.filter((id) => exiting.has(id))];
  }, [game.arrowOrder, game.remainingIds, exitingIds]);

  const exitingSet = useMemo(() => new Set(exitingIds), [exitingIds]);

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
      {layout ? (
        <HardShadow size="md">
          <View style={styles.frame}>
            <Pressable
              onPress={handlePress}
              style={{ width: layout.width, height: layout.height }}
              accessibilityLabel="Puzzle board"
            >
              <Svg width={layout.width} height={layout.height} pointerEvents="none">
                <BoardGrid layout={layout} />
                {visibleIds.map((id) => (
                  <ArrowPath
                    key={id}
                    arrow={game.arrows[id]}
                    layout={layout}
                    exiting={exitingSet.has(id)}
                    hinted={hintArrowId === id}
                    bumpToken={bump?.arrowId === id ? bump.token : 0}
                    flashToken={bump?.blockerId === id ? bump.token : 0}
                    reducedMotion={reducedMotion}
                    onExitComplete={onExitComplete}
                  />
                ))}
              </Svg>
            </Pressable>
          </View>
        </HardShadow>
      ) : null}
    </View>
  );
}

export const GameBoard = memo(GameBoardComponent);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    borderWidth: borderWidths.thick,
    borderColor: colors.ink,
    backgroundColor: colors.board,
    overflow: 'hidden',
  },
});
