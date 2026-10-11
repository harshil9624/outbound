import type { Level } from '../../types/level';
import { arrow } from './authoring';

export const level08: Level = {
  id: 8,
  boardWidth: 7,
  boardHeight: 7,
  difficulty: 'simple',
  arrows: [
    arrow('a', 'orange', 'right', [[0, 3], [0, 0], [3, 0]]),
    arrow('b', 'yellow', 'right', [[4, 0], [6, 0]]),
    arrow('c', 'blue', 'up', [[6, 6], [6, 1]]),
    arrow('d', 'pink', 'right', [[0, 6], [5, 6]]),
    arrow('e', 'green', 'down', [[1, 1], [5, 1], [5, 5]]),
    arrow('f', 'purple', 'right', [[0, 4], [0, 5], [4, 5]]),
    arrow('g', 'red', 'right', [[1, 2], [1, 4], [3, 4]]),
    arrow('h', 'yellow', 'down', [[4, 2], [4, 4]]),
    arrow('i', 'blue', 'down', [[2, 2], [3, 2], [3, 3]]),
  ],
};
