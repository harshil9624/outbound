/** Pets the player can pick as their avatar (Settings), and the original arrowhead faces. */
export const ANIMALS = ['cat', 'bear', 'bunny', 'frog', 'pig', 'panda'] as const;
export type Animal = (typeof ANIMALS)[number];

/** Wild animals: the faces on the board's arrowheads and the Journey's chapter mascots. */
export const WILD_ANIMALS = ['lion', 'elephant', 'monkey', 'tiger', 'giraffe', 'zebra', 'hippo', 'fox'] as const;
export type WildAnimal = (typeof WILD_ANIMALS)[number];

/** Every face AnimalFace can draw. */
export type FaceAnimal = Animal | WildAnimal;

/**
 * Arrowheads on a board, in the order arrows get them: the wild roster first, so even a small
 * level is a little safari, then the wild-ish originals for bigger boards.
 */
export const BOARD_ANIMALS: readonly FaceAnimal[] = [...WILD_ANIMALS, 'panda', 'bear', 'frog'];

/** What the player can pick as their avatar in Settings: the wild animals first, then the pets. */
export const AVATARS: readonly FaceAnimal[] = [...WILD_ANIMALS, ...ANIMALS];

/** Each animal's own colour (an arrow colour token) when it stands for the player. */
export const ANIMAL_COLORS = {
  lion: 'yellow',
  elephant: 'blue',
  monkey: 'orange',
  tiger: 'orange',
  giraffe: 'yellow',
  zebra: 'purple',
  hippo: 'pink',
  fox: 'red',
  cat: 'yellow',
  bear: 'blue',
  bunny: 'pink',
  frog: 'green',
  pig: 'orange',
  panda: 'purple',
} as const satisfies Record<FaceAnimal, string>;
