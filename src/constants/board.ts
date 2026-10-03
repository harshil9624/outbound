/** Board padding around the grid, as a fraction of one cell. */
export const BOARD_PADDING_CELLS = 0.4;
/** Caps cell size so tiny boards (3x3) don't render giant arrows. */
export const MAX_CELL_SIZE = 76;

/** Arrow proportions relative to cell size. Everything stays inside the arrow's own cells. */
export const ARROW_BODY_WIDTH = 0.2;
export const ARROW_OUTLINE_WIDTH = 0.055;
export const ARROW_HEAD_SIZE = 0.34;

/** Taps in empty cells snap to an arrow only if it is clearly the closest. Units: cells. */
export const HIT_TOLERANCE_CELLS = 0.62;
export const HIT_AMBIGUITY_MARGIN_CELLS = 0.25;
