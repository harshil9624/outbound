import { memo } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import type { Level } from '@/types';
import { arrowColors, colors, palette } from '@/theme';

/**
 * A miniature of a level's real board, drawn from its arrow data.
 * Locked levels show grey silhouettes: you can see how busy the board is, not how it's solved.
 */
export const LevelThumbnail = memo(function LevelThumbnail({ level, size, locked }: { level: Level; size: number; locked: boolean }) {
  const { boardWidth: w, boardHeight: h } = level;
  const pad = 0.35;
  const vbW = w + pad * 2;
  const vbH = h + pad * 2;
  return (
    <Svg width={size} height={size} viewBox={`${-pad} ${-pad} ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid meet">
      <Rect x={-pad} y={-pad} width={vbW} height={vbH} fill={colors.board} />
      {level.arrows.map((a) => {
        const d = a.points.map((p, i) => `${i ? 'L' : 'M'}${p.x + 0.5} ${p.y + 0.5}`).join(' ');
        const head = a.points[a.points.length - 1];
        const fill = locked ? palette.stone : arrowColors[a.color];
        return (
          <G key={a.id}>
            <Path d={d} stroke={colors.artInk} strokeWidth={0.42} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d={d} stroke={fill} strokeWidth={0.24} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Circle cx={head.x + 0.5} cy={head.y + 0.5} r={0.3} fill={fill} stroke={colors.artInk} strokeWidth={0.09} />
          </G>
        );
      })}
    </Svg>
  );
});
