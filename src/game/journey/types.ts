import type { Animal } from '../../constants/animals';
import type { ShapeFamily } from '../analysis/arrowShape';
import type { ArrowColor } from '../../types/level';
import type { StarCount } from '../../types/game';

/** How a chapter's route snakes up the map: each mirrors the chapter's signature arrow shape. */
export type RouteStyle = 'runs' | 'queue' | 'cross' | 'hairpin' | 'stairs' | 'longshot' | 'tangle' | 'gridlock';

export type SpecialKind = 'challenge' | 'master' | 'bonus';

/** Authored, one per chapter. Adding a chapter is adding one of these. */
export interface ChapterDef {
  id: string;
  title: string;
  /** One line shown on the chapter card: what the player learns here. */
  lesson: string;
  color: ArrowColor;
  mascot: Animal;
  signature: ShapeFamily;
  routeStyle: RouteStyle;
  /** Main-route levels, in play order. The last one is the master gate. */
  levelIds: number[];
  /** Main-route levels with a special look (the last level is always the master gate). */
  challengeIds?: number[];
  /** Optional side level, unlocked by collecting stars in this chapter. Never blocks progress. */
  bonus?: { levelId: number; starsRequired: number };
}

export type NodeState = 'locked' | 'available' | 'current' | 'completed' | 'perfect';
export type NodeKind = 'level' | SpecialKind;

/** A point on the chapter grid: x = column (0–4), y = rows up from the zone floor. */
export interface GridPoint {
  x: number;
  y: number;
}

export interface LayoutNode extends GridPoint {
  levelId: number;
  kind: NodeKind;
  /** Index along the main route (bonus nodes: -1). */
  index: number;
}

/** Pure geometry for a chapter, independent of the player's progress. */
export interface ChapterLayout {
  chapter: ChapterDef;
  nodes: LayoutNode[];
  /** Orthogonal polyline through every main-route node, tail to head. */
  route: GridPoint[];
  /** Short spur from the master gate to the bonus node, if any. */
  spur: GridPoint[] | null;
  /** Height in grid rows (top of the highest node). */
  rows: number;
}

export interface MapNode extends LayoutNode {
  state: NodeState;
  stars: StarCount | 0;
}

export interface PlayerProgress {
  unlockedLevel: number;
  completedLevels: readonly number[];
  stars: Readonly<Record<number, StarCount>>;
}
