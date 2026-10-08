import { describe, expect, it } from 'bun:test';
import { createGameState } from '../src/game/engine/createGameState';
import { canArrowExit } from '../src/game/engine/canArrowExit';
import { findHint } from '../src/game/engine/findHint';
import { processArrowTap } from '../src/game/engine/processArrowTap';
import { COACH_TEXT, TUTORIAL_LEVEL, coachPoints, nextCoachStep, type CoachStep } from '../src/game/session/coach';
import { LOCAL_LEVELS } from '../src/game/levels';

describe('coach: the guided first level', () => {
  it('guides two escapes, says "oops" on a blocked tap, then lets go', () => {
    let step: CoachStep = 'start';
    step = nextCoachStep(step, 'blocked', 0);
    expect(step).toBe('oops');
    step = nextCoachStep(step, 'exited', 1);
    expect(step).toBe('nice');
    step = nextCoachStep(step, 'blocked', 1);
    expect(step).toBe('oops');
    step = nextCoachStep(step, 'exited', 2);
    expect(step).toBe('done');
    // Once done, it stays done: no more hand, even after a mistake.
    expect(nextCoachStep(step, 'blocked', 2)).toBe('done');
  });

  it('points in every step but the last, and has words for each', () => {
    for (const step of ['start', 'oops', 'nice'] as const) expect(coachPoints(step)).toBe(true);
    expect(coachPoints('done')).toBe(false);
    for (const text of Object.values(COACH_TEXT)) expect(text.length).toBeGreaterThan(0);
  });

  it('on the real tutorial level, the hand always taps an arrow that can escape, until the board is clear', () => {
    const level = LOCAL_LEVELS.find((l) => l.id === TUTORIAL_LEVEL)!;
    let game = createGameState(level);
    while (game.status === 'playing') {
      const target = findHint(game);
      expect(target).not.toBeNull();
      expect(canArrowExit(game, target!)).toBe(true);
      const { state, result } = processArrowTap(game, target!);
      expect(result.kind).toBe('exited');
      game = state;
    }
    expect(game.status).toBe('won');
    expect(game.mistakes).toBe(0);
  });
});
