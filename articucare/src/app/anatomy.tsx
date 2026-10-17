import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radii, Spacing } from '@/constants/theme';
import { AnatomyView } from '@/features/visuals/AnatomyView';
import { Interactive3DJoint } from '@/features/visuals/Interactive3DJoint';
import { useCurrentCase } from '@/state/useCurrentCase';

const JOINT_LABELS: Record<string, string> = {
  knee: 'Rodilla',
  wrist: 'Muñeca',
  ankle: 'Tobillo',
  elbow: 'Codo',
};

type ViewMode = '2_5d' | '3d';

/**
 * Anatomy 2.5D view. Plan section 6 + RF-07. Shows a generic illustrative joint
 * with an angle selector and a PERMANENT interpretive label. The highlighted
 * region is a scenario-driven demo overlay, never a real anatomical fluid map
 * and never derived from the patient photo (plan section 6.1).
 */
export default function AnatomyScreen() {
  const demoCase = useCurrentCase();
  const theme = useTheme();
  const [mode, setMode] = useState<ViewMode>('2_5d'); // 2.5D stays the default
  const [detailOpen, setDetailOpen] = useState(false);
  const { width } = useWindowDimensions();
  // Responsive: fill the card width (screen padding 16*2 + card padding 16*2 = 64), capped.
  const viewSize = Math.min(width - Spacing.three * 4, 360);

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

  const jointLabel = JOINT_LABELS[demoCase.joint] ?? demoCase.joint;

  return (
    <Screen
      title={`Tu ${jointLabel.toLowerCase()}`}
      subtitle="Dónde se coloca el parche y qué zona estamos siguiendo.">
      <View style={styles.modeRow}>
        {(
          [
            { key: '2_5d', label: 'Vista simple' },
            { key: '3d', label: '3D (experimental)' },
          ] as { key: ViewMode; label: string }[]
        ).map((m) => (
          <Pressable
            key={m.key}
            onPress={() => setMode(m.key)}
            accessibilityRole="button"
            style={[
              styles.modeBtn,
              { backgroundColor: mode === m.key ? theme.primary : theme.backgroundElement },
            ]}>
            <ThemedText
              type="small"
              style={{ color: mode === m.key ? theme.primaryOn : theme.text }}>
              {m.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Card>
        {mode === '2_5d' ? (
          <View style={styles.center}>
            <AnatomyView angle="front" highlight={highlight} size={viewSize} />
          </View>
        ) : (
          <>
            <View style={styles.center}>
              <Interactive3DJoint highlight={highlight} size={viewSize} />
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
              Arrastrá para rotar. Es el parche de sensores de bioimpedancia (ilustrativo), con su
              módulo electrónico, LED de estado y electrodos de contacto; se adhiere sobre la
              articulación.
            </ThemedText>
          </>
        )}
      </Card>

      {/* Plain-language lead: what you're looking at. */}
      <Card>
        <ThemedText style={{ color: theme.text, lineHeight: 22 }}>
          El bloque verde muestra dónde va el parche sobre tu {jointLabel.toLowerCase()}. La zona
          coloreada es una ilustración de la zona en seguimiento, no una foto ni una medición real.
        </ThemedText>
      </Card>

      {/* Progressive disclosure: technical disclaimers tucked behind a toggle. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => setDetailOpen((o) => !o)}
        style={[styles.toggle, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold" style={{ color: theme.primary }}>
          {detailOpen ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: theme.primary }}>
          {detailOpen ? '▴' : '▾'}
        </ThemedText>
      </Pressable>

      {detailOpen ? (
        <Card>
          {mode === '3d' ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.detailLine}>
              Modo experimental (spike de compatibilidad): corre en Expo Go vía expo-gl; el
              rendimiento en iOS/Android debe validarse en dispositivo real antes de adoptar 3D como
              dependencia de producción.
            </ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary" style={styles.detailLine}>
            Representación ilustrativa: no reconstruida a partir de la fotografía. La zona coloreada
            representa una variable demo, no un mapa anatómico real del líquido tisular; los cambios
            de color son ilustrativos, no prueba de edema.
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.detailLine}>
            El bloque verde indica la posición ilustrativa del parche de sensores de bioimpedancia
            sobre la articulación. En el MVP sus lecturas son simuladas.
          </ThemedText>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  modeRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  modeBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  hint: { marginTop: Spacing.two, textAlign: 'center' },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
  },
  detailLine: { lineHeight: 19, marginBottom: Spacing.one },
});
