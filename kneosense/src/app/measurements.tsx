import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/themed-text';
import { InfoBox, PrimaryButton, RowItem, SectionTitle } from '@/components/ui';
import { Radii, Spacing } from '@/constants/theme';
import { generateNextReading } from '@/data/mocks/sensorReadings';
import { PatchAssessment } from '@/features/assessment/PatchAssessment';
import { FullscreenChart } from '@/features/measurements/FullscreenChart';
import { LineChart, type ChartPoint } from '@/features/measurements/LineChart';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/appStore';
import { useReadingsForCase } from '@/state/selectors';
import { useCurrentCase } from '@/state/useCurrentCase';
import { fullDate, shortDate } from '@/utils/date';

/**
 * Measurements screen (mobile mockup): action hero, illustrative trend chart
 * (expandable to landscape), recent synthetic readings as a grouped list, and a
 * clinical-use note. Readings are synthetic in the MVP (plan section 3.2).
 */
export default function MeasurementsScreen() {
  const demoCase = useCurrentCase();
  const theme = useTheme();
  const addSensorReading = useAppStore((s) => s.addSensorReading);
  const readings = useReadingsForCase(demoCase?.scenarioId ?? null);
  const [expanded, setExpanded] = useState(false);

  if (!demoCase) {
    return (
      <Screen title="Bioimpedancia">
        <ThemedText>No hay escenario seleccionado.</ThemedText>
      </Screen>
    );
  }

  // Chart + list reflect the patch readings in the DB, so new measurements and
  // created patients update live (demo scenarios are seeded with readings).
  const points: ChartPoint[] = readings.map((r) => ({
    label: shortDate(r.timestamp),
    value: r.bioimpedanceOhm,
    invalid: r.quality === 'invalid_contact',
    at: r.timestamp,
  }));
  const recent = [...readings].reverse().slice(0, 5);

  async function newMeasurement() {
    if (!demoCase) return;
    const latest = readings.length ? readings[readings.length - 1] : null;
    await addSensorReading(generateNextReading(demoCase.scenarioId, latest));
    Alert.alert('Medición agregada', 'Se registró una nueva lectura sintética del parche en la base local.');
  }

  return (
    <Screen title="Mediciones" subtitle="Tu última lectura del parche y qué significa.">
      <PatchAssessment scenarioId={demoCase.scenarioId} />

      <PrimaryButton label="+ Tomar nueva medición" onPress={newMeasurement} />

      <SectionTitle title="Evolución" />
      <Card>
        <View style={styles.chartHeader}>
          <ThemedText type="smallBold">Bioimpedancia (Ω)</ThemedText>
          {points.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ampliar gráfica a pantalla completa"
              onPress={() => setExpanded(true)}
              style={[styles.expandBtn, { backgroundColor: theme.primarySoft }]}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                ⤢ Ampliar
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
        <LineChart points={points} color={theme.primary} unit="Ω" />
      </Card>

      <SectionTitle title="Historial" />
      <Card>
        {recent.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Sin mediciones todavía. Tocá “+ Tomar nueva medición” para registrar la primera.
          </ThemedText>
        ) : (
          recent.map((r, i) => {
            const invalid = r.quality === 'invalid_contact' || r.bioimpedanceOhm == null;
            return (
              <RowItem
                key={r.id}
                title={invalid ? 'Medición no disponible' : `${r.bioimpedanceOhm?.toFixed(1)} Ω`}
                subtitle={`${fullDate(r.timestamp)} · dato del parche`}
                last={i === recent.length - 1}
              />
            );
          })
        )}
      </Card>

      <InfoBox>
        La bioimpedancia no debe interpretarse de forma aislada como diagnóstico clínico.
      </InfoBox>

      <FullscreenChart
        visible={expanded}
        onClose={() => setExpanded(false)}
        points={points}
        title="Bioimpedancia sintética (demo)"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  expandBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
  },
});
