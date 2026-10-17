import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, NavCard } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { measurementRepository } from '@/features/measurements/MockMeasurementRepository';
import { useCurrentCase } from '@/state/useCurrentCase';
import type { ImpedanceMeasurement } from '@/types';
import { daysSince, fullDate } from '@/utils/date';

const JOINT_LABELS: Record<string, string> = {
  knee: 'Rodilla',
  wrist: 'Muñeca',
  ankle: 'Tobillo',
  elbow: 'Codo',
};

/**
 * Main panel. Plan section 8: joint, days since fictional intervention, latest
 * synthetic datum and quick access to each section.
 */
export default function PanelScreen() {
  const demoCase = useCurrentCase();
  const theme = useTheme();
  const [latest, setLatest] = useState<ImpedanceMeasurement | null>(null);

  useEffect(() => {
    let active = true;
    if (demoCase) {
      measurementRepository.getLatest(demoCase.scenarioId).then((m) => {
        if (active) setLatest(m);
      });
    }
    return () => {
      active = false;
    };
  }, [demoCase]);

  if (!demoCase) {
    return (
      <Screen title="Panel principal">
        <ThemedText>No hay escenario seleccionado.</ThemedText>
        <NavCard title="Volver a elegir escenario" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const days = latest ? daysSince(demoCase.interventionDate, latest.timestamp) : 0;
  const latestValue =
    latest && latest.impedanceMagnitudeOhm != null
      ? `${latest.impedanceMagnitudeOhm.toFixed(1)} Ω @ ${latest.frequencyHz / 1000} kHz`
      : 'medición no disponible';

  return (
    <Screen
      title={JOINT_LABELS[demoCase.joint] ?? demoCase.joint}
      subtitle={`Paciente ficticio ${demoCase.patientId}`}>
      <Card>
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          Días desde la intervención ficticia
        </ThemedText>
        <View style={styles.statRow}>
          <ThemedText style={[styles.statValue, { color: theme.primary }]}>{days}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.statUnit}>
            días
          </ThemedText>
        </View>
      </Card>

      <Card>
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          Último dato sintético {latest ? `· ${fullDate(latest.timestamp)}` : ''}
        </ThemedText>
        <ThemedText type="subtitle" style={styles.measureValue}>
          {latestValue}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Fuente: {latest?.source ?? 'mock'} · cambio observado en la medición sintética
        </ThemedText>
      </Card>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Acceso rápido
      </ThemedText>
      <View style={styles.nav}>
        <NavCard
          title="Mediciones"
          subtitle="Gráfico de bioimpedancia sintética"
          onPress={() => router.push('/measurements')}
        />
        <NavCard
          title="Fotos"
          subtitle="Captura guiada y comparación temporal"
          onPress={() => router.push('/photos')}
        />
        <NavCard
          title="Vista anatómica"
          subtitle="Representación 2.5D ilustrativa"
          onPress={() => router.push('/anatomy')}
        />
        <NavCard
          title="Registro de síntomas"
          subtitle="Dolor, rigidez e hinchazón percibida"
          onPress={() => router.push('/symptoms')}
        />
        <NavCard
          title="Historial / resumen"
          subtitle="Línea de tiempo y exportación"
          onPress={() => router.push('/history')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 12 },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  statValue: { fontSize: 52, lineHeight: 56, fontWeight: '800' },
  statUnit: { fontSize: 16 },
  measureValue: { fontSize: 24, lineHeight: 30 },
  sectionTitle: { marginTop: Spacing.three, marginBottom: Spacing.one },
  nav: { gap: Spacing.two },
});
