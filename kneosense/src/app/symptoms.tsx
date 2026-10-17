import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/themed-text';
import { InfoBox, PrimaryButton } from '@/components/ui';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/appStore';
import { useCurrentCase } from '@/state/useCurrentCase';
import { uid } from '@/utils/id';

/**
 * Symptom log (mobile mockup): a discomfort slider + free observations. These
 * are self-reported perceptions, not measurements (plan RF-05).
 */
export default function SymptomsScreen() {
  const demoCase = useCurrentCase();
  const theme = useTheme();
  const addSymptom = useAppStore((s) => s.addSymptom);

  const [pain, setPain] = useState(3);
  const [obs, setObs] = useState('');

  if (!demoCase) {
    return (
      <Screen title="Síntomas">
        <ThemedText>No hay escenario seleccionado.</ThemedText>
      </Screen>
    );
  }

  async function save() {
    if (!demoCase) return;
    await addSymptom({
      id: uid('sym'),
      caseId: demoCase.scenarioId,
      recordedAt: new Date().toISOString(),
      pain0to10: pain,
      swellingPerception: 'none',
      stiffness0to10: 0,
      comment: obs.trim() || undefined,
    });
    setObs('');
    Alert.alert('Registro guardado', 'Tu registro de síntomas quedó guardado en la demo.');
  }

  return (
    <Screen title="Síntomas" subtitle="Guardá cómo te sentís para complementar las mediciones.">
      <ThemedText type="smallBold" style={styles.field}>
        Nivel de molestia: {pain}/10
      </ThemedText>
      <Slider
        minimumValue={0}
        maximumValue={10}
        step={1}
        value={pain}
        onValueChange={setPain}
        minimumTrackTintColor={theme.primary}
        maximumTrackTintColor={theme.border}
        thumbTintColor={theme.primary}
      />

      <ThemedText type="smallBold" style={styles.field}>
        Observaciones
      </ThemedText>
      <TextInput
        value={obs}
        onChangeText={setObs}
        placeholder="¿Notaste alguna molestia, rigidez o cambio?"
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
      />

      <PrimaryButton label="Guardar registro" onPress={save} />

      <InfoBox>
        Este registro es orientativo y no sustituye una valoración por un profesional sanitario.
      </InfoBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: Spacing.two, marginBottom: Spacing.one },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radii.md,
    padding: Spacing.three - 2,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14,
  },
});
