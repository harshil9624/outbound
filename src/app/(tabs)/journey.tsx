import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { OnColor, Text } from '@/components/ui/Text';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { playSound } from '@/audio/sounds';
import { MAP_METRICS, zoneGeometry } from '@/game/journey/mapGeometry';
import { hasUnmadeLevels } from '@/game/journey/progress';
import type { MapNode } from '@/game/journey/types';
import { levelProvider } from '@/game/levels/levelProvider';
import { useJourney, type JourneyZone } from '@/hooks/useJourney';
import { useSettingsStore } from '@/store/settingsStore';
import { AnimalFace } from '@/components/game/AnimalFace';
import { ChapterZone } from '@/components/journey/ChapterZone';
import { ContinuePanel } from '@/components/journey/ContinuePanel';
import { setMapMotionActive } from '@/components/journey/mapMotion';
import { arrowColors, borderWidths, colors, fontWeights, palette, spacing, textStyles, themed } from '@/theme';
import { withAlpha } from '@/utils/color';

const MORE_LEVELS_COMING = hasUnmadeLevels(levelProvider.hasLevel);

export default function JourneyRoute() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  // While another tab or the game is on top, the map's looping animations (breathing tile,
  // bobbing mascot) stop instead of running unseen. Through a small store, not screen state:
  // a focus change then re-renders only those few components, not the whole map.
  useFocusEffect(
    useCallback(() => {
      setMapMotionActive(true);
      return () => setMapMotionActive(false);
    }, []),
  );
  const { zones, currentId, celebration } = useJourney();

  // Zone heights, and each zone's distance from the bottom of the map (the list is inverted:
  // chapter 1 sits at the bottom and the journey climbs).
  const heights = useMemo(
    () => zones.map((z) => (z.kind === 'chapter' ? zoneGeometry(z.layout, width).height : MAP_METRICS.teaserHeight)),
    [zones, width],
  );
  const offsets = useMemo(() => heights.reduce<number[]>((acc, h, i) => [...acc, i ? acc[i - 1] + heights[i - 1] : 0], []), [heights]);

  /** A tile's distance from the bottom of the whole map. */
  const offsetOf = useCallback(
    (levelId: number | null): number | null => {
      if (levelId === null) return null;
      for (let i = 0; i < zones.length; i++) {
        const z = zones[i];
        if (z.kind !== 'chapter') continue;
        const n = z.nodes.find((k) => k.levelId === levelId);
        if (!n) continue;
        const geo = zoneGeometry(z.layout, width);
        return offsets[i] + (geo.height - geo.toPx(n).y);
      }
      return null;
    },
    [zones, width, offsets],
  );

  const [selectedId, setSelectedId] = useState<number | null>(currentId);
  const [shake, setShake] = useState<{ levelId: number; token: number } | null>(null);
  useEffect(() => setSelectedId(currentId), [currentId]);

  const allNodes = useMemo(() => zones.flatMap((z) => (z.kind === 'chapter' ? z.nodes : [])), [zones]);
  const selected = allNodes.find((n) => n.levelId === selectedId) ?? null;
  const selectedLevel = selected ? levelProvider.getLevel(selected.levelId) : null;
  const lockedNote = useMemo(() => {
    if (selected?.state !== 'locked') return null;
    if (selected.kind === 'bonus') {
      // Bonus levels unlock with stars in their chapter, not by finishing the next level.
      const zone = zones.find((z) => zoneHas(z, selected.levelId));
      const need = zone?.kind === 'chapter' ? zone.layout.chapter.bonus?.starsRequired : undefined;
      return need !== undefined ? `Earn ${need}★ in this chapter` : null;
    }
    return currentId !== null ? `Finish level ${currentId} first` : null;
  }, [selected, zones, currentId]);
  // The latest level finished on the route: where the map rests once everything is cleared.
  const lastDoneId = useMemo(() => {
    let last: number | null = null;
    for (const n of allNodes) {
      if (n.kind !== 'bonus' && (n.state === 'completed' || n.state === 'perfect') && (last === null || n.levelId > last)) last = n.levelId;
    }
    return last;
  }, [allNodes]);

  // Locked levels are disabled: their tiles take no taps (see JourneyTile), and this ignores them too.
  const onPressNode = useCallback((n: MapNode) => {
    if (n.state === 'locked') return;
    setSelectedId(n.levelId);
    playSound('tap');
  }, []);

  // One level per tap: a double tap used to push two level screens. Re-armed when the map is back in view.
  const opening = useRef(false);
  useFocusEffect(
    useCallback(() => {
      opening.current = false;
    }, []),
  );
  const onPlay = useCallback(() => {
    if (!selected) return;
    if (selected.state === 'locked') {
      // Same answer as tapping the locked tile: it shakes and says no.
      setShake((s) => ({ levelId: selected.levelId, token: (s?.token ?? 0) + 1 }));
      playSound('blocked');
      return;
    }
    if (opening.current) return;
    opening.current = true;
    router.push({ pathname: '/level/[levelId]', params: { levelId: String(selected.levelId) } });
  }, [router, selected]);

  // ---- Scrolling and camera ----
  const listRef = useAnimatedRef<Animated.FlatList<JourneyZone>>();
  const scrollY = useSharedValue(0);
  const viewport = useSharedValue(0);
  const [viewportH, setViewportH] = useState(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const onViewport = useCallback(
    (e: LayoutChangeEvent) => {
      viewport.value = e.nativeEvent.layout.height;
      setViewportH(e.nativeEvent.layout.height);
    },
    [viewport],
  );

  // Follows progress only: falling back to the selection made the map jump on every tap once
  // everything was cleared.
  const focusId = celebration?.toId ?? currentId ?? lastDoneId;
  const focusOffset = offsetOf(focusId);
  const scrollToFocus = useCallback(
    (animated: boolean) => {
      if (focusOffset === null || viewportH === 0) return;
      listRef.current?.scrollToOffset({ offset: Math.max(0, focusOffset - viewportH * 0.45), animated });
    },
    [focusOffset, viewportH, listRef],
  );

  // Opening: start a little below the player and glide up to them.
  const opened = useRef(false);
  useEffect(() => {
    if (viewportH === 0 || focusOffset === null) return;
    if (!opened.current && !reducedMotion) {
      opened.current = true;
      listRef.current?.scrollToOffset({ offset: Math.max(0, focusOffset - viewportH * 1.2), animated: false });
      const t = setTimeout(() => scrollToFocus(true), 60);
      return () => clearTimeout(t);
    }
    opened.current = true;
    scrollToFocus(!reducedMotion);
    return undefined;
  }, [viewportH, focusOffset, celebration, reducedMotion, scrollToFocus, listRef]);

  // Which chapter is in the middle of the screen (header), and where the player is (jump button).
  const [centerZone, setCenterZone] = useState(0);
  const [playerSide, setPlayerSide] = useState<'above' | 'below' | null>(null);
  const currentOffset = offsetOf(currentId);
  useAnimatedReaction(
    () => {
      const mid = scrollY.value + viewport.value / 2;
      let zone = 0;
      for (let i = 0; i < offsets.length; i++) if (mid >= offsets[i]) zone = i;
      let side: 'above' | 'below' | null = null;
      if (currentOffset !== null && viewport.value > 0) {
        if (currentOffset > scrollY.value + viewport.value - 40) side = 'above';
        else if (currentOffset < scrollY.value + 40) side = 'below';
      }
      return { zone, side };
    },
    (now, prev) => {
      if (!prev || now.zone !== prev.zone) runOnJS(setCenterZone)(now.zone);
      if (!prev || now.side !== prev.side) runOnJS(setPlayerSide)(now.side);
    },
    [offsets, currentOffset],
  );

  // Zones built while the map opens draw tiles at once (no flicker); zones that scroll in later
  // split their build over two frames so scrolling doesn't hitch.
  const settled = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => (settled.current = true), 800);
    return () => clearTimeout(t);
  }, []);

  const headerZone = zones[Math.min(centerZone, zones.length - 1)];
  const extraData = useMemo(() => ({ selectedId, shake, celebration }), [selectedId, shake, celebration]);

  const renderItem = useCallback(
    ({ item, index }: { item: JourneyZone; index: number }) =>
      item.kind === 'chapter' ? (
        <ChapterZone
          layout={item.layout}
          nodes={item.nodes}
          chapterNumber={item.number}
          width={width}
          exitsTop={item.exitsTop}
          travelledAll={item.travelledAll}
          currentId={currentId}
          // Only the zone that holds the selected / shaken tile gets it, so a tap re-renders one zone.
          selectedId={zoneHas(item, selectedId) ? selectedId : null}
          shake={shake && zoneHas(item, shake.levelId) ? shake : null}
          celebration={celebration}
          moreSoon={item.moreSoon}
          scrollY={scrollY}
          offsetFromBottom={offsets[index]}
          reducedMotion={reducedMotion}
          deferTiles={settled.current}
          onPressNode={onPressNode}
        />
      ) : (
        <TeaserZone number={item.number} title={item.chapter.title} color={arrowColors[item.chapter.color]} />
      ),
    [width, currentId, selectedId, shake, celebration, scrollY, offsets, reducedMotion, onPressNode],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <JourneyHeader zone={headerZone} />
      <View style={styles.mapArea} onLayout={onViewport}>
        <Animated.FlatList
          ref={listRef}
          data={zones}
          keyExtractor={(z) => z.key}
          renderItem={renderItem}
          inverted
          onScroll={onScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({ length: heights[index], offset: offsets[index], index })}
          // Chapters are tall: keep about one screen above and below alive, and build them one
          // at a time so opening the map doesn't stall on a stack of SVG zones.
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={1}
          updateCellsBatchingPeriod={80}
          showsVerticalScrollIndicator={false}
          extraData={extraData}
        />
        {playerSide && currentId !== null ? (
          <JumpButton side={playerSide} zones={zones} currentId={currentId} onPress={() => scrollToFocus(!reducedMotion)} />
        ) : null}
      </View>
      <ContinuePanel
        node={selected}
        level={selectedLevel}
        lockedNote={lockedNote}
        allDone={currentId === null}
        moreComing={MORE_LEVELS_COMING}
        onPlay={onPlay}
      />
    </SafeAreaView>
  );
}

