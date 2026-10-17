import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton, RowItem } from '@/components/ui';
import { Radii, Spacing } from '@/constants/theme';
import { evaluateReading } from '@/features/assessment/decisionEngine';
import { buildSummary } from '@/features/export/buildSummary';
import { getDemoCase } from '@/data/mocks/loadScenarios';
import { useTheme } from '@/hooks/use-theme';
import { usePhotosForCase, useReadingsForCase, useSymptomsForCase } from '@/state/selectors';
import { useCurrentCase } from '@/state/useCurrentCase';
import type { PhotoRecord, SensorReading, SignalLevel, SymptomEntry } from '@/types';
import { fullDate } from '@/utils/date';

type Item =
  | { id: string; at: string; kind: 'reading'; data: SensorReading }
  | { id: string; at: string; kind: 'symptom'; data: SymptomEntry }
  | { id: string; at: string; kind: 'photo'; data: PhotoRecord };

const KIND_LABEL: Record<Item['kind'], string> = {
  reading: 'Medición del parche',
  symptom: 'Registro de síntomas',
  photo: 'Fotografía de rodilla',
};

const LEVEL_COLORS: Record<SignalLevel, string> = {
  alert: '#DC2626',
  watch: '#D97706',
  normal: '#16A34A',
  unavailable: '#94A2AF',
};

const num = (v: number | null, unit = '') => (v == null ? '—' : `${v}${unit}`);

/**
 * History screen (mobile mockup): all records in one chronological list. Each
 * row opens a detail with ALL of that record's data — now that readings live in
 * the local DB (sensor readings carry the full multimodal signal set).
 */
export default function HistoryScreen() {
  const demoCase = useCurrentCase();
  const scenarioId = demoCase?.scenarioId ?? null;
  const readings = useReadingsForCase(scenarioId);
  const photos = usePhotosForCase(scenarioId);
  const symptoms = useSymptomsForCase(scenarioId);
  const [selected, setSelected] = useState<Item | null>(null);

  if (!demoCase) {
    return (
      <Screen title="Historial">
        <ThemedText>No hay escenario seleccionado.</ThemedText>
      </Screen>
    );
  }

  const items: Item[] = [
    ...readings.map((r): Item => ({ id: r.id, at: r.timestamp, kind: 'reading', data: r })),
    ...symptoms.map((s): Item => ({ id: s.id, at: s.recordedAt, kind: 'symptom', data: s })),
    ...photos.map((p): Item => ({ id: p.id, at: p.capturedAt, kind: 'photo', data: p })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  async function onExport() {
    if (!demoCase) return;
    const summary = buildSummary(demoCase, photos, symptoms);
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message: summary }
          : { message: summary, title: 'Resumen KneoSense (DEMO)' },
      );
    } catch {
      // Sharing dismissed/unsupported.
    }
  }

  return (
    <Screen title="Historial" subtitle="Tocá un registro para ver todos sus datos.">
      <Card>
        {items.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Sin registros todavía.
          </ThemedText>
        ) : (
          items.map((it, i) => (
            <RowItem
              key={it.id}
              title={KIND_LABEL[it.kind]}
              subtitle={fullDate(it.at)}
              onPress={() => setSelected(it)}
              last={i === items.length - 1}
            />
          ))
        )}
      </Card>

      <PrimaryButton label="Exportar registros" onPress={onExport} />

      <RecordDetail
        item={selected}
        readings={readings}
        symptoms={symptoms}
        scenarioId={scenarioId}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}

