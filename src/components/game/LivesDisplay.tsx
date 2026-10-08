import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { HardShadow, cornerStyles } from '@/components/ui/HardShadow';
import { borderWidths, colors, spacing, themed } from '@/theme';
import { MoodHeart, type HeartMood } from './MoodHeart';

const HEART_SIZE = 34;
const BEAT_MS = 1150;
/** On the last life the heart races. */
const PANIC_BEAT_MS = 620;

/** Living hearts share one mood that sours as lives run out; lost hearts are broken. */
function moodFor(alive: boolean, lives: number, maxLives: number): HeartMood {
  if (!alive) return 'broken';
  if (lives >= maxLives) return 'happy';
  return lives === 1 ? 'scared' : 'worried';
}

export const LivesDisplay = memo(function LivesDisplay({ lives, maxLives }: { lives: number; maxLives: number }) {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const beatMs = lives === 1 ? PANIC_BEAT_MS : BEAT_MS;

  return (
    <HardShadow size="sm" corner="pill">
      <View style={[styles.pill, cornerStyles.pill]} accessibilityLabel={`${lives} of ${maxLives} lives left`}>
        {Array.from({ length: maxLives }, (_, i) => (
          <MoodHeart
            key={i}
            size={HEART_SIZE}
            mood={moodFor(i < lives, lives, maxLives)}
            beatMs={beatMs}
            beatDelayMs={i * 140}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
    </HardShadow>
  );
});

const styles = themed(() => StyleSheet.create({
  pill: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
  },
}));
