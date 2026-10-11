import type { Level } from '../../types/level';
import { arrow } from './authoring';

export const level01: Level = {
  id: 1,
  boardWidth: 3,
  boardHeight: 3,
  difficulty: 'simple',
  arrows: [
    arrow('a', 'yellow', 'right', [[0, 0], [2, 0]]),
    arrow('b', 'blue', 'up', [[0, 2], [0, 1]]),
    arrow('c', 'pink', 'left', [[2, 2], [1, 2]]),
    arrow('d', 'green', 'right', [[1, 1], [2, 1]]),
  ],
};
