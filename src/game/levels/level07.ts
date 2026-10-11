import type { Level } from '../../types/level';
import { arrow } from './authoring';

export const level07: Level = {
  id: 7,
  boardWidth: 7,
  boardHeight: 7,
  difficulty: 'simple',
  arrows: [
    arrow('a', 'yellow', 'up', [[6, 6], [6, 0]]),
    arrow('b', 'blue', 'right', [[0, 0], [5, 0]]),
    arrow('c', 'pink', 'down', [[0, 6], [0, 1], [4, 1], [4, 3]]),
    arrow('d', 'green', 'right', [[1, 6], [5, 6]]),
    arrow('e', 'orange', 'down', [[5, 1], [5, 5]]),
    arrow('f', 'purple', 'down', [[1, 2], [3, 2], [3, 4]]),
    arrow('g', 'red', 'right', [[1, 5], [4, 5]]),
    arrow('h', 'blue', 'right', [[1, 3], [1, 4], [2, 4]]),
  ],
};
