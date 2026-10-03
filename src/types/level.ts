import type { Direction, Point } from './geometry';

/** Theme token, not a hex value — levels stay valid when the palette changes. */
export type ArrowColor = 'yellow' | 'blue' | 'pink' | 'green' | 'orange' | 'purple' | 'red';

export type Difficulty = 'easy' | 'normal' | 'hard';

/**
 * Reserved for future mechanics (locked arrows, bombs, one-way gates…).
 * The engine only implements 'standard' today; new kinds are additive.
 */
export type ArrowKind = 'standard';

/**
 * One complete puzzle object: a continuous orthogonal path through cell centers.
 * `points` are the path's vertices (start, every bend, end). The last point is the head.
 */
export interface ArrowPath {
  id: string;
  points: Point[];
  direction: Direction;
  color: ArrowColor;
  kind?: ArrowKind;
}

export interface Level {
  id: number;
  boardWidth: number;
  boardHeight: number;
  difficulty: Difficulty;
  arrows: ArrowPath[];
}
