import type { Level } from '../../types/level';
import { arrow } from './authoring';

export const level03: Level = {
  id: 3,
  boardWidth: 5,
  boardHeight: 5,
  difficulty: 'easy',
  arrows: [
    arrow('a', 'yellow', 'right', [[1, 0], [4, 0]]),
    arrow('b', 'purple', 'up', [[0, 3], [0, 0]]),
    arrow('c', 'pink', 'right', [[1, 1], [2, 1], [2, 3], [3, 3]]),
    arrow('d', 'blue', 'up', [[4, 4], [4, 1]]),
    arrow('e', 'green', 'down', [[3, 1], [3, 2]]),
    arrow('f', 'orange', 'right', [[1, 4], [3, 4]]),
    arrow('g', 'red', 'down', [[1, 2], [1, 3]]),
  ],
};
