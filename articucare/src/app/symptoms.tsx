import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/state/appStore';
import { useCurrentCase } from '@/state/useCurrentCase';
import type { SymptomEntry } from '@/types';
import { fullDate } from '@/utils/date';
import { uid } from '@/utils/id';

const SWELLING: SymptomEntry['swellingPerception'][] = ['none', 'mild', 'moderate', 'severe'];
const SWELLING_LABELS: Record<SymptomEntry['swellingPerception'], string> = {
  none: 'Ninguna',
  mild: 'Leve',
  moderate: 'Moderada',
  severe: 'Intensa',
};

/**
 * Symptom log. Plan section 8 + RF-05: pain 0-10, perceived swelling, stiffness
 * and a free comment. These are self-reported perceptions, not measurements.
 */
export default function SymptomsScreen() {
  const demoCase = useCurrentCase();
  const theme = useTheme();
  const addSymptom = useAppStore((s) => s.addSymptom);
  const entries = useAppStore((s) =>
    demoCase ? s.symptomsForCase(demoCase.scenarioId) : ([] as SymptomEntry[]),
  );

  const [pain, setPain] = useState(0);
  const [stiffness, setStiffness] = useState(0);
  const [swelling, setSwelling] = useState<SymptomEntry['swellingPerception']>('none');
  const [comment, setComment] = useState('');

  if (!demoCase) {
    return (
      <Screen title="Registro de síntomas">
        <ThemedText>No hay escenario seleccionado.</ThemedText>
      </Screen>
    );
  }

  function save() {
    if (!demoCase) return;
    addSymptom({
      id: uid('sym'),
      caseId: demoCase.scenarioId,
      recordedAt: new Date().toISOString(),
      pain0to10: pain,
      swellingPerception: swelling,
      stiffness0to10: stiffness,
      comment: comment.trim() || undefined,
    });
    setPain(0);
    setStiffness(0);
    setSwelling('none');
    setComment('');
  }

  function Scale({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scale}>
        {Array.from({ length: 11 }, (_, n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            style={[
              styles.scaleBtn,
              {
                backgroundColor: value === n ? '#2563EB' : theme.backgroundElement,
              },
            ]}>
            <ThemedText type="smallBold" style={{ color: value === n ? '#FFFFFF' : theme.text }}>
              {n}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <Screen title="Registro de síntomas" subtitle="Percepción del paciente, no es una medición.">
      <Card>
        <ThemedText type="smallBold">Dolor (0-10)</ThemedText>
        <Scale value={pain} onChange={setPain} />
      </Card>

      <Card>
        <ThemedText type="smallBold">Rigidez (0-10)</ThemedText>
        <Scale value={stiffness} onChange={setStiffness} />
      </Card>

      <Card>
        <ThemedText type="smallBold">Hinchazón percibida</ThemedText>
        <View style={styles.segment}>
          {SWELLING.map((s) => (
            <Pressable
              key={s}
              onPress={() => setSwelling(s)}
              accessibilityRole="button"
              style={[
                styles.segmentBtn,
                { backgroundColor: swelling === s ? '#2563EB' : theme.backgroundElement },
              ]}>
              <ThemedText type="small" style={{ color: swelling === s ? '#FFFFFF' : theme.text }}>
                {SWELLING_LABELS[s]}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <ThemedText type="smallBold">Comentario</ThemedText>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Notas opcionales"
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        />
      </Card>

      <Pressable onPress={save} accessibilityRole="button" style={styles.saveBtn}>
        <ThemedText style={styles.saveText}>Guardar registro</ThemedText>
      </Pressable>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Registros ({entries.length})
      </ThemedText>
      {entries.map((e) => (
        <Card key={e.id}>
          <ThemedText type="smallBold">{fullDate(e.recordedAt)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Dolor {e.pain0to10}/10 · rigidez {e.stiffness0to10}/10 · hinchazón{' '}
            {SWELLING_LABELS[e.swellingPerception]}
          </ThemedText>
          {e.comment ? <ThemedText type="small">{e.comment}</ThemedText> : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scale: { gap: Spacing.one, paddingVertical: Spacing.one },
  scaleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  segmentBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  sectionTitle: { marginTop: Spacing.two },
});
