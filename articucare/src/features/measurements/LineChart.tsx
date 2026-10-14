import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type ChartPoint = {
  label: string;
  /** null renders a visible gap (invalid reading); never interpolated. */
  value: number | null;
  invalid?: boolean;
};

const HEIGHT = 200;
const PADDING = { top: 16, right: 12, bottom: 28, left: 40 };
const LINE_COLOR = '#2563EB';
const INVALID_COLOR = '#DC2626';

/**
 * Minimal responsive line chart built on react-native-svg. Avoids heavy chart
 * dependencies (plan section 2/6 flags compatibility risk). Null values are
 * drawn as explicit gaps + red markers so invalid readings are never faked.
 */
export function LineChart({ points }: { points: ChartPoint[] }) {
  const [width, setWidth] = useState(0);

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  const valid = points.filter((p) => p.value != null) as { value: number }[];
  const min = valid.length ? Math.min(...valid.map((p) => p.value)) : 0;
  const max = valid.length ? Math.max(...valid.map((p) => p.value)) : 1;
  const span = max - min || 1;

  const innerW = Math.max(0, width - PADDING.left - PADDING.right);
  const innerH = HEIGHT - PADDING.top - PADDING.bottom;

  function x(i: number): number {
    if (points.length <= 1) return PADDING.left + innerW / 2;
    return PADDING.left + (innerW * i) / (points.length - 1);
  }
  function y(value: number): number {
    return PADDING.top + innerH * (1 - (value - min) / span);
  }

  // Build polyline segments that break on null values (no interpolation).
  const segments: string[] = [];
  let current: string[] = [];
  points.forEach((p, i) => {
    if (p.value == null) {
      if (current.length > 1) segments.push(current.join(' '));
      current = [];
    } else {
      current.push(`${x(i)},${y(p.value)}`);
    }
  });
  if (current.length > 1) segments.push(current.join(' '));

  return (
    <View onLayout={onLayout} style={styles.container}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {/* Y axis bounds */}
          <Line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={HEIGHT - PADDING.bottom}
            stroke="#9CA3AF"
            strokeWidth={1}
          />
          <SvgText x={4} y={PADDING.top + 4} fontSize={10} fill="#6B7280">
            {max.toFixed(1)}
          </SvgText>
          <SvgText x={4} y={HEIGHT - PADDING.bottom} fontSize={10} fill="#6B7280">
            {min.toFixed(1)}
          </SvgText>

          {segments.map((pts, idx) => (
            <Polyline
              key={idx}
              points={pts}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth={2}
            />
          ))}

          {points.map((p, i) => (
            <G key={p.label}>
              {p.value != null ? (
                <Circle cx={x(i)} cy={y(p.value)} r={3} fill={LINE_COLOR} />
              ) : (
                <Circle
                  cx={x(i)}
                  cy={HEIGHT - PADDING.bottom - 4}
                  r={4}
                  fill={INVALID_COLOR}
                />
              )}
              <SvgText
                x={x(i)}
                y={HEIGHT - PADDING.bottom + 14}
                fontSize={9}
                fill="#6B7280"
                textAnchor="middle">
                {p.label}
              </SvgText>
            </G>
          ))}
        </Svg>
      )}
      <ThemedText type="small" themeColor="textSecondary" style={styles.legend}>
        Punto rojo = lectura inválida (quality=invalid_contact). No se interpola.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  legend: { marginTop: Spacing.one },
});
