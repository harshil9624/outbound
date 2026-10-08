import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { NextIcon } from '@/components/icons';
import { BrutalistButton } from '@/components/ui/BrutalistButton';

/** The main call to action: full width, green, with a forward arrow. */
export const NextLevelButton = memo(function NextLevelButton({ onPress, label = 'NEXT LEVEL' }: { onPress: () => void; label?: string }) {
  return <BrutalistButton label={label} icon={<NextIcon size={26} />} onPress={onPress} color="success" size="lg" style={styles.stretch} />;
});

const styles = StyleSheet.create({
  stretch: { alignSelf: 'stretch' },
});
