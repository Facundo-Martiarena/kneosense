import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { AnatomyView, type AnatomyAngle } from '@/features/visuals/AnatomyView';
import { useCurrentCase } from '@/state/useCurrentCase';

const JOINT_LABELS: Record<string, string> = {
  knee: 'Rodilla',
  wrist: 'Muñeca',
  ankle: 'Tobillo',
  elbow: 'Codo',
};

/**
 * Anatomy 2.5D view. Plan section 6 + RF-07. Shows a generic illustrative joint
 * with an angle selector and a PERMANENT interpretive label. The highlighted
 * region is a scenario-driven demo overlay, never a real anatomical fluid map
 * and never derived from the patient photo (plan section 6.1).
 */
export default function AnatomyScreen() {
  const demoCase = useCurrentCase();
  const theme = useTheme();
  const [angle, setAngle] = useState<AnatomyAngle>('front');

  if (!demoCase) {
    return (
      <Screen title="Vista anatómica">
        <ThemedText>No hay escenario seleccionado.</ThemedText>
      </Screen>
    );
  }

  // Purely illustrative demo intensity. NOT a measurement of edema/fluid.
  const highlight =
    demoCase.scenarioId === 'tendencia_variable'
      ? 0.6
      : demoCase.scenarioId === 'medicion_invalida'
        ? 0.3
        : 0.15;

  return (
    <Screen title={`${JOINT_LABELS[demoCase.joint] ?? demoCase.joint} · 2.5D`}>
      <Card>
        <View style={styles.center}>
          <AnatomyView angle={angle} highlight={highlight} />
        </View>
        <View style={styles.angleRow}>
          {(['front', 'side'] as AnatomyAngle[]).map((a) => (
            <Pressable
              key={a}
              onPress={() => setAngle(a)}
              accessibilityRole="button"
              style={[
                styles.angleBtn,
                {
                  backgroundColor:
                    angle === a ? theme.backgroundSelected : theme.background,
                  borderColor: theme.backgroundSelected,
                },
              ]}>
              <ThemedText type="small">{a === 'front' ? 'Frente' : 'Lateral'}</ThemedText>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <ThemedText type="smallBold" style={styles.legend}>
          Representación ilustrativa: no reconstruida a partir de la fotografía.
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          La zona coloreada representa una variable demo, no un mapa anatómico real del líquido
          tisular. Los cambios de color son ilustrativos, no prueba de edema.
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  angleRow: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'center', marginTop: Spacing.two },
  angleBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  legend: { color: '#B45309' },
});
