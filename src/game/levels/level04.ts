import type { Level } from '../../types/level';
import { arrow } from './authoring';

export const level04: Level = {
  id: 4,
  boardWidth: 5,
  boardHeight: 5,
  difficulty: 'normal',
  arrows: [
    arrow('a', 'blue', 'up', [[1, 4], [0, 4], [0, 0]]),
    arrow('b', 'yellow', 'up', [[4, 4], [4, 0]]),
    arrow('c', 'pink', 'up', [[1, 1], [1, 3], [3, 3], [3, 1]]),
    arrow('d', 'green', 'left', [[3, 0], [1, 0]]),
    arrow('e', 'orange', 'down', [[2, 1], [2, 2]]),
    arrow('f', 'purple', 'right', [[2, 4], [3, 4]]),
  ],
};
