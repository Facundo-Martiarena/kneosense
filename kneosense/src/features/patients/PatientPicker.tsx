import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui';
import { Radii, Spacing } from '@/constants/theme';
import { demoCases, scenarioLabels } from '@/data/mocks/loadScenarios';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/appStore';
import type { Joint } from '@/types';

const JOINTS: { key: Joint; label: string }[] = [
  { key: 'knee', label: 'Rodilla' },
  { key: 'wrist', label: 'Muñeca' },
  { key: 'ankle', label: 'Tobillo' },
  { key: 'elbow', label: 'Codo' },
];

/** Patient selector: pick a demo scenario or a created patient, or create one. */
export function PatientPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const patients = useAppStore((s) => s.patients);
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);
  const selectCase = useAppStore((s) => s.selectCase);
  const createPatient = useAppStore((s) => s.createPatient);

  const [name, setName] = useState('');
  const [joint, setJoint] = useState<Joint>('knee');
  const [busy, setBusy] = useState(false);

  function pick(id: string) {
    selectCase(id);
    onClose();
  }

  async function create() {
    if (busy) return;
    setBusy(true);
    try {
      await createPatient(name, joint);
      setName('');
      setJoint('knee');
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const demoRows = demoCases.map((c) => ({
    id: c.scenarioId,
    name: scenarioLabels[c.scenarioId]?.title ?? c.scenarioId,
    tag: 'demo',
  }));
  const createdRows = patients.map((p) => ({ id: p.id, name: p.name, tag: 'creado' }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.title}>
                Pacientes
              </ThemedText>
              <Pressable onPress={onClose} style={[styles.close, { backgroundColor: theme.primarySoft }]}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
                  Cerrar ✕
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              {[...createdRows, ...demoRows].map((r) => {
                const active = r.id === selectedCaseId;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => pick(r.id)}
                    style={[
                      styles.row,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">{r.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {r.tag === 'demo' ? 'Escenario de demostración' : 'Paciente creado'}
                      </ThemedText>
                    </View>
                    {active ? (
                      <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />
                    ) : null}
                  </Pressable>
                );
              })}

              <ThemedText type="smallBold" style={styles.createTitle}>
                Crear paciente nuevo
              </ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nombre del paciente"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement },
                ]}
              />
              <View style={styles.joints}>
                {JOINTS.map((j) => (
                  <Pressable
                    key={j.key}
                    onPress={() => setJoint(j.key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: joint === j.key ? theme.primary : theme.backgroundElement,
                        borderColor: joint === j.key ? theme.primary : theme.border,
                      },
                    ]}>
                    <ThemedText type="small" style={{ color: joint === j.key ? theme.primaryOn : theme.text }}>
                      {j.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              <PrimaryButton
                label={busy ? 'Creando…' : 'Crear y seleccionar'}
                onPress={create}
              />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  title: { fontSize: 22, lineHeight: 28 },
  close: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: Radii.pill },
  body: { paddingBottom: Spacing.four, gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  activeDot: { width: 10, height: 10, borderRadius: 5 },
  createTitle: { marginTop: Spacing.three },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radii.md,
    padding: Spacing.three - 2,
    fontSize: 15,
  },
  joints: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
