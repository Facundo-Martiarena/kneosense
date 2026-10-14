import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NavCard } from '@/components/Card';
import { DemoBanner } from '@/components/DemoBanner';
import { SyntheticBadge } from '@/components/SyntheticBadge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { demoCases, scenarioLabels } from '@/data/mocks/loadScenarios';
import { useAppStore } from '@/state/appStore';

/**
 * Welcome / demo screen. Plan section 8 "Bienvenida / demo": academic-use
 * notice + access to synthetic scenarios (plan section 3.2).
 */
export default function WelcomeScreen() {
  const selectCase = useAppStore((s) => s.selectCase);

  function openScenario(scenarioId: string) {
    selectCase(scenarioId);
    router.push('/panel');
  }

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <SyntheticBadge />
          <ThemedText type="title" style={styles.title}>
            ArticuCare AI
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Seguimiento postoperatorio articular · prototipo universitario
          </ThemedText>
        </View>

        <DemoBanner text="Prototipo académico con datos 100% simulados. No evalúa una operación real ni emite diagnósticos." />

        <ThemedText type="smallBold">Elegí un escenario de demostración</ThemedText>
        <View style={styles.list}>
          {demoCases.map((c) => {
            const label = scenarioLabels[c.scenarioId] ?? {
              title: c.scenarioId,
              description: `Paciente ficticio ${c.patientId}`,
            };
            return (
              <NavCard
                key={c.scenarioId}
                title={label.title}
                subtitle={`${label.description} · ${c.patientId}`}
                onPress={() => openScenario(c.scenarioId)}
              />
            );
          })}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: { gap: Spacing.two, marginTop: Spacing.four },
  title: { fontSize: 40, lineHeight: 44 },
  list: { gap: Spacing.two },
});
