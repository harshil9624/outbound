import type { Level } from '../../types/level';
import { arrow } from './authoring';

export const level05: Level = {
  id: 5,
  boardWidth: 6,
  boardHeight: 6,
  difficulty: 'normal',
  arrows: [
    arrow('a', 'yellow', 'left', [[5, 0], [0, 0]]),
    arrow('b', 'blue', 'up', [[5, 5], [5, 1]]),
    arrow('c', 'pink', 'down', [[0, 1], [4, 1], [4, 2]]),
    arrow('d', 'green', 'right', [[1, 4], [4, 4]]),
    arrow('e', 'orange', 'right', [[0, 2], [0, 5], [3, 5]]),
    arrow('f', 'purple', 'right', [[3, 3], [4, 3]]),
    arrow('g', 'red', 'right', [[1, 2], [3, 2]]),
    arrow('h', 'yellow', 'left', [[2, 3], [1, 3]]),
  ],
};
