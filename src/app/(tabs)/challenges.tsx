import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import type { StarCount } from '@/types';
import { playSound } from '@/audio/sounds';
import { levelProvider } from '@/game/levels/levelProvider';
import { usePlayerStore } from '@/store/playerStore';
import { LockIcon, StarIcon } from '@/components/icons';
import { DailyChallengeWidget, Screen } from '@/components/ui';
import { HardShadow, cornerStyles, pressedBySize } from '@/components/ui/HardShadow';
import { surfaceStyles } from '@/components/ui/surfaceStyles';
import { borderWidths, colors, spacing, textStyles } from '@/theme';

export default function ChallengesRoute() {
  const router = useRouter();
  const { unlockedLevel, completedLevels, stars } = usePlayerStore(
    useShallow((s) => ({ unlockedLevel: s.unlockedLevel, completedLevels: s.completedLevels, stars: s.stars })),
  );

  const onOpen = useCallback(
    (levelId: number) => {
      playSound('tap');
      router.push({ pathname: '/level/[levelId]', params: { levelId: String(levelId) } });
    },
    [router],
  );

  const levelIds = Array.from({ length: levelProvider.count() }, (_, i) => i + 1);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={textStyles.title}>Challenges</Text>

        <View style={styles.daily}>
          <DailyChallengeWidget />
        </View>

        <Text style={textStyles.subheading}>Levels</Text>
        <View style={styles.grid}>
          {levelIds.map((id) => (
            <View key={id} style={styles.cell}>
              <LevelTile
                levelId={id}
                locked={id > unlockedLevel}
                completed={completedLevels.includes(id)}
                stars={stars[id] ?? 0}
                onOpen={onOpen}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

interface LevelTileProps {
  levelId: number;
  locked: boolean;
  completed: boolean;
  stars: StarCount | 0;
  onOpen: (levelId: number) => void;
}

function LevelTile({ levelId, locked, completed, stars, onOpen }: LevelTileProps) {
  const color = completed ? 'success' : 'primary';
  return (
    <Pressable
      onPress={() => onOpen(levelId)}
      disabled={locked}
      accessibilityRole="button"
      accessibilityLabel={locked ? `Level ${levelId}, locked` : `Level ${levelId}, ${stars} stars`}
      accessibilityState={{ disabled: locked }}
    >
      {({ pressed }) => (
        <HardShadow size="sm" corner="sm">
          <View
            style={[
              styles.tile,
              cornerStyles.sm,
              locked ? styles.tileLocked : surfaceStyles[color],
              pressed && pressedBySize.sm,
            ]}
          >
            {locked ? <LockIcon size={24} /> : <Text style={textStyles.heading}>{levelId}</Text>}
            <View style={styles.stars}>
              {[1, 2, 3].map((n) => (
                <StarIcon key={n} size={12} color={n <= stars ? colors.primary : colors.surface} />
              ))}
            </View>
          </View>
        </HardShadow>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  daily: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  cell: { width: '25%', padding: spacing.xs },
  tile: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
  },
  tileLocked: { backgroundColor: colors.disabled },
  stars: { flexDirection: 'row', gap: 1 },
});
