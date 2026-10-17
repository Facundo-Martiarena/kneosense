import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

export type AnatomyAngle = 'front' | 'side';

/**
 * Illustrative 2.5D knee rendering (plan section 6). Stylized knee adapted from
 * the mobile mockup (femur/tibia curves + patella + cartilage lines), with a
 * soft demo overlay and the bioimpedance sensor patch adhered on top. NOT a
 * reconstruction from any photo; the highlighted region is a scenario-driven
 * demo value, never a real tissue-fluid map.
 */
export function AnatomyView({
  highlight,
  size = 220,
}: {
  /** Kept for API compatibility; only the front knee is rendered now. */
  angle?: AnatomyAngle;
  /** Illustrative overlay intensity 0..1 (scenario-driven demo value). */
  highlight: number;
  size?: number;
}) {
  const w = size;
  const h = (size * 190) / 130; // mockup viewBox aspect
  const overlayOpacity = 0.18 + highlight * 0.5;

  // Sensor patch footprint (viewBox units, centered on the knee ~65,98).
  const pw = 48;
  const ph = 34;
  const px = 65 - pw / 2;
  const py = 98 - ph / 2;

  return (
    <Svg width={w} height={h} viewBox="0 0 130 190">
      <Defs>
        <RadialGradient id="demo" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#F59E0B" stopOpacity={overlayOpacity} />
          <Stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="pad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2DD4BF" />
          <Stop offset="1" stopColor="#0F766E" />
        </LinearGradient>
        <LinearGradient id="module" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#334155" />
          <Stop offset="1" stopColor="#0F172A" />
        </LinearGradient>
      </Defs>

      {/* femur + tibia */}
      <Path
        d="M38 8C30 43 32 61 46 84c-9 20-5 32-8 55l-6 42M92 8c8 35 6 53-8 76 9 20 5 32 8 55l6 42"
        stroke="#6AADB0"
        strokeWidth={13}
        fill="none"
        strokeLinecap="round"
      />
      {/* patella */}
      <Ellipse cx={65} cy={98} rx={22} ry={32} fill="#D9F2EF" stroke="#288D94" strokeWidth={3} />
      {/* cartilage/contour lines */}
      <Path
        d="M51 87c8-11 20-10 28 0M50 109c12 11 23 10 30-2"
        fill="none"
        stroke="#73B3B3"
        strokeWidth={2}
      />

      {/* illustrative demo overlay (scenario value), never a real fluid map */}
      <Circle cx={65} cy={98} r={40} fill="url(#demo)" />

      {/* bioimpedance sensor patch on the joint */}
      <G>
        <Rect x={px} y={py} width={pw} height={ph} rx={10} fill="url(#pad)" opacity={0.96} />
        <Rect x={65 - 11} y={98 - 8} width={22} height={16} rx={5} fill="url(#module)" />
        <Circle cx={65 + 13} cy={98 - 8} r={3} fill="#22C55E" />
        <Circle cx={65 - 17} cy={98 - 9} r={2.6} fill="#CBD5E1" />
        <Circle cx={65 - 17} cy={98 + 9} r={2.6} fill="#CBD5E1" />
        <Circle cx={65 + 17} cy={98 + 9} r={2.6} fill="#CBD5E1" />
      </G>
    </Svg>
  );
}
