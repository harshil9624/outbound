import { useSyncExternalStore } from 'react';

/**
 * Whether the Journey map's looping animations (breathing tile, rocking diamond, bobbing head)
 * should run: off while another tab or the game is on top. A tiny store instead of screen
 * state, so a focus change re-renders only the few looping components, not the whole map.
 */
let active = true;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getActive = () => active;

export function setMapMotionActive(next: boolean): void {
  if (next === active) return;
  active = next;
  listeners.forEach((l) => l());
}

/**
 * True while the map's loops should run. Pass `when` (e.g. "this is the current tile") and the
 * hook reads false whenever it's false, so components it doesn't apply to never re-render.
 */
export function useMapMotionActive(when = true): boolean {
  return useSyncExternalStore(subscribe, () => when && getActive());
}
