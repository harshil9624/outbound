import { memo } from 'react';
import { Circle, G } from 'react-native-svg';
import { cellCenterPx, type BoardLayout } from '@/game/layout/boardLayout';
import { colors } from '@/theme';

/** Cell-center dots: a quiet guide that shows where arrows can travel. */
export const BoardGrid = memo(function BoardGrid({ layout }: { layout: BoardLayout }) {
  const r = Math.max(1.5, layout.cellSize * 0.05);
  const dots = [];
  for (let y = 0; y < layout.rows; y++) {
    for (let x = 0; x < layout.columns; x++) {
      const c = cellCenterPx(layout, { x, y });
      dots.push(<Circle key={`${x},${y}`} cx={c.x} cy={c.y} r={r} fill={colors.gridDot} />);
    }
  }
  return <G>{dots}</G>;
});
