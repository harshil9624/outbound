import { memo } from 'react';
import { UndoIcon } from '@/components/icons';
import { BrutalistButton } from '@/components/ui/BrutalistButton';

export const UndoButton = memo(function UndoButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  return <BrutalistButton label="Undo" icon={<UndoIcon />} onPress={onPress} disabled={disabled} color="surface" size="md" />;
});
