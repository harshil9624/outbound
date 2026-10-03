import { memo } from 'react';
import { BulbIcon } from '@/components/icons';
import { BrutalistButton } from '@/components/ui/BrutalistButton';

export const HintButton = memo(function HintButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  return <BrutalistButton label="Hint" icon={<BulbIcon />} onPress={onPress} disabled={disabled} color="primary" size="md" sound={null} />;
});
