import { useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type ChartPoint = {
  label: string;
  /** null renders a visible gap (invalid reading); never interpolated. */
  value: number | null;
  invalid?: boolean;
  /** ISO timestamp for the crosshair tooltip (date + time). */
  at?: string;
};

const DEFAULT_HEIGHT = 200;
const PADDING = { top: 16, right: 14, bottom: 30, left: 48 };
const INVALID_COLOR = '#DC2626';
const GRID_COLOR = '#E5E7EB';
const AXIS_COLOR = '#9CA3AF';
const LABEL_COLOR = '#6B7280';
const TOOLTIP_W = 124;

type LineChartProps = {
  points: ChartPoint[];
  width?: number;
  height?: number;
  color?: string;
  unit?: string;
  yTicks?: number;
};

function fmtDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Minimal responsive line chart (react-native-svg). Gridlines + Y value labels
 * make values readable; tapping/dragging the chart draws a crosshair and a
 * tooltip with the point's value, date and time. Null values are explicit gaps.
 */
export function LineChart({
  points,
  width: fixedWidth,
  height = DEFAULT_HEIGHT,
  color = '#4F46E5',
  unit = '',
  yTicks = 4,
}: LineChartProps) {
  const [measured, setMeasured] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const width = fixedWidth ?? measured;
  const HEIGHT = height;
  const LINE_COLOR = color;

  function onLayout(e: LayoutChangeEvent) {
    if (fixedWidth == null) setMeasured(e.nativeEvent.layout.width);
  }

  const valid = points.filter((p) => p.value != null) as { value: number }[];
  const min = valid.length ? Math.min(...valid.map((p) => p.value)) : 0;
  const max = valid.length ? Math.max(...valid.map((p) => p.value)) : 1;
  const span = max - min || 1;

  const innerW = Math.max(0, width - PADDING.left - PADDING.right);
  const innerH = HEIGHT - PADDING.top - PADDING.bottom;
  const axisRight = PADDING.left + innerW;
  const axisBottom = HEIGHT - PADDING.bottom;

  function x(i: number): number {
    if (points.length <= 1) return PADDING.left + innerW / 2;
    return PADDING.left + (innerW * i) / (points.length - 1);
  }
  function y(value: number): number {
    return PADDING.top + innerH * (1 - (value - min) / span);
  }

  // Map a touch x to the nearest point index.
  function selectFromTouch(evt: GestureResponderEvent) {
    if (points.length === 0 || innerW <= 0) return;
    const rel = evt.nativeEvent.locationX - PADDING.left;
    const frac = Math.min(1, Math.max(0, rel / innerW));
    setSelected(Math.round(frac * (points.length - 1)));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      // Only steal the gesture for horizontal drags; let vertical scroll pass.
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: selectFromTouch,
      onPanResponderMove: selectFromTouch,
    }),
  ).current;

  const fmtY = (v: number) => `${Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(1)}${unit ? ` ${unit}` : ''}`;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, k) => min + (span * k) / yTicks);
  const xStep = Math.max(1, Math.ceil(points.length / 6));

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

  const sel = selected != null && selected >= 0 && selected < points.length ? points[selected] : null;
  const selX = sel ? x(selected as number) : 0;
  const tooltipLeft = Math.min(Math.max(selX - TOOLTIP_W / 2, 0), Math.max(0, width - TOOLTIP_W));

  return (
    <View onLayout={onLayout} style={styles.container} {...panResponder.panHandlers}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {tickValues.map((v, k) => (
            <G key={`grid-${k}`}>
              <Line x1={PADDING.left} y1={y(v)} x2={axisRight} y2={y(v)} stroke={GRID_COLOR} strokeWidth={1} />
              <SvgText x={PADDING.left - 6} y={y(v) + 3} fontSize={10} fill={LABEL_COLOR} textAnchor="end">
                {fmtY(v)}
              </SvgText>
            </G>
          ))}

          <Line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={axisBottom} stroke={AXIS_COLOR} strokeWidth={1} />
          <Line x1={PADDING.left} y1={axisBottom} x2={axisRight} y2={axisBottom} stroke={AXIS_COLOR} strokeWidth={1} />

          {/* Crosshair for the selected point */}
          {sel ? (
            <Line x1={selX} y1={PADDING.top} x2={selX} y2={axisBottom} stroke={LINE_COLOR} strokeWidth={1} strokeDasharray="4 3" />
          ) : null}

          {segments.map((pts, idx) => (
            <Polyline key={idx} points={pts} fill="none" stroke={LINE_COLOR} strokeWidth={2} />
          ))}

          {points.map((p, i) => (
            <G key={i}>
              {p.value != null ? (
                <Circle cx={x(i)} cy={y(p.value)} r={selected === i ? 5 : 3} fill={LINE_COLOR} />
              ) : (
                <Circle cx={x(i)} cy={axisBottom - 4} r={4} fill={INVALID_COLOR} />
              )}
              {p.label && (i % xStep === 0 || i === points.length - 1) ? (
                <SvgText x={x(i)} y={axisBottom + 15} fontSize={9} fill={LABEL_COLOR} textAnchor="middle">
                  {p.label}
                </SvgText>
              ) : null}
            </G>
          ))}
        </Svg>
      )}

      {sel ? (
        <View style={[styles.tooltip, { left: tooltipLeft }]} pointerEvents="none">
          <ThemedText type="smallBold" style={styles.tooltipValue}>
            {sel.value == null ? 'No disponible' : `${sel.value.toFixed(1)}${unit ? ` ${unit}` : ''}`}
          </ThemedText>
          <ThemedText style={styles.tooltipMeta}>{fmtDateTime(sel.at) || sel.label}</ThemedText>
        </View>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={styles.legend}>
        Tocá el gráfico para ver valor, fecha y hora. Punto rojo = lectura inválida (no se interpola).
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  tooltip: {
    position: 'absolute',
    top: 2,
    width: TOOLTIP_W,
    backgroundColor: '#14283C',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tooltipValue: { color: '#FFFFFF', fontSize: 13 },
  tooltipMeta: { color: '#B6C2CE', fontSize: 11, marginTop: 1 },
  legend: { marginTop: Spacing.one },
});
