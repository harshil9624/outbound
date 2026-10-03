import type { Level } from '../../types/level';
import { cellKey, expandPathToCells, getFinalSegmentDirection, getHead, isInsideBoard } from '../engine/geometry';
import { getArrowExitPath } from '../engine/getArrowExitPath';
import { buildOccupancy } from '../engine/occupancy';
import { createGameState } from '../engine/createGameState';
import { canArrowExit } from '../engine/canArrowExit';
import { solveLevel } from './solveLevel';

export interface LevelValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  solution: string[];
}

/** Run on every handcrafted level (scripts/validateLevels.ts) and every generated one later. */
export function validateLevel(level: Level): LevelValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { boardWidth: w, boardHeight: h } = level;

  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 2 || h < 2) errors.push('Board must be at least 2x2.');
  if (level.arrows.length === 0) errors.push('Level has no arrows.');

  const ids = new Set<string>();
  const owner = new Map<string, string>();
  for (const arrow of level.arrows) {
    if (ids.has(arrow.id)) errors.push(`Duplicate arrow id "${arrow.id}".`);
    ids.add(arrow.id);

    let cells;
    try {
      cells = expandPathToCells(arrow.points);
    } catch (e) {
      errors.push(`Arrow ${arrow.id}: ${(e as Error).message}`);
      continue;
    }
    if (getFinalSegmentDirection(arrow.points) !== arrow.direction) {
      errors.push(`Arrow ${arrow.id}: direction "${arrow.direction}" does not match its final segment.`);
    }
    const seen = new Set<string>();
    for (const c of cells) {
      const key = cellKey(c);
      if (!isInsideBoard(c, w, h)) errors.push(`Arrow ${arrow.id}: cell ${key} is outside the board.`);
      if (seen.has(key)) errors.push(`Arrow ${arrow.id}: crosses itself at ${key}.`);
      seen.add(key);
      const other = owner.get(key);
      if (other && other !== arrow.id) errors.push(`Arrows ${other} and ${arrow.id} overlap at ${key}.`);
      owner.set(key, arrow.id);
    }
    const exit = getArrowExitPath({ head: getHead(arrow.points), direction: arrow.direction }, w, h);
    if (exit.some((c) => seen.has(cellKey(c)))) errors.push(`Arrow ${arrow.id}: exit path runs into its own body.`);
  }

  if (errors.length > 0) return { valid: false, errors, warnings, solution: [] };

  const { solvable, order, stuckIds } = solveLevel(level);
  if (!solvable) errors.push(`Unsolvable: arrows [${stuckIds.join(', ')}] block each other.`);

  const initial = createGameState(level);
  const occupancy = buildOccupancy(initial);
  const freeAtStart = initial.remainingIds.filter((id) => canArrowExit(initial, id, occupancy));
  if (freeAtStart.length === initial.remainingIds.length) warnings.push('Every arrow is free at start — no puzzle.');

  return { valid: errors.length === 0, errors, warnings, solution: order };
}
