import type { Level } from '../../types/level';
import { arrow } from './authoring';

export const level02: Level = {
  id: 2,
  boardWidth: 4,
  boardHeight: 4,
  difficulty: 'simple',
  arrows: [
    arrow('a', 'orange', 'right', [[0, 0], [3, 0]]),
    arrow('b', 'blue', 'up', [[3, 3], [3, 1]]),
    arrow('c', 'yellow', 'right', [[0, 3], [0, 1], [2, 1]]),
    arrow('d', 'pink', 'right', [[1, 3], [2, 3]]),
    arrow('e', 'green', 'left', [[2, 2], [1, 2]]),
  ],
};
