import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/themed-text';
import { InfoBox, PrimaryButton, RowItem, SectionTitle } from '@/components/ui';
import { Radii, Spacing } from '@/constants/theme';
import { scenarioLabels } from '@/data/mocks/loadScenarios';
import { fetchBackendReadings, pairDevice, type BackendReadings } from '@/features/sync/syncClient';
import { useTheme } from '@/hooks/use-theme';
import { useCurrentCase } from '@/state/useCurrentCase';
import { fullDate } from '@/utils/date';

/**
 * Pair a physical patch to this patient using the 6-char code the device shows,
 * then read the patch's real readings from the backend. The patient id is this
 * patient's scenario id (same id the doctor web and the device route to).
 */
const REFRESH_MS = 20_000;

export default function PairScreen() {
  const demoCase = useCurrentCase();
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<BackendReadings | null>(null);

  const scenarioId = demoCase?.scenarioId ?? null;

  // Auto-refresh: the patch posts on its own (~every 60s); poll the backend so new
  // readings appear here without tapping. Also shows data if already paired before.
  useEffect(() => {
    if (!scenarioId) return;
    let active = true;
    const load = () =>
      fetchBackendReadings(scenarioId)
        .then((d) => {
          if (active) setData(d);
        })
        .catch(() => {
          /* unpaired/no data yet → keep empty state */
        });
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [scenarioId]);

  if (!demoCase) {
    return (
      <Screen title="Vincular parche">
        <ThemedText>No hay paciente seleccionado.</ThemedText>
      </Screen>
    );
  }

  const patientId = demoCase.scenarioId;
  const name = scenarioLabels[demoCase.scenarioId]?.title ?? demoCase.patientId;
  const joint = demoCase.joint;

  async function refresh() {
    try {
      setData(await fetchBackendReadings(patientId));
    } catch {
      // keep whatever we had; the UI shows an empty-state hint
    }
  }

  async function doPair() {
    const c = code.trim().toUpperCase();
    if (c.length < 4) {
      Alert.alert('Código incompleto', 'Ingresá el código de 6 caracteres que muestra el parche.');
      return;
    }
    setBusy(true);
    try {
      await pairDevice(c, patientId, name, joint);
      await refresh();
      Alert.alert('Parche vinculado', 'Listo: ya vas a ver las lecturas de tu parche acá.');
    } catch (e) {
      Alert.alert('No se pudo vincular', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const recent = [...(data?.readings ?? [])].reverse().slice(0, 8);
  const connected = recent.length > 0;

  return (
    <Screen title="Vincular parche" subtitle="Conectá tu parche físico a tu seguimiento.">
      <Card>
        <ThemedText type="smallBold">1. Encendé el parche</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Al conectarse, el parche muestra un código de 6 caracteres. Lo vas a ver en la pantalla o
          en el monitor del dispositivo.
        </ThemedText>
      </Card>

      <SectionTitle title="2. Ingresá el código" />
      <TextInput
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="Ej. Q7YH8J"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement },
        ]}
      />
      <PrimaryButton label={busy ? 'Vinculando…' : 'Vincular parche'} onPress={doPair} />

      <SectionTitle title="Lecturas de tu parche" actionLabel="Actualizar" onAction={refresh} />
      {connected ? (
        <>
          <Card>
            {recent.map((r, i) => (
              <RowItem
                key={r.id}
                title={
                  r.tempAffectedC != null
                    ? `${r.tempAffectedC} °C zona · ${r.tempReferenceC ?? '—'} °C ref`
                    : 'Lectura sin temperatura'
                }
                subtitle={`${fullDate(r.timestamp)} · parche`}
                last={i === recent.length - 1}
              />
            ))}
          </Card>
          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            Se actualiza solo cada {REFRESH_MS / 1000} s. El parche envía según su configuración
            (≈1 min).
          </ThemedText>
          {data?.evaluation ? <InfoBox>{data.evaluation.recommendation}</InfoBox> : null}
        </>
      ) : (
        <InfoBox>
          Todavía no llegaron lecturas. Ingresá el código para vincular, o esperá a que el parche
          envíe (se actualiza solo cada {REFRESH_MS / 1000} s).
        </InfoBox>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: 'center',
    fontWeight: '700',
  },
  note: { marginTop: Spacing.one },
});
