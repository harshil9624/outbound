import { memo } from 'react';
import { G, Rect } from 'react-native-svg';
import type { BoardLayout } from '@/game/layout/boardLayout';
import { colors } from '@/theme';

/**
 * Checkerboard of cells: makes rows and columns easy to follow when tracing an exit lane,
 * without hinting at which lanes are clear.
 */
export const BoardGrid = memo(function BoardGrid({ layout }: { layout: BoardLayout }) {
  const { cellSize: cs, padding } = layout;
  const cells = [];
  for (let y = 0; y < layout.rows; y++) {
    for (let x = 0; x < layout.columns; x++) {
      if ((x + y) % 2 === 0) continue;
      cells.push(<Rect key={`${x},${y}`} x={padding + x * cs} y={padding + y * cs} width={cs} height={cs} fill={colors.boardAlt} />);
    }
  }
  return <G>{cells}</G>;
});
