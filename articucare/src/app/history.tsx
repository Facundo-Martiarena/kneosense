import { Platform, Pressable, Share, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { buildSummary } from '@/features/export/buildSummary';
import { useAppStore } from '@/state/appStore';
import { useCurrentCase } from '@/state/useCurrentCase';
import { fullDate } from '@/utils/date';

type TimelineItem = { at: string; label: string };

/**
 * History / summary screen. Plan section 8 + RF-08: timeline across the
 * synthetic series, photos and symptoms, plus export of the demo case.
 */
export default function HistoryScreen() {
  const demoCase = useCurrentCase();
  const photos = useAppStore((s) => (demoCase ? s.photosForCase(demoCase.scenarioId) : []));
  const symptoms = useAppStore((s) => (demoCase ? s.symptomsForCase(demoCase.scenarioId) : []));

  if (!demoCase) {
    return (
      <Screen title="Historial / resumen">
        <ThemedText>No hay escenario seleccionado.</ThemedText>
      </Screen>
    );
  }

  const timeline: TimelineItem[] = [
    ...demoCase.measurements.map((m) => ({
      at: m.timestamp,
      label:
        m.impedanceMagnitudeOhm != null
          ? `Medición ${m.impedanceMagnitudeOhm.toFixed(1)} Ω`
          : 'Medición no disponible',
    })),
    ...photos.map((p) => ({ at: p.capturedAt, label: 'Foto agregada' })),
    ...symptoms.map((s) => ({
      at: s.recordedAt,
      label: `Síntomas (dolor ${s.pain0to10}/10)`,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  async function onExport() {
    if (!demoCase) return;
    const summary = buildSummary(demoCase, photos, symptoms);
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message: summary }
          : { message: summary, title: 'Resumen ArticuCare (DEMO)' },
      );
    } catch {
      // Sharing dismissed/unsupported; the summary stays available on screen.
    }
  }

  return (
    <Screen title="Historial / resumen">
      <Pressable onPress={onExport} accessibilityRole="button" style={styles.exportBtn}>
        <ThemedText style={styles.exportText}>Exportar resumen (DEMO)</ThemedText>
      </Pressable>
      <ThemedText type="small" themeColor="textSecondary">
        El resumen exportado incluye el sello de datos sintéticos y los límites de uso.
      </ThemedText>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Línea de tiempo ({timeline.length})
      </ThemedText>
      <View style={styles.timeline}>
        {timeline.map((t, i) => (
          <Card key={`${t.at}-${i}`}>
            <ThemedText type="small" themeColor="textSecondary">
              {fullDate(t.at)}
            </ThemedText>
            <ThemedText type="small">{t.label}</ThemedText>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  exportBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  exportText: { color: '#FFFFFF', fontWeight: '700' },
  sectionTitle: { marginTop: Spacing.two },
  timeline: { gap: Spacing.two },
});
