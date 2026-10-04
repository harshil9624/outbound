import { useCallback, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { APP_NAME } from '@/constants/app';
import { chapterOfLevel, currentLevelId } from '@/game/journey/progress';
import { CHAPTERS } from '@/game/journey/chapters';
import { getActiveStreak } from '@/game/progression/streak';
import { levelProvider } from '@/game/levels/levelProvider';
import { usePlayerStore } from '@/store/playerStore';
import { AnimalFace } from '@/components/game/AnimalFace';
import { FlameIcon, RouteIcon, StarIcon } from '@/components/icons';
import { LevelThumbnail } from '@/components/journey/LevelThumbnail';
import { BrutalistButton, CoinDisplay, Decorations, Screen } from '@/components/ui';
import { HardShadow } from '@/components/ui/HardShadow';
import { arrowColors, borderWidths, colors, fontWeights, palette, spacing, textStyles } from '@/theme';
import { toDayKey } from '@/utils/date';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

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

  const currentId = currentLevelId(p, levelProvider.hasLevel);
  const level = currentId !== null ? levelProvider.getLevel(currentId) : null;
  const chapter = currentId !== null ? chapterOfLevel(currentId) : null;
  const chapterNumber = chapter ? CHAPTERS.indexOf(chapter) + 1 : 0;
  const chapterDone = chapter ? chapter.levelIds.filter((id) => p.completedLevels.includes(id)).length : 0;
  const chapterTotal = chapter ? chapter.levelIds.filter((id) => levelProvider.hasLevel(id)).length : 0;
  const color = chapter ? arrowColors[chapter.color] : colors.primary;
  const totalStars = Object.values(p.stars).reduce((s, n) => s + n, 0);
  const streak = getActiveStreak(p.streak, toDayKey());
  const playedToday = p.streak.lastPlayedDay === toDayKey();

  const onPlay = useCallback(() => {
    if (currentId === null) {
      router.navigate('/journey');
      return;
    }
    router.push({ pathname: '/level/[levelId]', params: { levelId: String(currentId) } });
  }, [router, currentId]);

  return (
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      <Decorations />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.profile}
            onPress={() => router.navigate('/settings')}
            accessibilityRole="button"
            accessibilityLabel={`Profile: ${p.name}. Edit in settings`}
          >
            <View style={styles.avatar}>
              <AnimalFace animal={p.avatar} color={color} dir={{ x: 1, y: 0 }} mood="happy" size={54} />
            </View>
            <View style={styles.hello}>
              <Text style={styles.helloSmall}>{greeting()},</Text>
              <Text style={styles.helloName} numberOfLines={1}>
                {p.name}
              </Text>
            </View>
          </Pressable>
          <CoinDisplay coins={p.coins} />
        </View>

        <View style={styles.wordmarkRow}>
          <View style={styles.wordmark}>
            <Text style={styles.wordmarkText}>{APP_NAME}</Text>
          </View>
        </View>

        <HardShadow size="lg">
          <View style={styles.continueCard}>
            <View style={[styles.continueBand, { backgroundColor: color }]}>
              <Text style={styles.bandEyebrow}>{chapter ? `CHAPTER ${chapterNumber}` : 'JOURNEY'}</Text>
              <Text style={styles.bandTitle}>{chapter ? chapter.title : 'All caught up'}</Text>
            </View>
            <View style={styles.continueBody}>
              {level ? (
                <View style={styles.thumb}>
                  <LevelThumbnail level={level} size={92} locked={false} />
                </View>
              ) : null}
              <View style={styles.continueInfo}>
                <Text style={styles.continueEyebrow}>{level ? 'NEXT UP' : 'NEW LEVELS SOON'}</Text>
                <Text style={styles.continueLevel}>{level ? `Level ${level.id}` : 'You cleared everything'}</Text>
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
            detail={`${p.completedLevels.length}/${levelProvider.count()} levels`}
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
          <View style={[styles.tile, { backgroundColor: color }, pressed && styles.pressed]}>
            {icon}
            <Text style={styles.tileTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.tileDetail} numberOfLines={2}>
              {detail}
            </Text>
            {extra}
          </View>
        </HardShadow>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.ink,
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
  progressTrack: { flex: 1, height: 12, borderWidth: borderWidths.thin, borderColor: colors.ink, backgroundColor: palette.cream },
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
});
