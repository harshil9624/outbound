import { Vibration } from 'react-native';

/** Built-in Vibration API — no extra dependency. Swap for expo-haptics later if wanted. */
export function vibrateBlocked(enabled: boolean): void {
  if (enabled) Vibration.vibrate(35);
}