/** Detail modal rendering ALL fields of the selected record. */
function RecordDetail({
  item,
  readings,
  symptoms,
  scenarioId,
  onClose,
}: {
  item: Item | null;
  readings: SensorReading[];
  symptoms: SymptomEntry[];
  scenarioId: string | null;
  onClose: () => void;
}) {
  const theme = useTheme();

  const rows: { label: string; value: string }[] = [];
  let findings: { label: string; detail: string; level: SignalLevel }[] = [];
  let overall: SignalLevel | null = null;

  if (item?.kind === 'reading') {
    const r = item.data;
    const delta =
      r.tempReferenceC != null && r.tempAffectedC != null ? r.tempAffectedC - r.tempReferenceC : null;
    rows.push(
      { label: 'Fecha y hora', value: fullDate(r.timestamp) },
      { label: 'Temp. referencia', value: num(r.tempReferenceC, ' °C') },
      { label: 'Temp. zona afectada', value: num(r.tempAffectedC, ' °C') },
      { label: 'Diferencial (Δ)', value: delta == null ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} °C` },
      { label: 'Bioimpedancia', value: num(r.bioimpedanceOhm == null ? null : Math.round(r.bioimpedanceOhm), ' Ω') },
      { label: 'Actividad (IMU)', value: r.activityIndex == null ? '—' : `${Math.round(r.activityIndex * 100)}%` },
      { label: 'Batería', value: `${r.batteryPct}%` },
      { label: 'Calidad', value: r.quality === 'invalid_contact' ? 'contacto inválido' : 'simulada' },
    );
    const idx = readings.findIndex((x) => x.id === r.id);
    const previousReading = idx > 0 ? readings[idx - 1] : null;
    const baselineOhm = readings.find((x) => x.bioimpedanceOhm != null)?.bioimpedanceOhm ?? null;
    const ann = getDemoCase(scenarioId ?? '')?.photoAnnotations ?? [];
    const latestPhoto = ann.length ? ann[ann.length - 1] : null;
    const rTime = new Date(r.timestamp).getTime();
    const nearestPain = symptoms.length
      ? symptoms.reduce((best, s) =>
          Math.abs(new Date(s.recordedAt).getTime() - rTime) <
          Math.abs(new Date(best.recordedAt).getTime() - rTime)
            ? s
            : best,
        ).pain0to10
      : null;
    const result = evaluateReading(r, {
      baselineOhm,
      previousReading,
      photo: latestPhoto
        ? { edemaVisible: latestPhoto.edemaVisible, erythemaVisible: latestPhoto.erythemaVisible }
        : null,
      pain: nearestPain,
    });
    overall = result.overallLevel;
    findings = result.findings.map((f) => ({ label: f.label, detail: f.detail, level: f.level }));
  } else if (item?.kind === 'symptom') {
    const s = item.data;
    rows.push(
      { label: 'Fecha y hora', value: fullDate(s.recordedAt) },
      { label: 'Dolor', value: `${s.pain0to10}/10` },
      { label: 'Rigidez', value: `${s.stiffness0to10}/10` },
      { label: 'Hinchazón percibida', value: s.swellingPerception },
      { label: 'Comentario', value: s.comment || '—' },
    );
  } else if (item?.kind === 'photo') {
    const p = item.data;
    rows.push(
      { label: 'Fecha y hora', value: fullDate(p.capturedAt) },
      { label: 'Articulación', value: `${p.joint} / ${p.side}` },
      { label: 'Edema visible', value: p.assessment?.edemaVisible ?? '—' },
      { label: 'Eritema visible', value: p.assessment?.erythemaVisible ?? '—' },
      { label: 'Calidad de imagen', value: p.assessment?.imageQuality ?? '—' },
    );
  }

  return (
    <Modal visible={item != null} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <ThemedText type="subtitle" style={styles.sheetTitle}>
                {item ? KIND_LABEL[item.kind] : ''}
              </ThemedText>
              <Pressable onPress={onClose} style={[styles.close, { backgroundColor: theme.primarySoft }]}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
                  Cerrar ✕
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
              <Card>
                {rows.map((row, i) => (
                  <View
                    key={row.label}
                    style={[
                      styles.row,
                      { borderBottomColor: i === rows.length - 1 ? 'transparent' : theme.border },
                    ]}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {row.label}
                    </ThemedText>
                    <ThemedText type="smallBold" style={styles.rowValue}>
                      {row.value}
                    </ThemedText>
                  </View>
                ))}
              </Card>

              {findings.length > 0 ? (
                <Card>
                  <View style={styles.evalHeader}>
                    <ThemedText type="smallBold">Evaluación de la medición</ThemedText>
                    {overall ? (
                      <View style={[styles.badge, { backgroundColor: LEVEL_COLORS[overall] }]}>
                        <ThemedText type="small" style={styles.badgeText}>
                          {overall === 'alert'
                            ? 'Alerta'
                            : overall === 'watch'
                              ? 'Vigilar'
                              : overall === 'normal'
                                ? 'Normal'
                                : 'Sin datos'}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.findings}>
                    {findings.map((f) => (
                      <View key={f.label} style={styles.finding}>
                        <View style={[styles.dot, { backgroundColor: LEVEL_COLORS[f.level] }]} />
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
                    Evaluación por reglas con umbrales citados. NO es un diagnóstico.
                  </ThemedText>
                </Card>
              ) : null}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,20,30,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    maxHeight: '88%',
    paddingHorizontal: Spacing.four,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C7D0D8',
    marginTop: Spacing.two,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  sheetTitle: { fontSize: 22, lineHeight: 28, flex: 1 },
  close: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: Radii.pill },
  sheetBody: { paddingBottom: Spacing.four, gap: Spacing.three },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  evalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: Spacing.two + 2, paddingVertical: 3, borderRadius: Radii.pill },
  badgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  findings: { marginTop: Spacing.two + 2, gap: Spacing.two + 2 },
  finding: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 5 },
  findingText: { flex: 1 },
  detail: { lineHeight: 18, marginTop: 1 },
  note: { marginTop: Spacing.three, lineHeight: 17 },
});
