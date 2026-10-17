import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Icon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  ActionButton,
  MetricTile,
  PrimaryButton,
  SectionTitle,
} from '@/components/ui';
import { BACKOFFICE_URL } from '@/config';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { PatchAssessment } from '@/features/assessment/PatchAssessment';
import { LineChart, type ChartPoint } from '@/features/measurements/LineChart';
import { PatientPicker } from '@/features/patients/PatientPicker';
import { buildSyncPayload, postSync, uploadPhoto } from '@/features/sync/syncClient';
import { useTheme } from '@/hooks/use-theme';
import { getDemoCase, scenarioLabels } from '@/data/mocks/loadScenarios';
import { usePhotosForCase, useReadingsForCase, useSymptomsForCase } from '@/state/selectors';
import { useCurrentCase } from '@/state/useCurrentCase';

const JOINT_LABELS: Record<string, string> = {
  knee: 'rodilla',
  wrist: 'muñeca',
  ankle: 'tobillo',
  elbow: 'codo',
};

/**
 * Home dashboard (mobile mockup). Opens directly on a preselected demo scenario;
 * the profile button switches scenarios. The hero pill + bottom note carry the
 * mandatory synthetic-data markers.
 */
export default function HomeScreen() {
  const theme = useTheme();
  const demoCase = useCurrentCase();
  const symptoms = useSymptomsForCase(demoCase?.scenarioId ?? null);
  const readings = useReadingsForCase(demoCase?.scenarioId ?? null);
  const photos = usePhotosForCase(demoCase?.scenarioId ?? null);
  const [syncing, setSyncing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function syncToDoctor() {
    if (!demoCase || syncing) return;
    setSyncing(true);
    try {
      const ann = getDemoCase(demoCase.scenarioId)?.photoAnnotations ?? [];
      const latestPhoto = ann.length ? ann[ann.length - 1] : null;
      const payload = buildSyncPayload({
        patientId: demoCase.scenarioId,
        name: scenarioLabels[demoCase.scenarioId]?.title ?? demoCase.patientId,
        joint: demoCase.joint,
        side: 'left',
        edemaVisible: latestPhoto?.edemaVisible ?? 'uncertain',
        erythemaVisible: latestPhoto?.erythemaVisible ?? 'non_existent',
        pain0to10: symptoms[0]?.pain0to10 ?? null,
        readings,
      });
      const res = await postSync(payload);
      let uploaded = 0;
      for (const p of photos) {
        try {
          await uploadPhoto(demoCase.scenarioId, p);
          uploaded += 1;
        } catch {
          // keep going; report the count
        }
      }
      Alert.alert(
        'Sincronizado',
        `Se enviaron ${res.readings} mediciones y ${uploaded}/${photos.length} fotos al panel médico.`,
      );
    } catch (e) {
      Alert.alert(
        'No se pudo sincronizar',
        `${String(e)}\n\nRevisá que el servidor esté accesible en ${BACKOFFICE_URL} (en el teléfono usá la IP LAN, no localhost).`,
      );
    } finally {
      setSyncing(false);
    }
  }

  const joint = demoCase ? (JOINT_LABELS[demoCase.joint] ?? demoCase.joint) : 'articulación';
  // Trend + counts reflect the patch readings in the DB (live for created patients).
  const points: ChartPoint[] = readings.map((r) => ({
    label: '',
    value: r.bioimpedanceOhm,
    invalid: r.quality === 'invalid_contact',
    at: r.timestamp,
  }));
  const latestPain = symptoms[0]?.pain0to10;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/kneosense-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="KneoSense"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Elegir o crear paciente"
            onPress={() => setPickerOpen(true)}
            style={[styles.circle, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <Icon name="user" size={21} color={theme.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.hello}>Tu espacio de recuperación</ThemedText>
          <ThemedText style={[styles.big, { color: theme.text }]}>
            Hola, ¿cómo estás hoy?
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
            Seguimiento de la evolución de tu {joint}.
          </ThemedText>

          <PatchAssessment scenarioId={demoCase?.scenarioId ?? null} />

          <SectionTitle title="¿Qué querés hacer?" />
          <View style={styles.actions}>
            <ActionButton icon="pulse" label="Medición" onPress={() => router.push('/measurements')} />
            <ActionButton icon="camera" label="Fotografía" onPress={() => router.push('/photos')} />
            <ActionButton icon="plus" label="Síntomas" onPress={() => router.push('/symptoms')} />
          </View>

          <SectionTitle
            title="Últimos registros"
            actionLabel="Ver historial →"
            onAction={() => router.push('/history')}
          />
          <View style={styles.metrics}>
            <MetricTile
              label="Síntomas"
              icon="heart"
              value={latestPain != null ? `${latestPain}/10` : '—'}
              caption="Último registro"
            />
            <MetricTile
              label="Mediciones"
              icon="pulse"
              value={`${readings.length}`}
              caption="Registros del parche"
            />
          </View>

          <SectionTitle
            title="Tendencia de registros"
            actionLabel="Detalle →"
            onAction={() => router.push('/measurements')}
          />
          <Card>
            <View style={styles.chartLabel}>
              <ThemedText type="smallBold">Evolución ilustrativa</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Últimas semanas
              </ThemedText>
            </View>
            <LineChart points={points} color={theme.primary} unit="Ω" />
          </Card>

          <View style={styles.sync}>
            <PrimaryButton
              label={syncing ? 'Sincronizando…' : 'Sincronizar con el médico'}
              variant="secondary"
              onPress={syncToDoctor}
            />
          </View>

          <ThemedText style={[styles.note, { color: theme.textSecondary }]}>
            Prototipo académico · Los datos mostrados son sintéticos y no constituyen un diagnóstico
            médico.
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
      <PatientPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  logo: { width: 72, height: 72, marginLeft: -6 },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: Spacing.three + 4, paddingBottom: Spacing.five },
  hello: { fontSize: 13, color: '#7B8E9D', marginTop: 4, marginBottom: 2 },
  big: { fontSize: 30, fontWeight: '800', letterSpacing: -1.1, lineHeight: 34, marginBottom: 8 },
  sub: { marginBottom: Spacing.four - 2 },
  sync: { marginTop: Spacing.three },
  metrics: { flexDirection: 'row', gap: Spacing.two + 4 },
  chartLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  actions: { flexDirection: 'row', gap: Spacing.two + 2 },
  note: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Spacing.four,
  },
});
