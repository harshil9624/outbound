import { memo } from 'react';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import { colors, palette } from '@/theme';
import { useInk } from '@/components/ui/Text';

interface IconProps {
  size?: number;
  color?: string;
}

const STROKE = 2;

export const CoinIcon = memo(function CoinIcon({ size = 22, color = colors.coin }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill={color} stroke={colors.artInk} strokeWidth={STROKE} />
      <Circle cx={12} cy={12} r={6.6} fill={colors.coinShade} stroke={colors.artInk} strokeWidth={1.4} />
      <Rect x={10.6} y={8.2} width={2.8} height={7.6} rx={1} fill={colors.artInk} />
      <Path d="M5.6 9.6 A7 7 0 0 1 9.6 5.4" fill="none" stroke={palette.white} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
});

export const HeartIcon = memo(function HeartIcon({ size = 22, color = colors.heart }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 20.5 C5 15 2.5 11.5 2.5 8.5 A4.6 4.6 0 0 1 12 6.4 A4.6 4.6 0 0 1 21.5 8.5 C21.5 11.5 19 15 12 20.5 Z"
        fill={color}
        stroke={colors.artInk}
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
        stroke={colors.artInk}
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
        stroke={colors.artInk}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
});

export const BackIcon = memo(function BackIcon({ size = 22, color }: IconProps) {
  const ink = useInk();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon points="10,4.5 2.5,12 10,19.5 10,15 21.5,15 21.5,9 10,9" fill={color ?? ink} />
    </Svg>
  );
});

export const UndoIcon = memo(function UndoIcon({ size = 22, color }: IconProps) {
  const ink = useInk();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 4 L2.5 9.5 L9 15 L9 12 C14 12 17.5 13.5 20 19 C20 12 16 8 9 7.5 Z" fill={color ?? ink} />
    </Svg>
  );
});

export const RestartIcon = memo(function RestartIcon({ size = 22, color }: IconProps) {
  const ink = useInk();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 12 A7 7 0 1 1 15.5 6" fill="none" stroke={color ?? ink} strokeWidth={3.2} strokeLinecap="square" />
      <Polygon points="13,2.5 21,5.5 15.5,11" fill={color ?? ink} />
    </Svg>
  );
});

export const BulbIcon = memo(function BulbIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.5 A6.5 6.5 0 0 1 16 14.2 L16 17 L8 17 L8 14.2 A6.5 6.5 0 0 1 12 2.5 Z"
        fill={color}
        stroke={colors.artInk}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Rect x={9} y={18.5} width={6} height={3} fill={colors.artInk} />
    </Svg>
  );
});

export const HomeIcon = memo(function HomeIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M2.5 11.5 L12 3 L21.5 11.5 L19 11.5 L19 21 L5 21 L5 11.5 Z"
        fill={color}
        stroke={colors.artInk}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Rect x={10} y={14} width={4} height={7} fill={colors.artInk} />
    </Svg>
  );
});

export const TrophyIcon = memo(function TrophyIcon({ size = 22, color = colors.info }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6.5 5 L3 5 C3 9 4.5 11 7.5 11.5 M17.5 5 L21 5 C21 9 19.5 11 16.5 11.5" fill="none" stroke={colors.artInk} strokeWidth={STROKE} />
      <Path
        d="M6.5 3 L17.5 3 L17.5 9 A5.5 5.5 0 0 1 6.5 9 Z"
        fill={color}
        stroke={colors.artInk}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Rect x={10.5} y={14.5} width={3} height={3.5} fill={colors.artInk} />
      <Rect x={7} y={18} width={10} height={3.5} fill={color} stroke={colors.artInk} strokeWidth={STROKE} />
    </Svg>
  );
});

