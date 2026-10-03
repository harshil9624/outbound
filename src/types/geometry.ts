/** Integer grid coordinate. x = column (left → right), y = row (top → bottom). */
export interface Point {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

/** Serialized cell coordinate used as a map key: "x,y". */
export type CellKey = string;
