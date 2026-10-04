import type { Point } from '../../types/geometry';
import type { BoardArrow } from '../../types/game';
import {
  ARROW_BODY_WIDTH,
  ARROW_HEAD_SIZE,
  ARROW_HIGHLIGHT_OFFSET,
  ARROW_HIGHLIGHT_WIDTH,
  ARROW_OUTLINE_WIDTH,
  ARROW_SHADOW_OFFSET,
} from '../../constants/board';
import { DIRECTION_VECTORS } from '../engine/geometry';
import { cellCenterPx, type BoardLayout } from './boardLayout';

/**
 * Everything the renderer needs to draw and animate one arrow.
 *
 * Exit animation model ("snake slide"):
 *   the body path is extended straight out of the board from the head.
 *   A dash exactly `bodyLength` long is shifted forward by `travel` px
 *   (strokeDashoffset = -travel), so the body follows its own bends,
 *   while the head (the animal face) simply translates `travel` px along `direction`.
 */
export interface ArrowRenderGeometry {
  pathD: string;
  /** Same path nudged down-right: the solid ink drop shadow. */
  shadowD: string;
  /** Same path nudged up-left: the glossy highlight stripe. */
  highlightD: string;
  dashArray: [number, number];
  bodyLength: number;
  exitDistance: number;
  head: Point;
  dir: Point;
  headSize: number;
  bodyWidth: number;
  outlineWidth: number;
  borderWidth: number;
  highlightWidth: number;
}

export function polylineLength(pts: readonly Point[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
  }
  return len;
}

export function polylineToPathD(pts: readonly Point[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
}

function distanceToBoardEdge(layout: BoardLayout, head: Point, dir: Point): number {
  if (dir.x > 0) return layout.width - head.x;
  if (dir.x < 0) return head.x;
  if (dir.y > 0) return layout.height - head.y;
  return head.y;
}

export function buildArrowRenderGeometry(arrow: BoardArrow, layout: BoardLayout): ArrowRenderGeometry {
  const cs = layout.cellSize;
  const pts = arrow.points.map((p) => cellCenterPx(layout, p));
  const head = pts[pts.length - 1];
  const dir = DIRECTION_VECTORS[arrow.direction];
  const headSize = cs * ARROW_HEAD_SIZE;
  const bodyLength = polylineLength(pts);
  const bodyWidth = cs * ARROW_BODY_WIDTH;
  const borderWidth = Math.max(2, cs * ARROW_OUTLINE_WIDTH);

  // Far enough that the tail has fully left the board.
  const exitDistance = distanceToBoardEdge(layout, head, dir) + bodyLength + headSize + bodyWidth;
  const exitPoint = { x: head.x + dir.x * exitDistance, y: head.y + dir.y * exitDistance };
  const full = [...pts, exitPoint];
  const shift = (d: number) => full.map((p) => ({ x: p.x + d, y: p.y + d }));

  return {
    pathD: polylineToPathD(full),
    shadowD: polylineToPathD(shift(cs * ARROW_SHADOW_OFFSET)),
    highlightD: polylineToPathD(shift(-cs * ARROW_HIGHLIGHT_OFFSET)),
    dashArray: [bodyLength, exitDistance + bodyLength + cs],
    bodyLength,
    exitDistance,
    head,
    dir,
    headSize,
    bodyWidth,
    outlineWidth: bodyWidth + borderWidth * 2,
    borderWidth,
    highlightWidth: cs * ARROW_HIGHLIGHT_WIDTH,
  };
}
