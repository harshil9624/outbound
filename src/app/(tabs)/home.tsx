import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { useFocusEffect, useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { APP_NAME } from '@/constants/app';
import { ANIMAL_COLORS, type FaceAnimal } from '@/constants/animals';
import { chapterOfLevel, currentLevelId, hasUnmadeLevels } from '@/game/journey/progress';
import { CHAPTERS } from '@/game/journey/chapters';
import { getActiveStreak } from '@/game/progression/streak';
import { levelProvider } from '@/game/levels/levelProvider';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { playSound } from '@/audio/sounds';
import { AnimalFace } from '@/components/game/AnimalFace';
import { RouteIcon, StarIcon } from '@/components/icons';
import { LevelThumbnail } from '@/components/journey/LevelThumbnail';
import { Chest } from '@/components/streak/Chest';
import { FlameBuddy } from '@/components/streak/FlameBuddy';
import { BrutalistButton, CoinDisplay, Decorations, OnColor, Screen } from '@/components/ui';
import { HardShadow } from '@/components/ui/HardShadow';
import { arrowColors, borderWidths, colors, fontWeights, palette, radii, spacing, textStyles, themed } from '@/theme';
import { useToday } from '@/hooks/useToday';

function greeting(hour: number): string {
  // Past midnight is still "evening" to a player up late, not "morning".
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const MORE_LEVELS_COMING = hasUnmadeLevels(levelProvider.hasLevel);
/** The chapter animal's disc in the card band. */
const MASCOT = 52;

export default function HomeRoute() {
  const router = useRouter();
  const p = usePlayerStore(
    useShallow((s) => ({
      name: s.name,
      avatar: s.avatar,
      coins: s.coins,
      streak: s.streak,
      unlockedLevel: s.unlockedLevel,
      completedLevels: s.completedLevels,
      stars: s.stars,
      chestsClaimed: s.chestsClaimed,
    })),
  );
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  // Re-read on focus and on returning to the app: the tab stays mounted overnight.
  const today = useToday();

  const currentId = currentLevelId(p, levelProvider.hasLevel);
  const level = currentId !== null ? levelProvider.getLevel(currentId) : null;
  const chapter = currentId !== null ? chapterOfLevel(currentId) : null;
  const chapterNumber = chapter ? CHAPTERS.indexOf(chapter) + 1 : 0;
  const chapterDone = chapter ? chapter.levelIds.filter((id) => p.completedLevels.includes(id)).length : 0;
  const chapterTotal = chapter ? chapter.levelIds.filter((id) => levelProvider.hasLevel(id)).length : 0;
  const color = chapter ? arrowColors[chapter.color] : colors.primary;
  // Levels left until the chapter chest (paid on the first clear of the chapter's last level).
  const chestLevel = chapter ? chapter.levelIds[chapter.levelIds.length - 1] : null;
  const levelsToChest =
    chapter && chestLevel !== null && levelProvider.hasLevel(chestLevel) && !p.chestsClaimed.includes(chestLevel)
      ? chapter.levelIds.filter((id) => levelProvider.hasLevel(id) && !p.completedLevels.includes(id)).length
      : 0;
  // Only levels that exist count: saved progress for a level that was removed or renumbered
  // must not show "9/8 levels".
  const { clearedCount, totalStars } = useMemo(() => {
    const done = p.completedLevels.filter((id) => levelProvider.hasLevel(id));
    const stars = Object.entries(p.stars).reduce((sum, [id, n]) => (levelProvider.hasLevel(Number(id)) ? sum + n : sum), 0);
    return { clearedCount: done.length, totalStars: stars };
  }, [p.completedLevels, p.stars]);
  const streak = getActiveStreak(p.streak, today.day);
  const playedToday = p.streak.lastPlayedDay === today.day;

  // One level per tap: a double tap on PLAY used to push two level screens (back then landed on
  // an already-ended session). Re-armed whenever Home is back in view.
  const opening = useRef(false);
  useFocusEffect(
    useCallback(() => {
      opening.current = false;
    }, []),
  );
  const onPlay = useCallback(() => {
    if (currentId === null) {
      router.navigate('/journey');
      return;
    }
    if (opening.current) return;
    opening.current = true;
    router.push({ pathname: '/level/[levelId]', params: { levelId: String(currentId) } });
  }, [router, currentId]);

  return (
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      <Decorations />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          {/* Greeting only: the name and avatar are edited in Settings (bottom tab), not from here. */}
          <View style={styles.profile} accessible accessibilityLabel={`${greeting(today.hour)}, ${p.name}`}>
            {/* The face (ears and pointer included) reaches ~0.48× its size from the centre: 44 fits inside this 52 circle's border. */}
            <View style={styles.avatar}>
              <AnimalFace animal={p.avatar} color={arrowColors[ANIMAL_COLORS[p.avatar]]} dir={{ x: 1, y: 0 }} mood="happy" size={44} />
            </View>
            <View style={styles.hello}>
              <Text style={styles.helloSmall}>{greeting(today.hour)},</Text>
              <Text style={styles.helloName} numberOfLines={1}>
                {p.name}
              </Text>
            </View>
          </View>
          <CoinDisplay coins={p.coins} />
        </View>

        <View style={styles.wordmarkRow}>
          <View style={styles.wordmark}>
            <Text style={styles.wordmarkText} numberOfLines={1} adjustsFontSizeToFit>
              {APP_NAME}
            </Text>
          </View>
        </View>

        <HardShadow size="lg">
          <View style={styles.continueCard}>
            <View style={[styles.continueBand, chapter && styles.continueBandMascot, { backgroundColor: color }]}>
              <OnColor>
                <Text style={styles.bandEyebrow}>{chapter ? `CHAPTER ${chapterNumber}` : 'JOURNEY'}</Text>
                <Text style={styles.bandTitle} numberOfLines={1}>
                  {chapter ? chapter.title : 'All caught up'}
                </Text>
              </OnColor>
              {chapter ? <ChapterMascot animal={chapter.mascot} name={p.name} reducedMotion={reducedMotion} /> : null}
            </View>
            <View style={styles.continueBody}>
              {level ? (
                <View style={styles.thumb}>
                  <LevelThumbnail level={level} size={92} locked={false} />
                </View>
              ) : null}
              <View style={styles.continueInfo}>
                <Text style={styles.continueEyebrow}>{level ? 'NEXT UP' : MORE_LEVELS_COMING ? 'NEW LEVELS SOON' : 'ALL DONE'}</Text>
                <Text style={styles.continueLevel}>{level ? `Level ${level.id}` : MORE_LEVELS_COMING ? 'You\'re all caught up' : 'You cleared everything!'}</Text>
                {chapter ? (
                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${(chapterDone / Math.max(1, chapterTotal)) * 100}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.progressText}>
                      {chapterDone}/{chapterTotal}
                    </Text>
                  </View>
                ) : null}
                {levelsToChest > 0 ? (
                  <View style={styles.chestRow}>
                    <Chest state="locked" size={22} />
                    <Text style={styles.chestText}>
                      {levelsToChest === 1 ? 'Chest on this level!' : `Chest in ${levelsToChest} levels!`}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={styles.continueAction}>
              <BrutalistButton
                label={level ? 'PLAY' : 'OPEN MAP'}
                onPress={onPlay}
                color="success"
                size="lg"
                style={styles.playButton}
                accessibilityLabel={level ? `Play level ${level.id}` : 'Open the journey map'}
              />
            </View>
          </View>
        </HardShadow>

        <View style={styles.tiles}>
          <Tile
            onPress={() => router.navigate('/journey')}
            color={palette.blue}
            icon={<RouteIcon size={30} color={palette.yellow} />}
            title="Journey"
            detail={`${clearedCount}/${levelProvider.count()} levels`}
            extra={
              <View style={styles.inline}>
                <StarIcon size={14} />
                <Text style={styles.tileExtra}>{totalStars}</Text>
              </View>
            }
          />
          <Tile
            onPress={() => router.navigate('/streak')}
            color={palette.pink}
            icon={
              // The streak's flame buddy, sleepy until today's level is played. Still (no flicker) on Home.
              <View style={styles.tileFlame}>
                <FlameBuddy count={Math.max(streak, 1)} mood={playedToday ? 'happy' : 'sleepy'} size={30} reducedMotion />
              </View>
            }
            title={streak === 1 ? '1 day' : `${streak} days`}
            detail={playedToday ? 'Streak safe today' : streak > 0 ? 'Play today to keep it' : 'Start a streak'}
            extra={<Text style={styles.tileExtra}>Best {p.streak.best}</Text>}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

/** What the chapter's animal says when tapped. */
const MASCOT_CHEERS = ['You can do it!', 'Arrows are fun!', 'High five!', 'Tap PLAY!', 'I believe in you!', 'Hee hee!'];
const BUBBLE_MS = 2400;
/** The mascot says hi once per app launch, the first time Home is shown. */
let greetedThisLaunch = false;

/**
 * The current chapter's animal sits in the card's colour band and talks in a little bubble:
 * hello once per launch, and a cheer with a hop each time it's tapped. Nothing animates while idle.
 */
const ChapterMascot = memo(function ChapterMascot({ animal, name, reducedMotion }: { animal: FaceAnimal; name: string; reducedMotion: boolean }) {
  const [bubble, setBubble] = useState<{ text: string; token: number } | null>(null);
  const say = useCallback((text: string) => setBubble((b) => ({ text, token: (b?.token ?? 0) + 1 })), []);
  useEffect(() => {
    if (!bubble) return;
    const t = setTimeout(() => setBubble(null), BUBBLE_MS);
    return () => clearTimeout(t);
  }, [bubble]);
  useFocusEffect(
    useCallback(() => {
      if (greetedThisLaunch) return;
      greetedThisLaunch = true;
      say(`Hi ${name}! Let’s play!`);
    }, [name, say]),
  );

  const taps = useRef(0);
  const hop = useSharedValue(0);
  const onTap = useCallback(() => {
    say(MASCOT_CHEERS[taps.current++ % MASCOT_CHEERS.length]);
    playSound('tap');
    if (!reducedMotion) {
      hop.value = withSequence(withTiming(1, { duration: 130, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 6, stiffness: 240 }));
    }
  }, [say, reducedMotion, hop]);
  const hopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: hop.value * -10 }, { rotate: `${hop.value * 8}deg` }] }));

  return (
    <>
      {bubble ? (
        <View style={styles.bubble} pointerEvents="none" accessibilityLiveRegion="polite">
          <Text style={styles.bubbleText} numberOfLines={2}>
            {bubble.text}
          </Text>
        </View>
      ) : null}
      <Pressable onPress={onTap} style={styles.mascot} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${animal}, your chapter buddy`}>
        <Animated.View style={[styles.mascotDisc, hopStyle]} collapsable={false}>
          <AnimalFace animal={animal} color={arrowColors[ANIMAL_COLORS[animal]]} dir={{ x: -1, y: 0 }} mood="happy" size={40} />
        </Animated.View>
      </Pressable>
    </>
  );
});

function Tile({
  onPress,
  color,
  icon,
  title,
  detail,
  extra,
}: {
  onPress: () => void;
  color: string;
  icon: ReactNode;
  title: string;
  detail: string;
  extra: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tileWrap} accessibilityRole="button" accessibilityLabel={`${title}. ${detail}`}>
      {({ pressed }) => (
        <HardShadow size="md">
          {/* Never flattened: see BrutalistButton. */}
          <View collapsable={false} style={[styles.tile, { backgroundColor: color }, pressed && styles.pressed]}>
            <OnColor>
              {icon}
              <Text style={styles.tileTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.tileDetail} numberOfLines={2}>
                {detail}
              </Text>
              {extra}
            </OnColor>
          </View>
        </HardShadow>
      )}
    </Pressable>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { paddingBottom: 0 },
  content: { gap: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hello: { flexShrink: 1 },
  helloSmall: { ...textStyles.caption },
  helloName: { fontSize: 20, fontWeight: fontWeights.heavy, color: colors.ink },
  wordmarkRow: { alignItems: 'center' },
  wordmark: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.artInk,
    // Chalk edge in dark mode; in light mode it matches the black band.
    borderWidth: borderWidths.thin,
    borderColor: colors.ink,
    transform: [{ rotate: '-2deg' }],
  },
  wordmarkText: { fontSize: 30, fontWeight: fontWeights.heavy, color: palette.yellow, letterSpacing: 1 },
  continueCard: { borderWidth: borderWidths.thick, borderColor: colors.ink, backgroundColor: colors.surface },
  continueBand: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: borderWidths.thick,
    borderBottomColor: colors.ink,
  },
  bandEyebrow: { ...textStyles.caption, color: colors.ink, letterSpacing: 1.2 },
  bandTitle: { fontSize: 24, fontWeight: fontWeights.heavy, color: colors.ink },
  // Room on the right for the chapter's animal.
  continueBandMascot: { paddingRight: spacing.lg + MASCOT + spacing.sm },
  mascot: { position: 'absolute', right: spacing.lg, top: 0, bottom: 0, justifyContent: 'center' },
  // A white disc, so the animal never blends into a band of its own colour.
  mascotDisc: {
    width: MASCOT,
    height: MASCOT,
    borderRadius: MASCOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.regular,
    borderColor: colors.artInk,
    backgroundColor: palette.white,
    overflow: 'hidden',
  },
  // The speech bubble covers the chapter title for a moment, beside the animal.
  bubble: {
    position: 'absolute',
    right: spacing.lg + MASCOT + spacing.sm,
    left: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  bubbleText: {
    ...textStyles.label,
    color: colors.artInk,
    backgroundColor: palette.white,
    borderWidth: borderWidths.thin,
    borderColor: colors.artInk,
    borderRadius: radii.md,
    overflow: 'hidden',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
  },
  chestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxs },
  chestText: { ...textStyles.caption, color: colors.ink, fontWeight: fontWeights.heavy, flexShrink: 1 },
  tileFlame: { height: 36, justifyContent: 'flex-end' },
  continueBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  thumb: { borderWidth: borderWidths.regular, borderColor: colors.ink },
  continueInfo: { flex: 1, minWidth: 0, gap: spacing.xs },
  continueEyebrow: { ...textStyles.caption, letterSpacing: 1.2 },
  continueLevel: { fontSize: 26, fontWeight: fontWeights.heavy, color: colors.ink },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressTrack: { flex: 1, height: 12, borderWidth: borderWidths.thin, borderColor: colors.ink, backgroundColor: colors.paper },
  progressFill: { height: '100%' },
  progressText: { ...textStyles.label, fontVariant: ['tabular-nums'] },
  continueAction: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  playButton: { alignSelf: 'stretch' },
  tiles: { flexDirection: 'row', gap: spacing.lg },
  tileWrap: { flex: 1 },
  tile: { minHeight: 128, padding: spacing.md, gap: 2, borderWidth: borderWidths.thick, borderColor: colors.ink },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  tileTitle: { fontSize: 20, fontWeight: fontWeights.heavy, color: colors.ink, marginTop: spacing.xs },
  tileDetail: { ...textStyles.caption, color: colors.ink },
  tileExtra: { ...textStyles.caption, color: colors.ink, fontWeight: fontWeights.heavy },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 3 },
}));
