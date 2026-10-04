import { memo } from 'react';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import { colors } from '@/theme';

interface IconProps {
  size?: number;
  color?: string;
}

const STROKE = 2;

export const CoinIcon = memo(function CoinIcon({ size = 22, color = colors.coin }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill={color} stroke={colors.ink} strokeWidth={STROKE} />
      <Circle cx={12} cy={12} r={6.6} fill={colors.coinShade} stroke={colors.ink} strokeWidth={1.4} />
      <Rect x={10.6} y={8.2} width={2.8} height={7.6} rx={1} fill={colors.ink} />
      <Path d="M5.6 9.6 A7 7 0 0 1 9.6 5.4" fill="none" stroke={colors.surface} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
});

export const HeartIcon = memo(function HeartIcon({ size = 22, color = colors.heart }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 20.5 C5 15 2.5 11.5 2.5 8.5 A4.6 4.6 0 0 1 12 6.4 A4.6 4.6 0 0 1 21.5 8.5 C21.5 11.5 19 15 12 20.5 Z"
        fill={color}
        stroke={colors.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
});

export const StarIcon = memo(function StarIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon
        points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6"
        fill={color}
        stroke={colors.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
});

export const FlameIcon = memo(function FlameIcon({ size = 22, color = colors.danger }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2 C13 6 18 8 18 14 A6 6 0 0 1 6 14 C6 10.5 8.5 9 9 6.5 C10.5 8 11 9 11 10.5 C12.8 9 12.8 5 12 2 Z"
        fill={color}
        stroke={colors.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
});

export const BackIcon = memo(function BackIcon({ size = 22, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon points="10,4.5 2.5,12 10,19.5 10,15 21.5,15 21.5,9 10,9" fill={color} />
    </Svg>
  );
});

export const UndoIcon = memo(function UndoIcon({ size = 22, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 4 L2.5 9.5 L9 15 L9 12 C14 12 17.5 13.5 20 19 C20 12 16 8 9 7.5 Z" fill={color} />
    </Svg>
  );
});

export const RestartIcon = memo(function RestartIcon({ size = 22, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 12 A7 7 0 1 1 15.5 6" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="square" />
      <Polygon points="13,2.5 21,5.5 15.5,11" fill={color} />
    </Svg>
  );
});

export const BulbIcon = memo(function BulbIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.5 A6.5 6.5 0 0 1 16 14.2 L16 17 L8 17 L8 14.2 A6.5 6.5 0 0 1 12 2.5 Z"
        fill={color}
        stroke={colors.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Rect x={9} y={18.5} width={6} height={3} fill={colors.ink} />
    </Svg>
  );
});

export const HomeIcon = memo(function HomeIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M2.5 11.5 L12 3 L21.5 11.5 L19 11.5 L19 21 L5 21 L5 11.5 Z"
        fill={color}
        stroke={colors.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Rect x={10} y={14} width={4} height={7} fill={colors.ink} />
    </Svg>
  );
});

export const TrophyIcon = memo(function TrophyIcon({ size = 22, color = colors.info }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6.5 5 L3 5 C3 9 4.5 11 7.5 11.5 M17.5 5 L21 5 C21 9 19.5 11 16.5 11.5" fill="none" stroke={colors.ink} strokeWidth={STROKE} />
      <Path
        d="M6.5 3 L17.5 3 L17.5 9 A5.5 5.5 0 0 1 6.5 9 Z"
        fill={color}
        stroke={colors.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Rect x={10.5} y={14.5} width={3} height={3.5} fill={colors.ink} />
      <Rect x={7} y={18} width={10} height={3.5} fill={color} stroke={colors.ink} strokeWidth={STROKE} />
    </Svg>
  );
});

export const GearIcon = memo(function GearIcon({ size = 22, color = colors.success }: IconProps) {
  // Dashed ring = 8 teeth: circumference 2π·8.5 ≈ 53.4, split into 16 equal dashes.
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.5} fill="none" stroke={colors.ink} strokeWidth={5} strokeDasharray="3.34 3.34" />
      <Circle cx={12} cy={12} r={7} fill={color} stroke={colors.ink} strokeWidth={STROKE} />
      <Circle cx={12} cy={12} r={2.6} fill={colors.ink} />
    </Svg>
  );
});

/** The Journey: a right-angled route ending in an arrowhead. */
export const RouteIcon = memo(function RouteIcon({ size = 22, color = colors.info }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 21 V14 H14 V7 H17" fill="none" stroke={colors.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 21 V14 H14 V7 H17" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Polygon points="16,2.5 22.5,7 16,11.5" fill={color} stroke={colors.ink} strokeWidth={STROKE} strokeLinejoin="round" />
    </Svg>
  );
});

export const HammerIcon = memo(function HammerIcon({ size = 22, color = colors.surface }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={10.4} y={9} width={3.2} height={13} rx={1} fill="#B5703A" stroke={colors.ink} strokeWidth={STROKE} />
      <Rect x={3.5} y={3} width={17} height={7} rx={1.2} fill={color} stroke={colors.ink} strokeWidth={STROKE} />
      <Rect x={3.5} y={3} width={3.4} height={7} fill={colors.ink} />
      <Rect x={17.1} y={3} width={3.4} height={7} fill={colors.ink} />
    </Svg>
  );
});

export const LockIcon = memo(function LockIcon({ size = 22, color = colors.surface }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7.5 11 L7.5 7.5 A4.5 4.5 0 0 1 16.5 7.5 L16.5 11" fill="none" stroke={colors.ink} strokeWidth={2.6} />
      <Rect x={4} y={10.5} width={16} height={11} fill={color} stroke={colors.ink} strokeWidth={STROKE} />
      <Rect x={11} y={14} width={2} height={4} fill={colors.ink} />
    </Svg>
  );
});
