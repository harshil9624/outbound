import type { Level } from '../../types/level';
import { arrow } from './authoring';

export const level06: Level = {
  id: 6,
  boardWidth: 6,
  boardHeight: 6,
  difficulty: 'simple',
  arrows: [
    arrow('a', 'pink', 'down', [[0, 0], [2, 0], [2, 2], [4, 2], [4, 4]]),
    arrow('b', 'yellow', 'right', [[0, 5], [5, 5]]),
    arrow('c', 'blue', 'down', [[5, 0], [5, 4]]),
    arrow('d', 'green', 'down', [[3, 0], [4, 0], [4, 1]]),
    arrow('e', 'orange', 'up', [[0, 4], [0, 1]]),
    arrow('f', 'purple', 'right', [[1, 1], [1, 4], [3, 4]]),
    arrow('g', 'red', 'left', [[3, 3], [2, 3]]),
  ],
};
