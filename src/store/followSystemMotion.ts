import { AccessibilityInfo } from 'react-native';
import { useSettingsStore } from './settingsStore';

/**
 * Keeps Reduced motion in step with the phone's "Remove animations" setting until the player sets
 * it in Settings. Returns the cleanup for useEffect.
 */
export function followSystemMotion(): () => void {
  const apply = (enabled: boolean) => useSettingsStore.getState().applySystemReducedMotion(enabled);
  AccessibilityInfo.isReduceMotionEnabled().then(apply, () => {});
  const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', apply);
  return () => sub.remove();
}
