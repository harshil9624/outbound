# Outbound — Level Design Bible

> **Easy to understand the arrow. Hard to decide the correct move.**

Every rule in this document follows from that sentence. A player should know **what** an arrow is the instant they see it: where its body runs, where its head is, which way it will go. They should **not** know **when** it can go until they have actually thought about it.

Tools referred to below:

| Command | Purpose |
|---|---|
| `bun run validate-levels` | Hard rules: legal shapes, no overlaps, solvable |
| `bun run analyze-levels` | The numbers in §4 for every level |
| `bun run analyze-levels -- --arrows` | The same, per arrow |

The model lives in `src/game/analysis/` and is covered by `__tests__/analysis.test.ts`.

---

## 1. What an arrow is (non-negotiable)

An arrow is **one continuous path** through cell centres:

- exactly one **tail** and one **head**
- an orthogonal body with **clean rounded bends** and a **consistent stroke**
- a **clear direction**: the animal face at the head, its pointer, and its eyes all aim the same way
- it never crosses itself, and its exit lane never runs into its own body (`validateLevel` rejects both)

The game must never become a node-connecting puzzle, a pipe or circuit puzzle, a maze the player steers through, or a set of disconnected blocks. **Shape is how you make an arrow hard. You never make an arrow look different from an arrow.**

---

## 2. The rule that decides what "thinking" means

How the game works today:

> An arrow leaves when every cell between its head and the board edge is empty. Tapping a blocked arrow costs a heart and nothing moves.

Two consequences follow, and every designer must understand them:

1. **"A waits for B" is fixed from the start.** An arrow is blocked by exactly the arrows sitting in its exit lane. Arrows only ever leave, so that set can only shrink. The whole puzzle is one dependency graph, and `analyze-levels` measures it.
2. **Removing an arrow can never make things worse.** Any arrow that is free right now is always a safe move. So, under these rules, *"Which arrow should I NOT remove yet?"* always has the answer "none of them". The thinking is about **seeing** which arrows are free (tracing lanes, reading tangled bodies, not trusting gaps), not about planning an order.

That thinking is real: it is what makes this genre work. But some of the questions in the design brief, such as *"which arrow should I not remove yet?"* and *"plan several moves ahead"*, **cannot be answered under these rules, whatever the arrow shapes.** Getting them requires one rule change where moving an arrow can also make things worse. See §8. This is an open decision, and §4–§7 apply either way.

---

## 3. Shape catalogue

The analyzer sorts every arrow into a **family** using only its sequence of turns, so mirrored and rotated versions count as the same family. Diagrams: `o` = body, `> < ^ v` = head, `.` = empty.

### Straight: 0 bends
```
o o o >
```
Readable from across the room. Use it as a **blocker**, not a puzzle: a long straight bar across a lane is the cleanest way to say "this has to go first".

### Short L / long L: 1 bend
```
o . .        o . . . .
o o >        o . . . .
             o o o o >
```
A short L packs into corners. A long L **reaches**: its tail sits in one region and its head in another, so the player has to connect two distant parts of the board. A long L that carries **one** dependency is worth more than a long straight one.

### U and reverse-U: 2 bends, same way (a 180° reversal)
```
o o o        ^ . o
o . o        o . o
v . o        o o o
```
The head comes back alongside its own tail. Two strategic jobs:
- **Cradle:** an arrow nested in the U's mouth can only leave through the opening. Point it at the U's base and it waits for the whole U.
- **Self-shadow:** the lane runs right next to the arrow's own other leg. Players instinctively think it is blocked by itself, but it isn't, because the validator guarantees that.

### S / Z: 2 bends, opposite ways
```
o o . .
. o . .
. o o >
```
The tail and head are offset. That offset is the point: the head's lane is in a different row from where the eye starts reading.

### Zigzag (staircase): 3+ bends, alternating
```
o . . .
o o . .
. o o .
. . o >
```
It touches many rows and columns, so its body **sits in many other arrows' lanes**. This makes it a natural **key arrow**: one arrow that unlocks several others. Use one per board at most, or every move funnels through it.

