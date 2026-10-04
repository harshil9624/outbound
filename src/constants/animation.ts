/** Pixels per second an exiting arrow travels. Duration scales with distance. */
export const EXIT_SPEED_PX_PER_S = 1400;
export const EXIT_MIN_MS = 260;
export const EXIT_MAX_MS = 620;
export const EXIT_REDUCED_MOTION_MS = 120;

export const BUMP_DISTANCE_CELLS = 0.25;
export const BUMP_OUT_MS = 70;
export const BUMP_BACK_MS = 170;

export const FLASH_STEP_MS = 80;
export const HINT_PULSE_MS = 380;

// Win celebration
/** Particle effects (fireworks, confetti) mount this long after the screen opens. */
export const WIN_FX_DELAY_MS = 200;
export const WIN_CARD_DROP_DELAY_MS = 80;
export const WIN_TITLE_STAMP_DELAY_MS = 320;
export const WIN_STAR_DELAY_MS = 600;
export const WIN_STAR_GAP_MS = 300;
/** From a star starting to drop to it landing (sparkle burst). */
export const WIN_STAR_LAND_MS = 180;
export const WIN_RIBBON_DELAY_MS = 1650;
export const WIN_COUNT_UP_DELAY_MS = 1500;
export const WIN_COUNT_UP_MS = 700;
/** Coins flying from the reward into the balance. */
export const WIN_COIN_FLY_DELAY_MS = 2300;
export const WIN_COIN_STAGGER_MS = 90;
export const WIN_COIN_FLIGHT_MS = 520;
export const WIN_FLYING_COINS = 6;
export const WIN_ACTIONS_DELAY_MS = 2000;
/** Rocket rise + spark burst, per firework. */
export const FIREWORK_MS = 1500;
/** Fraction of FIREWORK_MS spent rising before the burst. */
export const FIREWORK_LAUNCH = 0.24;
/** Launch times of each firework; the last three are the finale. */
export const FIREWORK_DELAYS_MS = [250, 700, 1150, 1650, 2150, 2700, 3400, 3450, 3550];
export const SUNBURST_TURN_MS = 26000;

// Hammer boost
export const SMASH_MS = 520;
/** How long a blocked arrow's face stays in its "ouch" expression. */
export const OUCH_MS = 700;
/** Flying hammer: whole strike, and the moment it hits (arrow starts flattening). */
export const HAMMER_STRIKE_MS = 1000;
export const HAMMER_IMPACT_MS = 560;
