/**
 * The guided first level: a hand points at an arrow that can escape and a bubble says what to do,
 * until the player has the idea. Pure state; useLevelSession feeds it taps, GameBoard draws it.
 */

/** The level that teaches the game. */
export const TUTORIAL_LEVEL = 1;

/** Escapes the hand helps with before it lets the player carry on alone. */
const GUIDED_EXITS = 2;

export type CoachStep = 'start' | 'oops' | 'nice' | 'done';

export const COACH_TEXT: Record<CoachStep, string> = {
  start: 'Tap an arrow that can slide out!',
  oops: 'Oops, it’s blocked! Try this one.',
  nice: 'Yes! Now find the next one.',
  done: 'You’ve got it! Clear the board.',
};

/** Whether the hand points at an arrow in this step (the last step is words only). */
export function coachPoints(step: CoachStep): boolean {
  return step !== 'done';
}

/** The step after a tap. `exits` counts successful escapes so far, this one included. */
export function nextCoachStep(step: CoachStep, tap: 'exited' | 'blocked', exits: number): CoachStep {
  if (step === 'done') return 'done';
  if (tap === 'blocked') return 'oops';
  return exits >= GUIDED_EXITS ? 'done' : 'nice';
}