function zoneHas(zone: JourneyZone, levelId: number | null): boolean {
  return levelId !== null && zone.kind === 'chapter' && zone.nodes.some((n) => n.levelId === levelId);
}

/** Chapter card for the chapter in view, with its progress. */
function JourneyHeader({ zone }: { zone: JourneyZone | undefined }) {
  if (!zone) return null;
  const isChapter = zone.kind === 'chapter';
  const chapter = isChapter ? zone.layout.chapter : zone.chapter;
  const color = arrowColors[chapter.color];
  const ratio = isChapter && zone.available ? zone.completed / zone.available : 0;
  return (
    <View style={styles.header}>
      <View style={styles.headerCard}>
        <View style={styles.headerShadow} />
        <View style={[styles.headerFace, { backgroundColor: color }]}>
          <OnColor>
            <Text style={styles.headerEyebrow}>CHAPTER {zone.number}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {chapter.title}
            </Text>
          </OnColor>
        </View>
      </View>
      <View style={styles.headerProgress}>
        <View style={styles.headerNumbers}>
          <Text style={styles.headerNum}>{isChapter ? `${zone.completed}/${zone.available}` : 'SOON'}</Text>
          <Text style={styles.headerNum}>{isChapter ? `${zone.stars}★` : ''}</Text>
        </View>
        <View style={styles.gauge} accessibilityLabel={isChapter ? `${zone.completed} of ${zone.available} levels done` : 'Coming soon'}>
          <View style={[styles.gaugeFill, { height: `${Math.round(ratio * 100)}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

/** Appears when the player's tile is off-screen: the mascot with an arrow toward it. */
function JumpButton({
  side,
  zones,
  currentId,
  onPress,
}: {
  side: 'above' | 'below';
  zones: JourneyZone[];
  currentId: number;
  onPress: () => void;
}) {
  const zone = zones.find((z) => z.kind === 'chapter' && z.nodes.some((n) => n.levelId === currentId));
  if (!zone || zone.kind !== 'chapter') return null;
  const color = arrowColors[zone.layout.chapter.color];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Back to level ${currentId}`}
      style={[styles.jump, side === 'above' ? styles.jumpTop : styles.jumpBottom]}
    >
      <View style={styles.jumpShadow} />
      <View style={[styles.jumpFace, { backgroundColor: colors.paper }]}>
        <AnimalFace animal={zone.layout.chapter.mascot} color={color} dir={{ x: 0, y: side === 'above' ? -1 : 1 }} mood="happy" size={54} />
      </View>
      <Svg width={18} height={12} style={side === 'above' ? styles.jumpArrowTop : styles.jumpArrowBottom} viewBox="0 0 18 12">
        <Path d={side === 'above' ? 'M1 11 L9 2 L17 11 Z' : 'M1 1 L9 10 L17 1 Z'} fill={colors.ink} />
      </Svg>
    </Pressable>
  );
}

/** The next chapter, before its levels exist. */
function TeaserZone({ number, title, color }: { number: number; title: string; color: string }) {
  return (
    <View style={[styles.teaser, { height: MAP_METRICS.teaserHeight }]}>
      <View style={styles.teaserCard}>
        <View style={[styles.teaserBadge, { borderColor: withAlpha(colors.ink, 0.35), backgroundColor: withAlpha(color, 0.25) }]}>
          <Text style={styles.teaserNum}>{number}</Text>
        </View>
        <View style={styles.teaserText}>
          <Text style={styles.teaserEyebrow}>NEXT CHAPTER · COMING SOON</Text>
          <Text style={styles.teaserTitle}>{title}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  mapArea: { flex: 1, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: borderWidths.regular,
    borderBottomColor: colors.ink,
    backgroundColor: colors.paper,
  },
  headerCard: { flex: 1 },
  headerShadow: { position: 'absolute', left: 4, top: 4, right: -4, bottom: -4, backgroundColor: colors.shadow },
  headerFace: {
    minHeight: 52,
    justifyContent: 'center',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.md,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
  },
  headerEyebrow: { ...textStyles.caption, color: colors.ink, letterSpacing: 1.2 },
  headerTitle: { fontSize: 19, fontWeight: fontWeights.heavy, color: colors.ink },
  headerProgress: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerNumbers: { alignItems: 'flex-end' },
  headerNum: { ...textStyles.label, fontVariant: ['tabular-nums'] },
  gauge: {
    width: 20,
    height: 44,
    borderWidth: borderWidths.thin,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
    justifyContent: 'flex-end',
  },
  gaugeFill: { width: '100%' },
  jump: { position: 'absolute', right: spacing.lg, width: 58, height: 58, alignItems: 'center' },
  jumpTop: { top: spacing.md },
  jumpBottom: { bottom: spacing.md },
  jumpShadow: { position: 'absolute', left: 4, top: 4, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.shadow },
  jumpFace: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  jumpArrowTop: { position: 'absolute', top: -12 },
  jumpArrowBottom: { position: 'absolute', bottom: -12 },
  teaser: { justifyContent: 'center', paddingHorizontal: MAP_METRICS.margin, backgroundColor: colors.board },
  teaserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: borderWidths.regular,
    borderStyle: 'dashed',
    borderColor: withAlpha(colors.ink, 0.35),
    backgroundColor: colors.paper,
  },
  teaserBadge: { width: 44, height: 44, borderWidth: borderWidths.regular, alignItems: 'center', justifyContent: 'center' },
  teaserNum: { fontSize: 22, fontWeight: fontWeights.heavy, color: withAlpha(colors.ink, 0.45) },
  // Shrinks beside the badge: at 320dp the eyebrow ran past the card.
  teaserText: { flex: 1, minWidth: 0 },
  teaserEyebrow: { ...textStyles.caption, letterSpacing: 1 },
  teaserTitle: { fontSize: 18, fontWeight: fontWeights.heavy, color: withAlpha(colors.ink, 0.55) },
}));
