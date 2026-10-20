import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { fetchBackendReadings, type BackendReadings } from '@/features/sync/syncClient';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/appStore';
import { useReadingsForCase } from '@/state/selectors';
import { useCurrentCase } from '@/state/useCurrentCase';
import { fullDate, shortDate } from '@/utils/date';

// How often the app re-pulls the paired patch's readings from the backend. The
// patch itself samples on its own firmware interval (≈1 min); this is just the
// UI refresh cadence.
const REFRESH_MS = 20_000;

const LEVEL_UI: Record<string, { icon: string; headline: string; color: string }> = {
  alert: { icon: '⚠️', headline: 'Consultá a tu equipo', color: '#DC2626' },
  watch: { icon: '👀', headline: 'Conviene vigilar', color: '#D97706' },
  normal: { icon: '✅', headline: 'Todo en orden', color: '#16A34A' },
  unavailable: { icon: '•', headline: 'Sin datos aún', color: '#94A2AF' },
};

/**
 * Measurements screen. If the patient has a paired physical patch, the chart and
 * history show the REAL readings from the backend (temperature), refreshed every
 * REFRESH_MS. Otherwise it falls back to the local synthetic demo readings.
 */
export default function MeasurementsScreen() {
  const demoCase = useCurrentCase();
  const theme = useTheme();
  const addSensorReading = useAppStore((s) => s.addSensorReading);
  const auth = useAppStore((s) => s.auth);
  const readings = useReadingsForCase(demoCase?.scenarioId ?? null);
  const [expanded, setExpanded] = useState(false);
  const [backend, setBackend] = useState<BackendReadings | null>(null);

  const patientId = auth?.patientId ?? null;
  const token = auth?.token ?? null;

  // Poll the backend for the logged-in patient's patch readings; null = no patch.
  useEffect(() => {
    if (!patientId || !token) return;
    let active = true;
    const load = () =>
      fetchBackendReadings(patientId, token)
        .then((d) => {
          if (active) setBackend(d.readings.length ? d : null);
        })
        .catch(() => {
          if (active) setBackend(null);
        });
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [patientId, token]);

  if (!demoCase) {
    return (
      <Screen title="Mediciones">
        <ThemedText>No hay escenario seleccionado.</ThemedText>
      </Screen>
    );
  }

  const deviceReadings = backend?.readings ?? [];
  const connected = deviceReadings.length > 0;

  // Device source → plot the affected-zone temperature (the patch's real signal).
  // Local source → plot bioimpedance (the synthetic demo signal).
  const points: ChartPoint[] = connected
    ? deviceReadings.map((r) => ({
        label: shortDate(r.timestamp),
        value: r.tempAffectedC,
        invalid: r.tempAffectedC == null,
        at: r.timestamp,
      }))
    : readings.map((r) => ({
        label: shortDate(r.timestamp),
        value: r.bioimpedanceOhm,
        invalid: r.quality === 'invalid_contact',
        at: r.timestamp,
      }));

  const unit = connected ? '°C' : 'Ω';
  const chartTitle = connected ? 'Temperatura zona afectada (°C)' : 'Bioimpedancia (Ω)';
  const recentDevice = [...deviceReadings].reverse().slice(0, 5);
  const recentLocal = [...readings].reverse().slice(0, 5);

  async function newMeasurement() {
    if (!demoCase) return;
    const latest = readings.length ? readings[readings.length - 1] : null;
    await addSensorReading(generateNextReading(demoCase.scenarioId, latest));
    Alert.alert('Medición agregada', 'Se registró una nueva lectura sintética del parche en la base local.');
  }

  const verdict = connected && backend?.evaluation ? LEVEL_UI[backend.evaluation.overallLevel] : null;

  return (
    <Screen
      title="Mediciones"
      subtitle={connected ? 'En vivo desde tu parche físico.' : 'Tu última lectura del parche y qué significa.'}>
      {connected && verdict && backend?.evaluation ? (
        <Card style={[styles.verdict, { borderLeftColor: verdict.color }]}>
          <View style={styles.verdictHead}>
            <ThemedText style={styles.verdictIcon}>{verdict.icon}</ThemedText>
            <ThemedText style={[styles.verdictHeadline, { color: theme.text }]}>{verdict.headline}</ThemedText>
            <ThemedText type="small" style={[styles.livePill, { color: theme.primary, backgroundColor: theme.primarySoft }]}>
              📡 parche
            </ThemedText>
          </View>
          <ThemedText style={[styles.verdictReco, { color: theme.text }]}>{backend.evaluation.recommendation}</ThemedText>
        </Card>
      ) : (
        <PatchAssessment scenarioId={demoCase.scenarioId} />
      )}

      {!connected ? (
        <PrimaryButton label="+ Tomar nueva medición" onPress={newMeasurement} />
      ) : null}
      <PrimaryButton
        label={connected ? 'Gestionar parche' : 'Vincular parche físico'}
        variant="secondary"
        onPress={() => router.push('/pair')}
      />

      <SectionTitle title="Evolución" />
      <Card>
        <View style={styles.chartHeader}>
          <ThemedText type="smallBold">{chartTitle}</ThemedText>
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
        <LineChart points={points} color={theme.primary} unit={unit} />
        {connected ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.liveNote}>
            En vivo desde tu parche · la app actualiza cada {REFRESH_MS / 1000} s.
          </ThemedText>
        ) : null}
      </Card>

      <SectionTitle title="Historial" />
      <Card>
        {connected ? (
          recentDevice.map((r, i) => {
            const invalid = r.tempAffectedC == null;
            return (
              <RowItem
                key={r.id}
                title={
                  invalid
                    ? 'Medición no disponible'
                    : `${r.tempAffectedC} °C zona · ${r.tempReferenceC ?? '—'} °C ref`
                }
                subtitle={`${fullDate(r.timestamp)} · parche`}
                last={i === recentDevice.length - 1}
              />
            );
          })
        ) : recentLocal.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Sin mediciones todavía. Tocá “+ Tomar nueva medición” para registrar la primera.
          </ThemedText>
        ) : (
          recentLocal.map((r, i) => {
            const invalid = r.quality === 'invalid_contact' || r.bioimpedanceOhm == null;
            return (
              <RowItem
                key={r.id}
                title={invalid ? 'Medición no disponible' : `${r.bioimpedanceOhm?.toFixed(1)} Ω`}
                subtitle={`${fullDate(r.timestamp)} · dato del parche`}
                last={i === recentLocal.length - 1}
              />
            );
          })
        )}
      </Card>

      <InfoBox>
        {connected
          ? 'La temperatura del parche no debe interpretarse de forma aislada como diagnóstico clínico.'
          : 'La bioimpedancia no debe interpretarse de forma aislada como diagnóstico clínico.'}
      </InfoBox>

      <FullscreenChart
        visible={expanded}
        onClose={() => setExpanded(false)}
        points={points}
        title={connected ? 'Temperatura del parche (°C)' : 'Bioimpedancia sintética (demo)'}
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
  liveNote: { marginTop: Spacing.two },
  verdict: { borderLeftWidth: 5 },
  verdictHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  verdictIcon: { fontSize: 26 },
  verdictHeadline: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, flex: 1 },
  livePill: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Radii.pill, overflow: 'hidden' },
  verdictReco: { marginTop: Spacing.two, fontSize: 15, lineHeight: 22 },
});
