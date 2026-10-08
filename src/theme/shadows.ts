/**
 * Hard offset shadows. Android `elevation` only renders soft blurred shadows,
 * so HardShadow draws a solid block behind the face instead.
 */
export const shadowOffsets = {
  sm: 3,
  md: 5,
  lg: 7,
} as const;

export type ShadowSize = keyof typeof shadowOffsets;
