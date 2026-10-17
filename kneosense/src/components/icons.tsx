import { Circle, Path, Rect, Svg } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'pulse'
  | 'camera'
  | 'heart'
  | 'plus'
  | 'clock'
  | 'user'
  | 'chevron'
  | 'arrow';

/**
 * Stroke-based icon set replicating the mobile mockup's inline SVGs (no icon
 * font dependency). All icons share a 24x24 viewBox and the mockup's stroke
 * style (1.8, round caps/joins, no fill).
 */
export function Icon({
  name,
  size = 22,
  color = '#26435A',
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const common = {
    stroke: color,
    strokeWidth,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && <Path d="M3 10l9-7 9 7v10H3zM9 20v-7h6v7" {...common} />}
      {name === 'pulse' && <Path d="M3 14h4l3-7 4 11 3-5h4" {...common} />}
      {name === 'camera' && (
        <>
          <Rect x={3} y={6} width={18} height={15} rx={3} {...common} />
          <Circle cx={12} cy={13} r={4} {...common} />
          <Path d="M8 6l1-3h6l1 3" {...common} />
        </>
      )}
      {name === 'heart' && (
        <Path d="M12 21s-9-5.5-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12z" {...common} />
      )}
      {name === 'plus' && <Path d="M12 3v18M3 12h18" {...common} />}
      {name === 'clock' && (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 7v6l4 2" {...common} />
        </>
      )}
      {name === 'user' && (
        <>
          <Circle cx={12} cy={8} r={4} {...common} />
          <Path d="M4 21c0-8 16-8 16 0" {...common} />
        </>
      )}
      {name === 'chevron' && <Path d="M9 6l6 6-6 6" {...common} />}
      {name === 'arrow' && <Path d="M5 12h14M13 6l6 6-6 6" {...common} />}
    </Svg>
  );
}