export const GearIcon = memo(function GearIcon({ size = 22, color = colors.success }: IconProps) {
  // Dashed ring = 8 teeth: circumference 2π·8.5 ≈ 53.4, split into 16 equal dashes.
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.5} fill="none" stroke={colors.artInk} strokeWidth={5} strokeDasharray="3.34 3.34" />
      <Circle cx={12} cy={12} r={7} fill={color} stroke={colors.artInk} strokeWidth={STROKE} />
      <Circle cx={12} cy={12} r={2.6} fill={colors.artInk} />
    </Svg>
  );
});

/** The Journey: a right-angled route ending in an arrowhead. */
export const RouteIcon = memo(function RouteIcon({ size = 22, color = colors.info }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 21 V14 H14 V7 H17" fill="none" stroke={colors.artInk} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 21 V14 H14 V7 H17" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Polygon points="16,2.5 22.5,7 16,11.5" fill={color} stroke={colors.artInk} strokeWidth={STROKE} strokeLinejoin="round" />
    </Svg>
  );
});

export const HammerIcon = memo(function HammerIcon({ size = 22, color = palette.white }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={10.4} y={9} width={3.2} height={13} rx={1} fill="#B5703A" stroke={colors.artInk} strokeWidth={STROKE} />
      <Rect x={3.5} y={3} width={17} height={7} rx={1.2} fill={color} stroke={colors.artInk} strokeWidth={STROKE} />
      <Rect x={3.5} y={3} width={3.4} height={7} fill={colors.artInk} />
      <Rect x={17.1} y={3} width={3.4} height={7} fill={colors.artInk} />
    </Svg>
  );
});

export const LockIcon = memo(function LockIcon({ size = 22, color = palette.white }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7.5 11 L7.5 7.5 A4.5 4.5 0 0 1 16.5 7.5 L16.5 11" fill="none" stroke={colors.artInk} strokeWidth={2.6} />
      <Rect x={4} y={10.5} width={16} height={11} fill={color} stroke={colors.artInk} strokeWidth={STROKE} />
      <Rect x={11} y={14} width={2} height={4} fill={colors.artInk} />
    </Svg>
  );
});

const SUN_RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  const p = (r: number) => `${(12 + Math.cos(a) * r).toFixed(2)} ${(12 + Math.sin(a) * r).toFixed(2)}`;
  return `M${p(7.6)} L${p(10.6)}`;
}).join(' ');

export const SunIcon = memo(function SunIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={SUN_RAYS} stroke={colors.artInk} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={12} cy={12} r={5.2} fill={color} stroke={colors.artInk} strokeWidth={STROKE} />
    </Svg>
  );
});

export const MoonIcon = memo(function MoonIcon({ size = 22, color = palette.purple }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M14.5 2.8 A9.4 9.4 0 1 0 21.2 15.6 A7.4 7.4 0 0 1 14.5 2.8 Z" fill={color} stroke={colors.artInk} strokeWidth={STROKE} strokeLinejoin="round" />
      <Polygon points="19,3 19.8,5.2 22,6 19.8,6.8 19,9 18.2,6.8 16,6 18.2,5.2" fill={palette.yellow} stroke={colors.artInk} strokeWidth={1} strokeLinejoin="round" />
    </Svg>
  );
});

export const NextIcon = memo(function NextIcon({ size = 22, color }: IconProps) {
  const ink = useInk();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon points="14,4.5 21.5,12 14,19.5 14,15 2.5,15 2.5,9 14,9" fill={color ?? ink} />
    </Svg>
  );
});

/** A streak freeze: a chunky six-armed snowflake. */
export const SnowflakeIcon = memo(function SnowflakeIcon({ size = 22, color = '#5BB8FF' }: IconProps) {
  const arm = 'M12 2.5 L12 21.5 M7.8 4.8 L12 7.8 L16.2 4.8 M7.8 19.2 L12 16.2 L16.2 19.2';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {[0, 60, 120].map((deg) => (
        <Path key={deg} d={arm} transform={`rotate(${deg} 12 12)`} fill="none" stroke={colors.artInk} strokeWidth={4.6} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {[0, 60, 120].map((deg) => (
        <Path key={deg} d={arm} transform={`rotate(${deg} 12 12)`} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
});
