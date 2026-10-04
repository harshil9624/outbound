/** Animal faces worn by arrowheads, and chapter mascots on the Journey map. */
export const ANIMALS = ['cat', 'bear', 'bunny', 'frog', 'pig', 'panda'] as const;
export type Animal = (typeof ANIMALS)[number];
