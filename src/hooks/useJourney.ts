import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { CHAPTERS } from '@/game/journey/chapters';
import { layoutChapter } from '@/game/journey/layout';
import { applyProgress, chapterOfLevel, currentLevelId } from '@/game/journey/progress';
import type { ChapterDef, ChapterLayout, MapNode, PlayerProgress } from '@/game/journey/types';
import { levelProvider } from '@/game/levels/levelProvider';
import { usePlayerStore } from '@/store/playerStore';
import type { ZoneCelebration } from '@/components/journey/ChapterZone';

/** How long the map waits before recording what it showed (lets the unlock animations finish). */
const SEEN_AFTER_MS = 2200;

export type JourneyZone =
  | {
      kind: 'chapter';
      key: string;
      number: number;
      layout: ChapterLayout;
      nodes: MapNode[];
      exitsTop: boolean;
      travelledAll: boolean;
      moreSoon: boolean;
      completed: number;
      available: number;
      stars: number;
    }
  | { kind: 'teaser'; key: string; number: number; chapter: ChapterDef };

const exists = levelProvider.hasLevel;
// Levels are static, so layouts are computed once.
const LAYOUTS = CHAPTERS.map((c) => layoutChapter(c, exists));

/** Everything the Journey screen shows, derived from the chapter data and the player's progress. */
export function useJourney() {
  const { unlockedLevel, completedLevels, stars, mapSeen, markMapSeen } = usePlayerStore(
    useShallow((s) => ({
      unlockedLevel: s.unlockedLevel,
      completedLevels: s.completedLevels,
      stars: s.stars,
      mapSeen: s.mapSeen,
      markMapSeen: s.markMapSeen,
    })),
  );
  const progress: PlayerProgress = useMemo(
    () => ({ unlockedLevel, completedLevels, stars }),
    [unlockedLevel, completedLevels, stars],
  );
  const currentId = currentLevelId(progress, exists);
  const currentChapter = currentId !== null ? chapterOfLevel(currentId) : null;

  const zones = useMemo<JourneyZone[]>(() => {
    const out: JourneyZone[] = [];
    const done = new Set(progress.completedLevels);
    for (let i = 0; i < LAYOUTS.length; i++) {
      const layout = LAYOUTS[i];
      if (layout.nodes.length === 0) {
        // The first chapter with no levels yet is shown as a teaser; nothing after it.
        out.push({ kind: 'teaser', key: `teaser-${layout.chapter.id}`, number: i + 1, chapter: layout.chapter });
        break;
      }
      const nodes = applyProgress(layout, progress, currentId);
      const main = nodes.filter((n) => n.kind !== 'bonus');
      const hasMaster = main.some((n) => n.kind === 'master');
      const completed = main.filter((n) => done.has(n.levelId)).length;
      const isBeforeCurrent = currentChapter ? CHAPTERS.indexOf(currentChapter) > i : completed === main.length;
      out.push({
        kind: 'chapter',
        key: layout.chapter.id,
        number: i + 1,
        layout,
        nodes,
        exitsTop: hasMaster,
        travelledAll: isBeforeCurrent && hasMaster,
        moreSoon: !hasMaster,
        completed,
        available: main.length,
        // Only levels that exist: saved stars for a removed or renumbered level don't count.
        stars: main.reduce((sum, n) => sum + n.stars, 0),
      });
      if (!hasMaster) {
        // Chapter still being made: the journey ends here for now, with the next chapter teased.
        const next = CHAPTERS[i + 1];
        if (next) out.push({ kind: 'teaser', key: `teaser-${next.id}`, number: i + 2, chapter: next });
        break;
      }
    }
    return out;
  }, [progress, currentId, currentChapter]);

  // What changed since the map last showed: drives the stars / unlock / move animations.
  const [celebration, setCelebration] = useState<ZoneCelebration | null>(null);
  const seenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The focus callback is created once; it reads the latest values through this ref.
  const latest = useRef({ stars, mapSeen, currentId, currentChapter, markMapSeen });
  latest.current = { stars, mapSeen, currentId, currentChapter, markMapSeen };

  useFocusEffect(
    useCallback(() => {
      const { stars, mapSeen, currentId, currentChapter, markMapSeen } = latest.current;
      const fromStars: Record<number, number> = {};
      for (const [id, s] of Object.entries(stars)) {
        const before = mapSeen.stars[Number(id)] ?? 0;
        if (s > before) fromStars[Number(id)] = before;
      }
      const seenProgress: PlayerProgress = {
        unlockedLevel: mapSeen.unlockedLevel,
        completedLevels: Object.keys(mapSeen.stars).map(Number),
        stars: mapSeen.stars,
      };
      const fromId = currentLevelId(seenProgress, exists);
      const moved = fromId !== currentId;
      if (Object.keys(fromStars).length === 0 && !moved) {
        setCelebration(null);
        return undefined;
      }
      const fromChapter = fromId !== null ? chapterOfLevel(fromId) : null;
      setCelebration({
        fromStars,
        fromId: moved && fromChapter === currentChapter ? fromId : null,
        toId: moved ? currentId : null,
        enteredChapter: moved && !!currentChapter && fromChapter !== currentChapter,
      });
      // Once shown, the celebration is over for this visit. Clearing it matters: the map is a
      // virtualized list, so a chapter scrolled out and back remounts and would replay every
      // star drop, route fill and unlock pop if the celebration were still set.
      seenTimer.current = setTimeout(() => {
        markMapSeen();
        setCelebration(null);
      }, SEEN_AFTER_MS);
      return () => {
        if (seenTimer.current) clearTimeout(seenTimer.current);
        markMapSeen();
        setCelebration(null);
      };
    }, []),
  );

  return { zones, currentId, currentChapter, celebration, progress };
}