### Spiral / coil: 3+ bends, all the same way
```
. o o o
^ . . o
o . . o
o o o o
```
This head slips past its own tail by one cell. It **looks** self-blocked but is free. That is ambiguity of the right kind: the shape is perfectly clear, but whether it can go takes a second look. Use it sparingly, at Hard and above.

### Winding / multi-turn: 3+ bends, mixed
```
o o .
. o .
o o .
o . .
o o >
```
A long path that contains both a reversal and a step. It does the most to **hide dependencies**: other arrows' lanes cross its body far from its head, so the player has to trace the whole body to learn who is in the way (§4, *hidden dependency*).

### Symmetric vs asymmetric
The analyzer marks a path **symmetric** when its segment lengths read the same in both directions (the U above: 2-2-2). Symmetric shapes read instantly. **Asymmetric** ones (a 1-3-2 hook) make the player check where the head really is. Use mostly symmetric shapes at Easy, and mix in asymmetric ones from Medium.

### Short with long
Putting a 2-cell arrow beside an 8-cell winder is the cheapest source of difficulty that doesn't come from length: the eye goes to the big shape, while the short arrow quietly holds the key.

### Relationship patterns (built from the shapes above)

| Pattern | Construction | What the player has to realise |
|---|---|---|
| **Chain** | A waits for B, B for C… | The order is forced; find the end of the chain |
| **Fan / key** | One arrow sits in many lanes (often a zigzag) | "Everything waits on that one" |
| **Funnel** | One arrow waits for several | It is the last move in its region |
| **Cradle** | An arrow inside a U's mouth, pointing at the base | The inner arrow waits for the outer U |
| **Long shot** | An empty gap ahead of the head, blocker further down the lane | "It looks free… it isn't" (*deception*, §4) |
| **Hidden tail** | The blocker's body crosses the lane far from its own head | You must trace the other arrow to find the blocker |
| **Twins** | Two near-identical arrows, only one of them free | Read carefully; don't pattern-match |

---

## 4. Measuring complexity

Arrow length is deliberately **almost worthless** in this model. Long is not hard. What makes an arrow hard is its **relationships** with other arrows and how well it **hides** them.

### 4.1 Per arrow (`ArrowMetrics`)

| Field | Meaning |
|---|---|
| `shape.family`, `bends`, `reversals`, `cells`, `symmetric` | The shape (§3) |
| `laneLength` | Cells from the head to the edge |
| `blockers` | Arrows in its lane; all of them must leave first |
| `blocks` | Arrows whose lane it sits in |
| `layer` | 0 = free at start; *n* = at the end of a chain *n* arrows deep |
| `firstBlockerDistance` | 1 = the blocker touches the head; ≥ 2 = there is a gap first |
| `tempting` | Blocked, but with a visible gap in front of the head |
| `hiddenBlockers` | Blockers met ≥ 3 cells back from their own head |

```
complexity = 1.0·bends + 0.5·reversals + 0.15·cells
           + 1.0·|blockers| + 0.6·|blocks| + 0.8·|hiddenBlockers|
           + 0.7·tempting + 0.5·layer
```

### 4.2 Per level (`LevelMetrics`)

| Metric | Meaning | Harder when |
|---|---|---|
| **layers** | Longest dependency chain + 1 | higher |
| **free@0** | Arrows free at the start | lower |
| **trap** | Share of arrows that are blocked when the player looks for a move, averaged over 300 random valid playthroughs | higher |
| **deception** | Of the blocked arrows during play, the share that *look* free: an empty cell right ahead, a blocker further down the lane | higher |
| **edge tell** | Of the free arrows during play, the share free only because the head touches the edge, which you can see at a glance | **lower** |
| **narrowest** | Fewest free arrows at any point (1 = a moment with exactly one correct move) | lower |
| **orders / forced** | How many removal orders solve the level; forced = 1 means exactly one | higher forced |
| **hidden** | Count of hidden dependencies | higher |
| **bends** | Mean bends per arrow | higher (up to ~4) |
| **same-colour contacts** | Same-coloured arrows touching | **must be 0**: it confuses *what* an arrow is |

