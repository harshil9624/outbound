import type { ChapterDef } from './types';

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * The Outbound Journey. Each chapter teaches one way of seeing the board (LEVEL_DESIGN_BIBLE.md §3)
 * and its route on the map is drawn in that chapter's signature shape.
 * 12 regular levels + 1 challenge + 1 master gate per chapter; the bonus side level is optional.
 * Levels that don't exist yet simply aren't drawn, so chapters can be authored ahead of content.
 */
export const CHAPTERS: readonly ChapterDef[] = [
  {
    id: 'first-exit',
    title: 'First Exit',
    lesson: 'An arrow leaves only when its lane is clear.',
    color: 'yellow',
    mascot: 'cat',
    signature: 'straight',
    routeStyle: 'runs',
    levelIds: range(1, 14),
    challengeIds: [8],
  },
  {
    id: 'the-queue',
    title: 'The Queue',
    lesson: 'One arrow waits for the next, which waits for the next.',
    color: 'blue',
    mascot: 'bear',
    signature: 'L',
    routeStyle: 'queue',
    levelIds: range(15, 28),
    challengeIds: [22],
  },
  {
    id: 'crosswalk',
    title: 'Crosswalk',
    lesson: 'Lanes run across other arrows’ bodies.',
    color: 'pink',
    mascot: 'bunny',
    signature: 'S',
    routeStyle: 'cross',
    levelIds: range(29, 42),
    challengeIds: [36],
  },
  {
    id: 'hairpin',
    title: 'Hairpin',
    lesson: 'U-turns, and arrows nested inside arrows.',
    color: 'green',
    mascot: 'frog',
    signature: 'U',
    routeStyle: 'hairpin',
    levelIds: range(43, 56),
    challengeIds: [50],
  },
  {
    id: 'switchback',
    title: 'Switchback',
    lesson: 'Zigzags and key arrows that unlock whole regions.',
    color: 'orange',
    mascot: 'pig',
    signature: 'zigzag',
    routeStyle: 'stairs',
    levelIds: range(57, 70),
    challengeIds: [64],
  },
  {
    id: 'long-shot',
    title: 'Long Shot',
    lesson: 'A gap ahead doesn’t mean the lane is clear.',
    color: 'purple',
    mascot: 'panda',
    signature: 'straight',
    routeStyle: 'longshot',
    levelIds: range(71, 84),
    challengeIds: [78],
  },
  {
    id: 'the-tangle',
    title: 'The Tangle',
    lesson: 'Long winding arrows on crowded boards.',
    color: 'red',
    mascot: 'cat',
    signature: 'winding',
    routeStyle: 'tangle',
    levelIds: range(85, 98),
    challengeIds: [92],
  },
  {
    id: 'gridlock',
    title: 'Gridlock',
    lesson: 'Everything at once.',
    color: 'yellow',
    mascot: 'bear',
    signature: 'spiral',
    routeStyle: 'gridlock',
    levelIds: range(99, 112),
    challengeIds: [106],
  },
];
