import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useFocusEffect, useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { APP_NAME } from '@/constants/app';
import { ANIMAL_COLORS } from '@/constants/animals';
import { chapterOfLevel, currentLevelId, hasUnmadeLevels } from '@/game/journey/progress';
import { CHAPTERS } from '@/game/journey/chapters';
import { getActiveStreak } from '@/game/progression/streak';
import { levelProvider } from '@/game/levels/levelProvider';
import { usePlayerStore } from '@/store/playerStore';
import { AnimalFace } from '@/components/game/AnimalFace';
import { FlameIcon, RouteIcon, StarIcon } from '@/components/icons';
import { LevelThumbnail } from '@/components/journey/LevelThumbnail';
import { BrutalistButton, CoinDisplay, Decorations, OnColor, Screen } from '@/components/ui';
import { HardShadow } from '@/components/ui/HardShadow';
import { arrowColors, borderWidths, colors, fontWeights, palette, spacing, textStyles, themed } from '@/theme';
import { useToday } from '@/hooks/useToday';

function greeting(hour: number): string {
  // Past midnight is still "evening" to a player up late, not "morning".
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const MORE_LEVELS_COMING = hasUnmadeLevels(levelProvider.hasLevel);

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
    })),
  );

  // Re-read on focus and on returning to the app: the tab stays mounted overnight.
  const today = useToday();

  const currentId = currentLevelId(p, levelProvider.hasLevel);
  const level = currentId !== null ? levelProvider.getLevel(currentId) : null;
  const chapter = currentId !== null ? chapterOfLevel(currentId) : null;
  const chapterNumber = chapter ? CHAPTERS.indexOf(chapter) + 1 : 0;
  const chapterDone = chapter ? chapter.levelIds.filter((id) => p.completedLevels.includes(id)).length : 0;
  const chapterTotal = chapter ? chapter.levelIds.filter((id) => levelProvider.hasLevel(id)).length : 0;
  const color = chapter ? arrowColors[chapter.color] : colors.primary;
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
            <View style={[styles.continueBand, { backgroundColor: color }]}>
              <OnColor>
                <Text style={styles.bandEyebrow}>{chapter ? `CHAPTER ${chapterNumber}` : 'JOURNEY'}</Text>
                <Text style={styles.bandTitle} numberOfLines={1}>
                  {chapter ? chapter.title : 'All caught up'}
                </Text>
              </OnColor>
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
            icon={<FlameIcon size={30} color={palette.yellow} />}
            title={streak === 1 ? '1 day' : `${streak} days`}
            detail={playedToday ? 'Streak safe today' : streak > 0 ? 'Play today to keep it' : 'Start a streak'}
            extra={<Text style={styles.tileExtra}>Best {p.streak.best}</Text>}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

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
