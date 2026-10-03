import type { Level } from '../../types/level';
import { level01 } from './level01';
import { level02 } from './level02';
import { level03 } from './level03';
import { level04 } from './level04';
import { level05 } from './level05';
import { level06 } from './level06';
import { level07 } from './level07';
import { level08 } from './level08';

/** Handcrafted campaign, ordered by id. */
export const LOCAL_LEVELS: readonly Level[] = [
  level01, level02, level03, level04, level05, level06, level07, level08,
];