### 4.3 Score and tiers

```
score (0–100) = 22·depth + 18·trap + 18·deception + 10·hidden
              + 10·shape + 8·(1 − edge tell) + 8·forced + 6·size
```
Each term is normalised to 0–1: depth = (layers−1)/8, shape = mean bends/4, size = arrows/30.

| Tier | Score |
|---|---|
| Easy | < 25 |
| Medium | 25–44 |
| Hard | 45–64 |
| Expert | ≥ 65 |

The weights are in `SCORE_WEIGHTS` and the boundaries in `TIER_BOUNDS`. Both are **starting values**. Calibrate them against playtest data (mistakes and hints per level, %) and change them in one place.

**Board density and path length are deliberately left out of the score.** A fully packed board makes every blocker touch the head it blocks, which makes "when" *easier* to see, not harder.

---

## 5. Tier recipes

These are targets for **today's rules** (§2). Use them as ranges, not quotas.

| | Easy | Medium | Hard | Expert |
|---|---|---|---|---|
| Arrows | 4–7 | 7–12 | 10–16 | 14–24 |
| Bends per arrow | 1–2 (mean 0.5–1.5) | 2–4 (mean 1.5–2.5) | 3–6 (mean 2–3.5) | mixed, mean ≥ 3 |
| Families | straight, L | + U, S | + zigzag, winding | all, incl. spiral |
| Layers | 2–4 | 4–6 | 6–9 | 8+ |
| Free at start | 2–3 | 1–3 | 1–2 | 1–3 *(several tempting starts)* |
| Trap | ≤ 45% | 45–60% | 55–70% | ≥ 65% |
| Deception | ≤ 10% | 10–25% | 20–35% | ≥ 30% |
| Edge tell | ≥ 40% | 20–40% | ≤ 25% | ≤ 15% |
| Hidden deps | 0–1 | 2–4 | 4+ | 6+ |
| Density | 85–100% | 80–92% | 70–88% | 70–85% |
| Score | < 25 | 25–44 | 45–64 | ≥ 65 |

Rules of thumb:

- **Leave gaps to create deception.** Below about 90% density, lanes have empty cells and "long shot" arrows become possible. At 100%, every blocker is adjacent and obvious.
- **Make the first move findable, then make the rest hard.** Every level needs at least one free arrow that a careful player can spot. Narrowness belongs in the middle of the solve.
- **Use one key arrow per region.** Fans are satisfying once and tedious when stacked.
- **Never raise difficulty by length alone.** If a level only got harder because its arrows got longer, redesign it.

---

## 6. Visual design and the "what vs when" line

What the current visuals get right, and must keep doing:

- **The direction is unmistakable.** The face's pointer and eyes both aim along the exit, and the tail is a plain round cap. Nobody misreads which end is the head.
- **Bends are rounded and the stroke is even**, so a winding body reads as one object.
- **The cream checkerboard** helps the player follow rows and columns when tracing a lane, which is exactly the thinking we want. Keep the contrast low.

**Our own look.** The genre is dark boards and neon lines. Outbound is paper and ink: slim coloured lines with a black outline and a solid offset shadow (the same hard shadow as every card and button in the app), animal heads, and a warm checkerboard. Keep it that way; don't drift back to glow and neon.

What must never happen, because each one gives away **when**:

- No visual difference between free and blocked arrows: no glow, no colour change, no face that reacts to being free. The faces react only to player actions (wincing after a blocked tap, scared while the hammer is armed), never to the state of the board.
- No preview of an arrow's exit lane before it is tapped.
- The only thing that reveals a free arrow is the **paid Hint**. That's deliberate: it costs coins and counts against stars.

Findings from the current levels (`bun run analyze-levels`):

