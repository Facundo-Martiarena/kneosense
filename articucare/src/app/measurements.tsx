import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { LineChart, type ChartPoint } from '@/features/measurements/LineChart';
import { measurementRepository } from '@/features/measurements/MockMeasurementRepository';
import { useCurrentCase } from '@/state/useCurrentCase';
import type { ImpedanceMeasurement } from '@/types';
import { fullDate, shortDate } from '@/utils/date';

/**
 * Measurements screen. Plan section 8 + RF-02: synthetic bioimpedance history
 * with unit, frequency, valid/invalid signal and source=mock. Invalid readings
 * render "medición no disponible" and are never fabricated (plan section 3.2).
 */
export default function MeasurementsScreen() {
  const demoCase = useCurrentCase();
  const [measurements, setMeasurements] = useState<ImpedanceMeasurement[]>([]);

  useEffect(() => {
    let active = true;
    if (demoCase) {
      measurementRepository.listForCase(demoCase.scenarioId).then((m) => {
        if (active) setMeasurements(m);
      });
    }
    return () => {
      active = false;
    };
  }, [demoCase]);

  if (!demoCase) {
    return (
      <Screen title="Mediciones">
        <ThemedText>No hay escenario seleccionado.</ThemedText>
      </Screen>
    );
  }

  const points: ChartPoint[] = measurements.map((m) => ({
    label: shortDate(m.timestamp),
    value: m.impedanceMagnitudeOhm,
    invalid: m.quality === 'invalid_contact',
  }));

  const frequency = measurements[0]?.frequencyHz;

  return (
    <Screen
      title="Bioimpedancia sintética"
      subtitle={frequency ? `Magnitud (Ω) · frecuencia ${frequency / 1000} kHz` : undefined}>
      <Card>
        <LineChart points={points} />
      </Card>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Serie temporal
      </ThemedText>
      {measurements.map((m) => {
        const invalid = m.quality === 'invalid_contact' || m.impedanceMagnitudeOhm == null;
        return (
          <Card key={m.id}>
            <View style={styles.row}>
              <ThemedText type="smallBold">{fullDate(m.timestamp)}</ThemedText>
              <ThemedText
                type="small"
                themeColor={invalid ? 'textSecondary' : 'text'}
                style={invalid ? styles.invalid : undefined}>
                {invalid
                  ? 'medición no disponible'
                  : `${m.impedanceMagnitudeOhm?.toFixed(1)} Ω · fase ${m.phaseDegrees?.toFixed(2)}°`}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {m.joint}/{m.side} · fuente {m.source} · {m.quality}
            </ThemedText>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { marginTop: Spacing.two },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invalid: { color: '#DC2626' },
});
