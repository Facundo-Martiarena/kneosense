import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';

export type AnatomyAngle = 'front' | 'side';

/**
 * Generic, illustrative 2.5D joint rendering (plan section 6, MVP level 2.5D).
 * This is a stylized placeholder, NOT a reconstruction from any photo. The
 * highlighted region is a demo overlay, never a real tissue-fluid map.
 */
export function AnatomyView({
  angle,
  highlight,
  size = 220,
}: {
  angle: AnatomyAngle;
  /** Illustrative overlay intensity 0..1 (scenario-driven demo value). */
  highlight: number;
  size?: number;
}) {
  const w = size;
  const h = size * 1.2;
  const cx = w / 2;
  const cy = h / 2;
  const limbColor = '#CBD5E1';
  const jointColor = '#94A3B8';
  // Illustrative overlay color: amber tint scaled by the demo value.
  const overlay = `rgba(180, 83, 9, ${0.15 + highlight * 0.45})`;

  return (
    <Svg width={w} height={h}>
      {/* upper limb segment */}
      <Rect
        x={cx - (angle === 'front' ? 26 : 20)}
        y={10}
        width={angle === 'front' ? 52 : 40}
        height={cy - 30}
        rx={18}
        fill={limbColor}
      />
      {/* lower limb segment */}
      <Rect
        x={cx - (angle === 'front' ? 24 : 18)}
        y={cy + 20}
        width={angle === 'front' ? 48 : 36}
        height={h - cy - 30}
        rx={16}
        fill={limbColor}
      />
      {/* joint body */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={angle === 'front' ? 42 : 30}
        ry={38}
        fill={jointColor}
      />
      {/* illustrative demo overlay region */}
      <Circle cx={cx} cy={cy} r={angle === 'front' ? 30 : 22} fill={overlay} />
    </Svg>
  );
}
