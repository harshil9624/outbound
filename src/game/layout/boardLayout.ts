import type { Point } from '../../types/geometry';
import { BOARD_PADDING_CELLS, MAX_CELL_SIZE } from '../../constants/board';

/** Pixel layout of a board. Pure math — shared by rendering and hit testing. */
export interface BoardLayout {
  columns: number;
  rows: number;
  cellSize: number;
  padding: number;
  width: number;
  height: number;
}

export function computeBoardLayout(params: {
  availableWidth: number;
  availableHeight: number;
  columns: number;
  rows: number;
  paddingCells?: number;
  maxCellSize?: number;
}): BoardLayout {
  const { availableWidth, availableHeight, columns, rows } = params;
  const pad = params.paddingCells ?? BOARD_PADDING_CELLS;
  const maxCell = params.maxCellSize ?? MAX_CELL_SIZE;
  const fit = Math.min(availableWidth / (columns + 2 * pad), availableHeight / (rows + 2 * pad));
  const cellSize = Math.max(1, Math.floor(Math.min(fit, maxCell)));
  const padding = Math.round(cellSize * pad);
  return {
    columns,
    rows,
    cellSize,
    padding,
    width: cellSize * columns + padding * 2,
    height: cellSize * rows + padding * 2,
  };
}

/** Center of a grid cell in board pixels. */
export function cellCenterPx(layout: BoardLayout, p: Point): Point {
  return {
    x: layout.padding + (p.x + 0.5) * layout.cellSize,
    y: layout.padding + (p.y + 0.5) * layout.cellSize,
  };
}

/** Board pixels → continuous grid units where integer values are cell centers. */
export function pxToGrid(layout: BoardLayout, px: number, py: number): Point {
  return {
    x: (px - layout.padding) / layout.cellSize - 0.5,
    y: (py - layout.padding) / layout.cellSize - 0.5,
  };
}
