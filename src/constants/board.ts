/** Board padding around the grid, as a fraction of one cell. */
export const BOARD_PADDING_CELLS = 0.4;
/** Caps cell size so tiny boards (3x3) don't render giant arrows. */
export const MAX_CELL_SIZE = 76;

/**
 * Arrow proportions relative to cell size: slim lines with an ink outline and a solid
 * offset shadow (the app's HardShadow look), topped by an animal head.
 */
export const ARROW_BODY_WIDTH = 0.14;
export const ARROW_OUTLINE_WIDTH = 0.035;
/** Solid ink drop shadow offset. */
export const ARROW_SHADOW_OFFSET = 0.05;
/** Thin glint along the top/left edge of the line. */
export const ARROW_HIGHLIGHT_WIDTH = 0.04;
export const ARROW_HIGHLIGHT_OFFSET = 0.025;
/** Animal head box size (cells). The face radius is a third of it. */
export const ARROW_FACE_BOX = 1;
/** How far the face (with its direction pointer) reaches past the head cell center. */
export const ARROW_HEAD_SIZE = 0.5;

/** Taps in empty cells snap to an arrow only if it is clearly the closest. Units: cells. */
export const HIT_TOLERANCE_CELLS = 0.62;
export const HIT_AMBIGUITY_MARGIN_CELLS = 0.25;
