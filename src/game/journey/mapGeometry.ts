import type { Point } from '../../types/geometry';
import { MAP_COLUMNS } from './layout';
import type { ChapterLayout, GridPoint } from './types';

/** Journey map metrics in dp (LEVEL_DESIGN design spec §18). */
export const MAP_METRICS = {
  /** Side margin: route columns sit inside it. */
  margin: 24,
  /** Vertical distance between grid rows. */
  rowHeight: 96,
  /** Space at the bottom of each zone for the chapter card. */
  cardSpace: 170,
  topPadding: 24,
  /** Height of the "coming soon" teaser zone. */
  teaserHeight: 170,
} as const;

export interface ZoneGeometry {
  width: number;
  height: number;
  columnWidth: number;
  /** Grid point → zone pixels (y measured from the zone's top edge). */
  toPx: (p: GridPoint) => Point;
}

export function zoneGeometry(layout: ChapterLayout, width: number): ZoneGeometry {
  const { margin, rowHeight, cardSpace, topPadding } = MAP_METRICS;
  const columnWidth = (width - margin * 2) / MAP_COLUMNS;
  const height = Math.round(cardSpace + layout.rows * rowHeight + topPadding);
  return {
    width,
    height,
    columnWidth,
    toPx: (p) => ({ x: margin + (p.x + 0.5) * columnWidth, y: height - (cardSpace + p.y * rowHeight) }),
  };
}

/** The route in pixels, extended to the zone's bottom edge (and top edge when it leaves the zone). */
export function routePx(layout: ChapterLayout, geo: ZoneGeometry, exitsTop: boolean): Point[] {
  const pts = layout.route.map(geo.toPx);
  if (pts.length === 0) return pts;
  const out = [{ x: pts[0].x, y: geo.height }, ...pts];
  if (exitsTop) out.push({ x: pts[pts.length - 1].x, y: 0 });
  return out;
}

const same = (a: Point, b: Point) => Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;

/** Index of the segment [i-1, i] that contains `p`, or -1. */
function segmentContaining(pts: readonly Point[], p: Point): number {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const inX = p.x >= Math.min(a.x, b.x) - 0.01 && p.x <= Math.max(a.x, b.x) + 0.01;
    const inY = p.y >= Math.min(a.y, b.y) - 0.01 && p.y <= Math.max(a.y, b.y) + 0.01;
    if (inX && inY && (Math.abs(a.x - b.x) < 0.01 || Math.abs(a.y - b.y) < 0.01)) return i;
  }
  return -1;
}

/** Splits a polyline at a point on it: [start … p] and [p … end]. */
export function splitAt(pts: readonly Point[], p: Point): { before: Point[]; after: Point[] } {
  const i = segmentContaining(pts, p);
  if (i < 0) return { before: [...pts], after: [] };
  const before = [...pts.slice(0, i), p].filter((q, k, arr) => k === 0 || !same(q, arr[k - 1]));
  const after = [p, ...pts.slice(i)].filter((q, k, arr) => k === 0 || !same(q, arr[k - 1]));
  return { before, after };
}

/** The part of the polyline between two points on it (a before b). */
export function between(pts: readonly Point[], a: Point, b: Point): Point[] {
  return splitAt(splitAt(pts, a).after, b).before;
}

export function polylineLengthPx(pts: readonly Point[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
  return len;
}

/** Point at distance `d` along an orthogonal polyline. Runs on the UI thread during animation. */
export function pointAlong(xs: readonly number[], ys: readonly number[], d: number): Point {
  'worklet';
  let left = d;
  for (let i = 1; i < xs.length; i++) {
    const seg = Math.abs(xs[i] - xs[i - 1]) + Math.abs(ys[i] - ys[i - 1]);
    if (left <= seg || i === xs.length - 1) {
      const t = seg === 0 ? 1 : Math.min(1, left / seg);
      return { x: xs[i - 1] + (xs[i] - xs[i - 1]) * t, y: ys[i - 1] + (ys[i] - ys[i - 1]) * t };
    }
    left -= seg;
  }
  return { x: xs[0], y: ys[0] };
}

/** Unit direction of travel arriving at the end of a polyline. */
export function arrivalDirection(pts: readonly Point[]): Point {
  for (let i = pts.length - 1; i > 0; i--) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    if (dx !== 0 || dy !== 0) return { x: Math.sign(dx), y: Math.sign(dy) };
  }
  return { x: 0, y: -1 };
}

export function polylineD(pts: readonly Point[]): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

/** The polyline with its last `gap` dp removed (used to rest the head just before a tile). */
export function trimEnd(pts: readonly Point[], gap: number): Point[] {
  const total = polylineLengthPx(pts);
  if (total <= gap || pts.length < 2) return pts.slice(0, 1);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const end = pointAlong(xs, ys, total - gap);
  return splitAt(pts, end).before;
}
