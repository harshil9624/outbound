import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import { useShallow } from 'zustand/react/shallow';
import { playSound } from '@/audio/sounds';
import { ANIMALS, type Animal } from '@/constants/animals';
import { APP_NAME } from '@/constants/app';
import { MAX_NAME_LENGTH, usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { AnimalFace } from '@/components/game/AnimalFace';
import { CoinIcon } from '@/components/icons';
import { BrutalistButton, BrutalistCard, Screen } from '@/components/ui';
import { arrowColors, borderWidths, colors, fontWeights, palette, spacing, textStyles } from '@/theme';
import { withAlpha } from '@/utils/color';

type SettingKey = 'soundEnabled' | 'vibrationEnabled' | 'reducedMotion';

const FEEL_ROWS: { key: SettingKey; label: string; hint: string }[] = [
  { key: 'soundEnabled', label: 'Sound', hint: 'Sound effects' },
  { key: 'vibrationEnabled', label: 'Vibration', hint: 'Buzz on a blocked tap' },
  { key: 'reducedMotion', label: 'Reduced motion', hint: 'Shorter animations, no celebrations' },
];

/** Avatar colours follow the arrow palette, one per animal. */
const AVATAR_COLORS: Record<Animal, string> = {
  cat: arrowColors.yellow,
  bear: arrowColors.blue,
  bunny: arrowColors.pink,
  frog: arrowColors.green,
  pig: arrowColors.orange,
  panda: arrowColors.purple,
};

export default function SettingsRoute() {
  const { setSetting, ...values } = useSettingsStore(
    useShallow((s) => ({
      soundEnabled: s.soundEnabled,
      vibrationEnabled: s.vibrationEnabled,
      reducedMotion: s.reducedMotion,
      setSetting: s.setSetting,
    })),
  );

  return (
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={textStyles.title}>Settings</Text>

        <ProfileCard />

        <Section title="Sound & feel">
          {FEEL_ROWS.map(({ key, label, hint }, i) => (
            <Row key={key} label={label} hint={hint} divider={i > 0}>
              <Toggle
                label={label}
                value={values[key]}
                onChange={(v) => {
                  // Set first: turning Sound on clicks, turning it off stays silent.
                  setSetting(key, v);
                  playSound('tap');
                }}
              />
            </Row>
          ))}
        </Section>

        <HowToPlay />

        <ResetProgress />

        <Section title="About">
          <Row label={APP_NAME} hint="A strategic arrow puzzle">
            <Text style={styles.version}>v{Constants.expoConfig?.version ?? '—'}</Text>
          </Row>
        </Section>

        {__DEV__ ? <DevCoins /> : null}
      </ScrollView>
    </Screen>
  );
}

/** Name (editable in place) and avatar animal. */
function ProfileCard() {
  const { name, avatar, setName, setAvatar } = usePlayerStore(
    useShallow((s) => ({ name: s.name, avatar: s.avatar, setName: s.setName, setAvatar: s.setAvatar })),
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const valid = draft.trim().length > 0;

  const save = () => {
    if (!valid) return;
    setName(draft);
    setEditing(false);
    playSound('tap');
  };

  return (
    <BrutalistCard color="primary" shadow="lg" contentStyle={styles.profile}>
      <View style={styles.profileTop}>
        <View style={styles.bigAvatar}>
          <AnimalFace animal={avatar} color={AVATAR_COLORS[avatar]} dir={{ x: 1, y: 0 }} mood="happy" size={84} />
        </View>
        <View style={styles.profileName}>
          <Text style={styles.eyebrow}>PLAYER NAME</Text>
          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                nativeID="player-name"
                value={draft}
                onChangeText={setDraft}
                maxLength={MAX_NAME_LENGTH}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={save}
                style={styles.input}
                accessibilityLabel="Player name"
                placeholder="Your name"
                placeholderTextColor={withAlpha(colors.ink, 0.4)}
              />
            </View>
          ) : (
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
          )}
        </View>
      </View>
      {editing ? (
        <View style={styles.editActions}>
          <Text style={styles.counter}>
            {draft.trim().length}/{MAX_NAME_LENGTH}
          </Text>
          <BrutalistButton
            label="Cancel"
            onPress={() => {
              setDraft(name);
              setEditing(false);
            }}
            color="surface"
            size="sm"
          />
          <BrutalistButton label="Save" onPress={save} color="success" size="sm" dimmed={!valid} sound={null} />
        </View>
      ) : (
        <BrutalistButton
          label="Edit name"
          onPress={() => {
            setDraft(name);
            setEditing(true);
          }}
          color="surface"
          size="sm"
          style={styles.editButton}
        />
      )}
      <Text style={styles.eyebrow}>CHOOSE YOUR ANIMAL</Text>
      <View style={styles.avatars}>
        {ANIMALS.map((a) => {
          const active = a === avatar;
          return (
            <Pressable
              key={a}
              onPress={() => {
                setAvatar(a);
                playSound('tap');
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={a}
              style={[styles.avatarOption, active && styles.avatarActive]}
            >
              <AnimalFace animal={a} color={AVATAR_COLORS[a]} dir={{ x: 0, y: -1 }} mood="happy" size={42} />
            </Pressable>
          );
        })}
      </View>
    </BrutalistCard>
  );
}

function HowToPlay() {
  const [open, setOpen] = useState(false);
  return (
    <Section title="How to play" action={<Text style={styles.link}>{open ? 'Hide' : 'Show'}</Text>} onPressTitle={() => setOpen((o) => !o)}>
      {open ? (
        <View style={styles.rules}>
          <Rule n={1} text="Every arrow slides off the board in the direction its face is looking." />
          <Rule n={2} text="An arrow can only leave when nothing is in its way, all the way to the edge." />
          <Rule n={3} text="Tapping a blocked arrow costs a heart. Plan the order and clear the board." />
        </View>
      ) : null}
    </Section>
  );
}

function Rule({ n, text }: { n: number; text: string }) {
  return (
    <View style={styles.rule}>
      <View style={styles.ruleNum}>
        <Text style={styles.ruleNumText}>{n}</Text>
      </View>
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

/** Two-step reset so it can't happen by accident. */
function ResetProgress() {
  const reset = usePlayerStore((s) => s.resetProgress);
  const [confirming, setConfirming] = useState(false);
  return (
    <Section title="Progress">
      {confirming ? (
        <View style={styles.confirm}>
          <Text style={textStyles.body}>
            This clears every level, star, coin and your streak. Your name and animal stay. It can’t be undone.
          </Text>
          <View style={styles.confirmActions}>
            <BrutalistButton label="Keep progress" onPress={() => setConfirming(false)} color="surface" size="sm" />
            <BrutalistButton
              label="Reset"
              onPress={() => {
                reset();
                setConfirming(false);
              }}
              color="danger"
              size="sm"
            />
          </View>
        </View>
      ) : (
        <Row label="Reset progress" hint="Start the journey again from level 1">
          <BrutalistButton label="Reset" onPress={() => setConfirming(true)} color="surface" size="sm" />
        </Row>
      )}
    </Section>
  );
}

/** Development builds only: top up coins to test boosts. Never shipped in release builds. */
function DevCoins() {
  const coins = usePlayerStore((s) => s.coins);
  const add = (amount: number) => {
    usePlayerStore.getState().addCoins(amount);
    playSound('coin');
  };
  return (
    <BrutalistCard color="background" contentStyle={styles.devCard}>
      <View style={styles.devHeader}>
        <Text style={textStyles.subheading}>Test coins</Text>
        <View style={styles.devBalance}>
          <CoinIcon size={20} />
          <Text style={textStyles.number}>{coins}</Text>
        </View>
      </View>
      <Text style={textStyles.caption}>Developer build only</Text>
      <View style={styles.devButtons}>
        <BrutalistButton label="+100" onPress={() => add(100)} color="primary" size="sm" sound={null} />
        <BrutalistButton label="+1000" onPress={() => add(1000)} color="primary" size="sm" sound={null} />
      </View>
    </BrutalistCard>
  );
}

function Section({
  title,
  action,
  onPressTitle,
  children,
}: {
  title: string;
  action?: ReactNode;
  onPressTitle?: () => void;
  children: ReactNode;
}) {
  return (
    <BrutalistCard contentStyle={styles.section}>
      <Pressable onPress={onPressTitle} disabled={!onPressTitle} style={styles.sectionHead} accessibilityRole={onPressTitle ? 'button' : undefined}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </Pressable>
      {children}
    </BrutalistCard>
  );
}

function Row({ label, hint, divider, children }: { label: string; hint: string; divider?: boolean; children: ReactNode }) {
  return (
    <View style={[styles.row, divider && styles.rowDivider]}>
      <View style={styles.rowText}>
        <Text style={textStyles.subheading}>{label}</Text>
        <Text style={textStyles.caption}>{hint}</Text>
      </View>
      {children}
    </View>
  );
}

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={spacing.sm}
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}
    >
      <View style={styles.knob} />
    </Pressable>
  );
}

const TRACK_W = 58;
const TRACK_H = 32;

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  content: { gap: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  eyebrow: { ...textStyles.caption, color: colors.ink, letterSpacing: 1.2 },
  profile: { gap: spacing.md },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bigAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: borderWidths.thick,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileName: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 26, fontWeight: fontWeights.heavy, color: colors.ink },
  editRow: { flexDirection: 'row' },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: fontWeights.heavy,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  editActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.md },
  counter: { ...textStyles.caption, color: colors.ink, marginRight: 'auto' },
  editButton: { alignSelf: 'flex-start' },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: borderWidths.regular,
    borderColor: withAlpha(colors.ink, 0.3),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: { borderColor: colors.ink, borderWidth: borderWidths.thick, transform: [{ scale: 1.08 }] },
  section: { paddingVertical: spacing.sm, gap: spacing.xs },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  sectionTitle: { ...textStyles.caption, color: colors.ink, fontWeight: fontWeights.heavy, letterSpacing: 1.2, textTransform: 'uppercase' },
  link: { ...textStyles.label, textDecorationLine: 'underline' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowDivider: { borderTopWidth: borderWidths.thin, borderTopColor: colors.ink },
  rowText: { flex: 1, gap: spacing.xxs },
  version: { ...textStyles.label, fontVariant: ['tabular-nums'] },
  rules: { gap: spacing.md, paddingVertical: spacing.sm },
  rule: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  ruleNum: {
    width: 28,
    height: 28,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
    backgroundColor: palette.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumText: { fontWeight: fontWeights.heavy, color: colors.ink },
  ruleText: { ...textStyles.body, flex: 1 },
  confirm: { gap: spacing.md, paddingVertical: spacing.sm },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    borderWidth: borderWidths.regular,
    borderColor: colors.ink,
    padding: 2,
  },
  trackOn: { backgroundColor: colors.success, alignItems: 'flex-end' },
  trackOff: { backgroundColor: colors.disabled, alignItems: 'flex-start' },
  knob: {
    width: TRACK_H - 10,
    height: TRACK_H - 10,
    borderRadius: (TRACK_H - 10) / 2,
    backgroundColor: colors.surface,
    borderWidth: borderWidths.thin,
    borderColor: colors.ink,
  },
  devCard: { gap: spacing.sm },
  devHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  devBalance: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  devButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
});
