import { memo } from 'react';
import { BrutalistButton } from '@/components/ui/BrutalistButton';

export const NextLevelButton = memo(function NextLevelButton({ onPress }: { onPress: () => void }) {
  return <BrutalistButton label="NEXT LEVEL" onPress={onPress} color="success" size="lg" />;
});