| Level | Arrows | Density | Layers | Trap | Deception | Edge tell | Bends | Score | Tier (tagged) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 4 | 100% | 3 | 34% | 0% | 59% | 0.0 | 20 | easy (easy) |
| 2 | 5 | 100% | 4 | 43% | 0% | 15% | 0.2 | 33 | medium (easy) |
| 3 | 7 | 96% | 4 | 46% | 3% | 32% | 0.3 | 31 | medium (easy) |
| 4 | 6 | 100% | 4 | 48% | 3% | 40% | 0.5 | 34 | medium (normal) |
| 5 | 8 | 97% | 5 | 51% | 12% | 8% | 0.3 | 42 | medium (normal) |
| 6 | 7 | 97% | 4 | 46% | 10% | 8% | 0.7 | 36 | medium (normal) |
| 7 | 8 | 96% | 6 | 54% | 20% | 9% | 0.5 | 45 | hard (hard) |
| 8 | 9 | 98% | 8 | 65% | 0% | 9% | 0.6 | 50 | hard (hard) |

1. **The boards are packed (96–100%), so "when" is too easy to see at the start.** On every level, the only arrows free at the start are those whose head already touches the edge. No arrow starts out deceptive.
2. **The shapes are too simple.** The mean is 0–0.7 bends per arrow, below even the Easy target; 37 of 54 arrows are straight. There are no spirals or winding paths, and only one zigzag.
3. **Deception is near zero** (0–20%). Players almost never meet an arrow that looks free but isn't.
4. **Every level has a moment with exactly one correct move** (narrowest = 1). That's fine. It's where the tension comes from.
5. **The difficulty labels roughly match the score.** Levels 2 and 3 score above their *easy* tag.

**The arrow visuals are not the problem. The layouts are.** The next batch of levels should leave gaps, use the §3 families, and aim for the deception and edge-tell ranges in §5.

**Readability limit:** with the animal heads, a cell should stay at least **36 px** on a phone, which caps boards at about **9×9**. Above that, bodies blur together and the *what* breaks. That's the failure we must never allow.

---

## 7. Authoring workflow and checklist

1. Sketch the **dependency graph first**: which arrow is the key, where the chain is, where the long shot is. Then choose shapes that build that graph.
2. Write the level with `arrow(id, colour, direction, points)` in `src/game/levels/`.
3. Run `bun run validate-levels`. It must be OK.
4. Run `bun run analyze-levels -- --arrows` and compare against the §5 targets.
5. Playtest, and record mistakes and hint use per level. Recalibrate `TIER_BOUNDS` when the tiers stop matching what players experience.

Checklist for every level:

- [ ] Every arrow is one continuous path with a clear head
- [ ] No same-coloured arrows touch (the analyzer warns)
- [ ] At least one free arrow at the start, and not every arrow is free
- [ ] Shapes match the tier's families and bend range
- [ ] Deception and edge tell are in the tier's range
- [ ] At least one designed "aha": a key arrow, a cradle, a long shot or a hidden tail
- [ ] The level is not hard just because its arrows are long

---

## 8. Open decision: real "don't move it yet" strategy

To make *"which arrow should I NOT remove yet?"* a real question, a move has to be able to **make the board worse**. The smallest change that does this while keeping every arrow a single continuous path:

**Snake advance.** Tapping a blocked arrow no longer just costs a heart. Instead the arrow slides forward along its own path (the same snake motion as the exit animation) until its head touches the blocker, and **stops there**. Its tail frees the cells it left behind, but its head now occupies new cells, which may sit in someone else's lane.

| | Today (perception) | With snake advance (planning) |
|---|---|---|
| Core question | "Which arrow is free?" | "Which arrow is free, and which moves will trap me later?" |
| Wrong tap | costs a heart | can wreck the board: a planning mistake |
| Solver | greedy, instant | search (still fast at these board sizes) |
| Recovery | not needed | needs Restart, or Undo brought back |
| Level design | dependency graph only | also designs *traps*: tempting moves that create a deadlock |

Recommendation: **keep today's rules for Easy and Medium, and introduce snake advance as the defining rule of Hard and Expert** (or as a special arrow kind through the existing `ArrowKind` hook). The early game stays a clean "find the free arrow" puzzle, and the late game gets genuine multi-move planning. The §4 model carries over, with "trap" extended to count deadlock-creating moves.
