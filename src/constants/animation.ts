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
export const WIN_CARD_DROP_DELAY_MS = 80;
export const WIN_TITLE_STAMP_DELAY_MS = 320;
export const WIN_STAR_DELAY_MS = 600;
export const WIN_STAR_GAP_MS = 300;
/** From a star starting to drop to it landing (sparkle burst). */
export const WIN_STAR_LAND_MS = 180;
export const WIN_RIBBON_DELAY_MS = 1650;
/** The chapter mascot pops up on the card once "YOU WIN!" has stamped down. */
export const WIN_AVATAR_DELAY_MS = 650;
/** Moves / mistakes / hints strip, once the last star has landed. */
export const WIN_STATS_DELAY_MS = 1350;
export const WIN_COUNT_UP_DELAY_MS = 1400;
export const WIN_COUNT_UP_MS = 600;
/** Coins flying from the reward into the balance. */
export const WIN_COIN_FLY_DELAY_MS = 1900;
export const WIN_COIN_STAGGER_MS = 70;
export const WIN_COIN_FLIGHT_MS = 420;
export const WIN_FLYING_COINS = 6;
/** The last flying coin has landed in the balance. */
export const WIN_COINS_DONE_MS = WIN_COIN_FLY_DELAY_MS + (WIN_FLYING_COINS - 1) * WIN_COIN_STAGGER_MS + WIN_COIN_FLIGHT_MS;
/** Buttons rise in: after the stars on a replay, after the last coin lands on a first clear. */
export const WIN_ACTIONS_DELAY_MS = 1800;
export const WIN_ACTIONS_AFTER_COINS_MS = WIN_COINS_DONE_MS + 120;
/** The sunburst turns this far while it grows in, then holds still. */
export const SUNBURST_TURN_DEG = 40;
export const SUNBURST_TURN_MS = 2600;

// Hammer boost
export const SMASH_MS = 520;
/** How long a blocked arrow's face stays in its "ouch" expression. */
export const OUCH_MS = 700;
/** Flying hammer: whole strike, and the moment it hits (arrow starts flattening). */
export const HAMMER_STRIKE_MS = 1000;
export const HAMMER_IMPACT_MS = 560;
