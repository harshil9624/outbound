# Outbound — Sprint 1 Architecture

An Android-first tap-away arrow puzzle. Every arrow is one continuous path with bends and a single head; tapping it slides it out if the lane in front of the head is clear.

The pure core (`src/game`, `src/types`, `src/constants`) typechecks under `strict` and passes 21 unit tests under `bun test`. The full app typechecks against React Native 0.81, Reanimated 4, react-native-svg, Expo Router 6, Zustand 5 and MMKV 3. All 8 levels are machine-validated as solvable.

## 1. Install (Bun)

The project ships with its own `package.json`, pinned to Expo SDK 54. Every version is taken from Expo's compatibility list for that SDK, so you don't need a template project.

**Prerequisites (Windows):**
- [Bun](https://bun.sh)
- Android Studio, with an emulator or a USB-debugging device
- JDK 17. Android Studio's bundled JBR works if `JAVA_HOME` points to it.
- `ANDROID_HOME` set to your Android SDK folder

```powershell
cd D:\outbound
bun i
bun android     # first run: generates /android and builds the dev client
bun dev         # afterwards, for day-to-day work
```

To move to a newer SDK later, run `bunx expo install expo@latest`, then `bunx expo install --fix`.

The `package.json` sets `main` and these scripts:

```json
"main": "expo-router/entry",
"scripts": {
  "dev": "expo start --dev-client",
  "android": "expo run:android",
  "test": "bun test",
  "validate-levels": "bun scripts/validateLevels.ts",
  "typecheck": "tsc --noEmit",
  "doctor": "bunx expo-doctor"
}
```

Daily commands:

| Command | What it does |
|---|---|
| `bun i` | Installs dependencies. This is Bun's built-in install, so it needs no script. |
| `bun android` | Builds and installs the Android dev build, then starts Metro. Run it first, and again after adding any native module. |
| `bun dev` | Starts Metro for the installed dev build. Use it for everyday JS/TS work. |
| `bun run test` | Runs the engine unit tests with Bun's built-in test runner. Use `bun run test`, not plain `bun test`, so the script is used. |
| `bun run validate-levels` | Checks that every level is valid and solvable. |

MMKV is native code, so Expo Go cannot run it. That is why `dev` uses `--dev-client`, and why `bun android` builds the dev client first.

Expo Router picks up `src/app/` automatically. `babel-preset-expo` wires the Reanimated/worklets plugin automatically. `tsconfig` `paths` gives the `@/` alias with no Babel config.

On SDK 53 or older, Reanimated is v3 and `react-native-worklets` is not needed; no code changes. MMKV v4 changes one line in `src/storage/mmkv.ts`.

### Dependency audit — what was deliberately left out

| Excluded | Why |
|---|---|
| react-native-gesture-handler | A single `Pressable` over the board plus geometric hit testing is enough. The board doesn't scroll, pan or drag. |
| Game engines | The puzzle is discrete-state logic in about 300 lines of pure TypeScript. |
| Jest / ts-node / tsx | Bun runs TypeScript and tests natively, and the engine has no React Native imports. |
| expo-haptics | RN's built-in `Vibration` covers blocked-tap feedback. |
| expo-font / custom fonts | The system font at weight 900 reads chunky and costs nothing to load. Add a display face later in `theme/typography.ts` only. |
| Sample-based audio | Effects play through `expo-audio` (`src/audio/sounds.ts`), gated by `soundEnabled`. The WAVs in `assets/sounds/` are synthesized by `bun run generate-sounds`, so there are no sample files to license. The config plugin has microphone/RECORD_AUDIO turned off. |

## 2. Folder structure

```
src/
  app/                    routing only
    _layout.tsx           Stack, safe area, status bar
    index.tsx             Splash → replace('/home')
    (tabs)/               Tabs with the rounded BottomNav panel
      home.tsx, challenges.tsx (level select), streak.tsx, settings.tsx
    level/[levelId].tsx
    win/index.tsx
  components/
    ui/                   BrutalistButton, BrutalistCard, HardShadow, CoinDisplay,
                          StreakWidget, DailyChallengeWidget, Decorations, Screen
    game/                 GameBoard, ArrowPath, BoardGrid, LevelHeader, LivesDisplay,
                          DifficultyBadge, GameControls, UndoButton, HintButton, GameOverOverlay
    win/                  WinCard, StarRating, RewardDisplay, NextLevelButton
    icons/                small SVG glyphs (no icon font dependency)
    nav/                  BottomNav (custom tab bar for the (tabs) group)
  game/                   NO React imports anywhere in here
    engine/               createGameState, canArrowExit, processArrowTap, getArrowExitPath,
                          undoMove, findHint, checkWin, calculateStars, calculateReward,
                          geometry, occupancy
    layout/               boardLayout (px math), arrowGeometry (SVG paths), hitTest
    levels/               level01–08, authoring helper, levelProvider
    validation/           validateLevel, solveLevel
    session/              buildLevelResult (state → stars → reward)
    progression/          streak
  hooks/useLevelSession.ts  orchestrates stores ↔ engine for one level
  store/                  playerStore, gameStore, settingsStore
  storage/                mmkv, zustandStorage, storageKeys
  theme/                  colors, typography, spacing, borders, shadows
  constants/              app, gameConfig, board, animation
  types/                  geometry, level, game
  utils/                  date, math, haptics
__tests__/engine.test.ts
scripts/validateLevels.ts
```

One addition to your suggested structure: `src/hooks/`. The level screen needs code that touches three stores plus the engine. Putting it in the route would violate "routing/pages only"; putting it in a store would couple stores to each other.

## 3. Core types (`src/types`)

- **`Point`** `{x, y}` — integer cell coordinates, y grows downward.
- **`Direction`** — one of `'up' | 'down' | 'left' | 'right'`.
- **`ArrowPath`** `{ id, points, direction, color, kind? }` — `points` are vertices only (start, bends, head). `color` is a theme token (`'blue'`), not a hex value, so reskinning never touches level data. `kind` is reserved for future mechanics.
- **`Level`** `{ id, boardWidth, boardHeight, difficulty, arrows }`.
- **`BoardArrow`** — `ArrowPath` plus precomputed `cells[]` and `head`.
- **`GameState`** — fully serializable: `arrows`, `arrowOrder`, `remainingIds`, `removedIds`, `lives`, `moves`, `mistakes`, `hintsUsed`, `status`, `history`.
- **`TapResult`** — `exited` (with `exitPath`), `blocked` (with `blockerId`, `blockedAt`, `lifeLost`), or `ignored`.
- **`LevelResult`** — `stars`, `RewardBreakdown`, `coinsEarned`, `isFirstClear` and stats.

## 4. Zustand stores

| Store | Persisted | Holds |
|---|---|---|
| `playerStore` | yes (v1) | coins, currentLevel, unlockedLevel, streak `{count, best, lastPlayedDay}`, completedLevels, best stars per level. Actions: `addCoins`, `spendCoins`, `setCurrentLevel`, `applyLevelResult`. |
| `settingsStore` | yes (v1) | soundEnabled, vibrationEnabled, reducedMotion |
| `gameStore` | **no** | `level`, `game` (the engine's `GameState`: arrows, lives, moves, status, undo history), `exitingIds`, `hintArrowId`, `bump`, `lastResult` |

`gameStore` is a thin adapter: every rule decision is a call into `src/game/engine`.

It also owns the two pieces of state that exist only for presentation. `exitingIds` lists arrows that are already removed from the puzzle but still animating out. `bump` is a counter token that fires the blocked-tap animation.

`partialize` limits what reaches disk, and `version` plus `migrate` is where future shape changes go.

## 5. MMKV persistence

- `storage/mmkv.ts` is the only file that imports `react-native-mmkv`.
- `storage/zustandStorage.ts` adapts it to Zustand's `StateStorage`.
- `storage/storageKeys.ts` lists every key.

MMKV is synchronous, so stores are hydrated before the first render. There is no loading gate and no flash of default values.

Cloud save later means adding a sync layer that reads and writes the same persisted slices. Nothing in the UI changes.

## 6. Expo Router

`/` (splash) → `replace('/home')` → `push('/level/3')` → on win `replace('/win')` → `replace('/level/4')` or `replace('/home')`.

`/home`, `/challenges`, `/streak` and `/settings` live in the `(tabs)` group, which sits inside the root Stack. Level and win screens are pushed above the tabs, so the bottom panel never shows during play.

The win and level screens use `replace`, so Android back never returns to a finished board. An unknown `levelId` redirects home.

## 7. Game engine

All engine functions are pure: they take a state and return a new one.

**Occupancy.** `buildOccupancy` maps each cell to an arrow id. Cells are exclusive, and `validateLevel` enforces that.

**Exit check.** `getArrowExitPath` walks from the head to the board edge. `checkArrowExit` returns the first occupied cell on that path as the blocker. An arrow's own body counts as a blocker, and the validator rejects levels where that can happen.

**Taps.** `processArrowTap` is the single entry point for player input:
- **Exited:** the arrow is removed, the move is recorded in history, and the win is checked.
- **Blocked:** a mistake is recorded and a life is lost if `DEFAULT_GAME_RULES.blockedTapCostsLife` is set. Zero lives means lost.

**Solving and hints.** Removing an arrow can only unblock others, never block them. Two useful facts follow:
- **Hints are trivial:** any currently free arrow is always a safe move (`findHint`).
- **Solving is greedy:** a level is solvable exactly when repeatedly removing any free arrow clears the board (`solveLevel`). This runs in roughly linear time, so it can validate thousands of procedurally generated levels.

**Undo.** `undoMove` restores the last removed arrow in authoring order. Lives are not refunded.

**Scoring.**
- `calculateStars` uses penalty = mistakes + hints: 0 gives 3 stars, up to 2 gives 2, more gives 1.
- `calculateReward` uses `REWARD_TABLE`: base by difficulty, plus 5 per star, plus a first-clear bonus. Replays pay 20%.

All tuning values live in `constants/gameConfig.ts`.

## 8. SVG rendering and touch

**Layout.** `computeBoardLayout` fits any board size into whatever space `onLayout` reports. Cell size is capped so 3×3 boards don't look bloated. All arrow geometry stays inside the arrow's own cells, so what you see matches what you can tap.

**Drawing.** Each `ArrowPath` draws three SVG paths: a black outline, a colored body on top, and a triangle head with a black border.

**Exit animation — the snake slide.** The body path is extended straight out of the board past the head. Its dash length is set to exactly the body length.

One shared value, `travel`, drives everything:
- the body's `strokeDashoffset = -travel`, so the body slides along its own bends;
- the head moves `travel` px along its direction;
- opacity fades over the last 45%.

The duration scales with distance (clamped to 260–620 ms), with ease-in acceleration. The board frame's `overflow: hidden` clips the arrow as it leaves.

**Feedback animations.**
- **Blocked tap:** `travel` nudges forward a quarter cell and springs back, and the blocker flashes.
- **Hint:** the hinted arrow pulses.
- **Reduced motion:** exits become 120 ms and the hint stops pulsing.

**Touch.** One `Pressable` covers the board and the SVG has `pointerEvents="none"`, so there are no per-arrow touch views and nothing overlaps. `hitTestArrow` resolves each tap in two steps:
1. The tapped cell's owner wins, and every cell has exactly one owner.
2. If the cell is empty, the tap goes to the nearest arrow centerline only if it is within 0.62 cells **and** at least 0.25 cells closer than the runner-up. Otherwise nothing is selected.

Both thresholds are in `constants/board.ts`.

**Re-renders.** `ArrowPath` is memoized with stable props. A tap re-renders the board list, but animations run on the UI thread and never through React state.

## 9. Design system

- **Colors:** the brief's palette, plus semantic roles (`primary`, `accent`, `danger`…) and an `arrowColors` token map.
- **Typography:** heavy system type with a fixed scale (`textStyles`).
- **Spacing:** a 4-point scale.
- **Borders:** 2, 3 and 4 px, with mostly square corners.
- **Hard shadows:** Android `elevation` can only blur, so `HardShadow` draws a solid black block offset 3, 5 or 7 px behind the face. Pressed buttons translate onto their shadow.

Every component uses `StyleSheet.create`. The one inline style is the board's computed pixel size.

## 10. Levels

Eight handcrafted levels: 3×3 up to 7×7, 4 to 9 arrows each, with straight, L, U, Z and multi-bend zig-zag shapes. Order dependencies run up to 7 deep.

Author them with the compact helper:

```ts
arrow('c', 'pink', 'right', [[1, 1], [2, 1], [2, 3], [3, 3]])
```

The app only reads levels through `LevelProvider` (`getLevel`, `hasLevel`, `count`). A generator, a remote pack or daily challenges become another provider; every screen stays untouched. Run each new level, handcrafted or generated, through `validateLevel`.

## 11. Data flow

```
Tap on board
  → GameBoard.handlePress(locationX, locationY)
  → hitTestArrow(...)                          pure, src/game/layout
  → useLevelSession.onTapArrow(id)
  → gameStore.tapArrow(id) → processArrowTap(state, id)    pure engine
       exited  → game updated, id added to exitingIds
                 → ArrowPath animates on the UI thread
                 → runOnJS(completeExit)
       blocked → game.lives decremented, bump token++
                 → nudge + blocker flash, vibration
  → status 'won' AND exitingIds is empty
  → buildLevelResult: calculateStars → calculateReward     pure
  → playerStore.applyLevelResult: coins, stars, unlock, streak → MMKV
  → gameStore.setLastResult → router.replace('/win') → Win screen reads lastResult
```

## Extension points already in place

| Feature | Where it plugs in |
|---|---|
| New mechanics | `ArrowKind`, plus a branch in `checkArrowExit` and `processArrowTap` |
| Rewarded hints / economy | `HINT_COIN_COST` and `spendCoins`, in `onHint` |
| Achievements / analytics | Subscribe to `TapResult` and `LevelResult`; both are already discrete events |
| Daily challenge | A new `LevelProvider` plus a route |
