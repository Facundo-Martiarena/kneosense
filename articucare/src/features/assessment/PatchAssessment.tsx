import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { evaluateReading } from '@/features/assessment/decisionEngine';
import { useTheme } from '@/hooks/use-theme';
import { getDemoCase } from '@/data/mocks/loadScenarios';
import { useReadingsForCase, useSymptomsForCase } from '@/state/selectors';
import type { AttributeState, SignalLevel } from '@/types';

const ATTR: Record<AttributeState, string> = { existent: 'sí', non_existent: 'no', uncertain: '?' };

const LEVEL_COLOR: Record<SignalLevel, string> = {
  alert: '#DC2626',
  watch: '#D97706',
  normal: '#16A34A',
  unavailable: '#94A2AF',
};

const VERDICT: Record<SignalLevel, { icon: string; headline: string }> = {
  alert: { icon: '⚠️', headline: 'Consultá a tu equipo' },
  watch: { icon: '👀', headline: 'Conviene vigilar' },
  normal: { icon: '✅', headline: 'Todo en orden' },
  unavailable: { icon: '•', headline: 'Sin datos aún' },
};

function num(v: number | null, unit = ''): string {
  return v == null ? '—' : `${v}${unit}`;
}

/**
 * Patch assessment with PROGRESSIVE DISCLOSURE: a big, plain-language verdict
 * first (for any user, any age), with the technical signals + cited thresholds
 * tucked behind a "Ver detalle". Non-diagnostic.
 */
export function PatchAssessment({ scenarioId }: { scenarioId: string | null }) {
  const theme = useTheme();
  const readings = useReadingsForCase(scenarioId ?? null);
  const symptoms = useSymptomsForCase(scenarioId ?? null);
  const [open, setOpen] = useState(false);

  const reading = readings.length ? readings[readings.length - 1] : null;

  if (!reading) {
    return (
      <Card style={[styles.verdict, { borderLeftColor: LEVEL_COLOR.unavailable }]}>
        <View style={styles.verdictHead}>
          <ThemedText style={styles.icon}>•</ThemedText>
          <ThemedText style={[styles.headline, { color: theme.text }]}>Sin mediciones aún</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Registrá tu primera medición del parche para ver la evaluación.
        </ThemedText>
      </Card>
    );
  }

  const previousReading = readings.length > 1 ? readings[readings.length - 2] : null;
  const baselineOhm = readings.find((r) => r.bioimpedanceOhm != null)?.bioimpedanceOhm ?? null;
  const annotations = getDemoCase(scenarioId ?? '')?.photoAnnotations ?? [];
  const latestPhoto = annotations.length ? annotations[annotations.length - 1] : null;
  const photo = latestPhoto
    ? { edemaVisible: latestPhoto.edemaVisible, erythemaVisible: latestPhoto.erythemaVisible }
    : null;
  const latestPain = symptoms[0]?.pain0to10 ?? null;

  const result = evaluateReading(reading, { baselineOhm, previousReading, photo, pain: latestPain });
  const v = VERDICT[result.overallLevel];
  const color = LEVEL_COLOR[result.overallLevel];
  const delta =
    reading.tempReferenceC != null && reading.tempAffectedC != null
      ? reading.tempAffectedC - reading.tempReferenceC
      : null;

  const signals: { label: string; value: string }[] = [
    { label: 'Temp. referencia', value: num(reading.tempReferenceC, ' °C') },
    { label: 'Temp. zona afectada', value: num(reading.tempAffectedC, ' °C') },
    { label: 'Diferencial (Δ)', value: delta == null ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} °C` },
    { label: 'Bioimpedancia', value: num(reading.bioimpedanceOhm == null ? null : Math.round(reading.bioimpedanceOhm), ' Ω') },
    { label: 'Actividad (IMU)', value: reading.activityIndex == null ? '—' : `${Math.round(reading.activityIndex * 100)}%` },
    { label: 'Batería', value: `${reading.batteryPct}%` },
    { label: 'Foto edema/eritema', value: photo ? `${ATTR[photo.edemaVisible]} / ${ATTR[photo.erythemaVisible]}` : '—' },
    { label: 'Dolor (síntomas)', value: latestPain == null ? '—' : `${latestPain}/10` },
  ];

  return (
    <>
      <Card style={[styles.verdict, { borderLeftColor: color }]}>
        <View style={styles.verdictHead}>
          <ThemedText style={styles.icon}>{v.icon}</ThemedText>
          <ThemedText style={[styles.headline, { color: theme.text }]}>{v.headline}</ThemedText>
        </View>
        <ThemedText style={[styles.reco, { color: theme.text }]}>{result.recommendation}</ThemedText>
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((o) => !o)}
        style={[styles.toggle, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold" style={{ color: theme.primary }}>
          {open ? 'Ocultar detalle de las señales' : 'Ver detalle de las señales'}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: theme.primary }}>
          {open ? '▴' : '▾'}
        </ThemedText>
      </Pressable>

      {open ? (
        <Card>
          <View style={styles.grid}>
            {signals.map((s) => (
              <View key={s.label} style={styles.cell}>
                <ThemedText type="small" themeColor="textSecondary">
                  {s.label}
                </ThemedText>
                <ThemedText type="smallBold" style={styles.cellValue}>
                  {s.value}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.findings}>
            {result.findings.map((f) => (
              <View key={f.key} style={styles.finding}>
                <View style={[styles.dot, { backgroundColor: LEVEL_COLOR[f.level] }]} />
                <View style={styles.findingText}>
                  <ThemedText type="small" style={{ color: theme.text, fontWeight: '600' }}>
                    {f.label}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.detail}>
                    {f.detail}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            Reglas con umbrales clínicos citados (temp. Δ ≥ 2,2 °C pie diabético; absoluta por encima
            de 38 °C infección; bioimpedancia = tendencia de edema). NO es un diagnóstico.
          </ThemedText>
        </Card>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  verdict: { borderLeftWidth: 5 },
  verdictHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
  icon: { fontSize: 30 },
  headline: { fontSize: 23, fontWeight: '800', letterSpacing: -0.4, flex: 1 },
  reco: { marginTop: Spacing.two, fontSize: 16, lineHeight: 23 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '50%', paddingVertical: Spacing.one + 2 },
  cellValue: { fontSize: 17, marginTop: 2 },
  findings: { marginTop: Spacing.three, gap: Spacing.two + 2 },
  finding: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  findingText: { flex: 1 },
  detail: { lineHeight: 19, marginTop: 1 },
  note: { marginTop: Spacing.three, lineHeight: 18 },
});
