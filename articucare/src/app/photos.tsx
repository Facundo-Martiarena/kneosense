import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/themed-text';
import { InfoBox, PrimaryButton } from '@/components/ui';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { areComparable, mockAssess } from '@/features/assessment/mockAssessment';
import { useAppStore } from '@/state/appStore';
import { usePhotosForCase } from '@/state/selectors';
import { useCurrentCase } from '@/state/useCurrentCase';
import type { PhotoRecord } from '@/types';
import { fullDate } from '@/utils/date';
import { uid } from '@/utils/id';

/**
 * Photos screen. Plan section 4 + RF-03/RF-04: guided capture, date metadata and
 * side-by-side temporal comparison of the two most recent photos. Photos are
 * persisted in SQLite and can be deleted. Not a diagnosis (plan section 3.2).
 */
export default function PhotosScreen() {
  const demoCase = useCurrentCase();
  const theme = useTheme();
  const addPhoto = useAppStore((s) => s.addPhoto);
  const removePhoto = useAppStore((s) => s.removePhoto);
  const photos = usePhotosForCase(demoCase?.scenarioId ?? null);
  const [busy, setBusy] = useState(false);

  if (!demoCase) {
    return (
      <Screen title="Fotos">
        <ThemedText>No hay escenario seleccionado.</ThemedText>
      </Screen>
    );
  }

  async function addFrom(source: 'camera' | 'gallery') {
    if (!demoCase) return;
    setBusy(true);
    try {
      const perm =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso para continuar.');
        return;
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], exif: false })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], exif: false });
      if (result.canceled || !result.assets?.[0]) return;

      const id = uid('photo');
      const record: PhotoRecord = {
        id,
        caseId: demoCase.scenarioId,
        uri: result.assets[0].uri,
        capturedAt: new Date().toISOString(),
        joint: demoCase.joint,
        side: 'left',
        assessment: mockAssess(id),
      };
      await addPhoto(record);
    } catch (e) {
      Alert.alert('No se pudo cargar la imagen', String(e));
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete(id: string) {
    Alert.alert('Eliminar foto', '¿Eliminar esta foto? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void removePhoto(id) },
    ]);
  }

  const older = photos[photos.length - 2];
  const newer = photos[photos.length - 1];
  const comparable =
    older?.assessment && newer?.assessment && areComparable(older.assessment, newer.assessment);

  return (
    <Screen title="Fotos de la rodilla" subtitle="Seguí la evolución visual de la articulación operada.">
      <PrimaryButton label="Capturar con cámara" onPress={() => addFrom('camera')} />
      <PrimaryButton label="Elegir de galería" variant="secondary" onPress={() => addFrom('gallery')} />

      <InfoBox>
        Cómo sacar la foto, para que sirva comparar:{'\n'}• Qué: la articulación operada (rodilla),
        descubierta y centrada.{'\n'}• Cómo: luz pareja sin sombras, misma distancia (~30 cm) y el
        mismo ángulo cada vez, fondo neutro.{'\n'}• Para qué: comparar hinchazón y enrojecimiento a
        lo largo del tiempo. No es un diagnóstico.
      </InfoBox>

      <PrimaryButton
        label="Ver vista anatómica"
        variant="secondary"
        onPress={() => router.push('/anatomy')}
      />

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Comparación de las 2 fotos más recientes
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Se comparan automáticamente las 2 últimas fotos que saques.
      </ThemedText>

      {older && newer ? (
        comparable ? (
          <View style={styles.compareRow}>
            {[
              { p: older, role: 'Anterior' },
              { p: newer, role: 'Más reciente' },
            ].map(({ p, role }) => (
              <Card key={p.id} style={styles.comparePane}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
                  {role}
                </ThemedText>
                <Image source={{ uri: p.uri }} style={styles.thumb} resizeMode="cover" />
                <ThemedText type="small">{fullDate(p.capturedAt)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  edema {p.assessment?.edemaVisible} · eritema {p.assessment?.erythemaVisible}
                </ThemedText>
              </Card>
            ))}
          </View>
        ) : (
          <InfoBox>
            Las 2 fotos no son comparables: una requiere nueva toma (calidad insuficiente). Sacá otra
            con mejor luz/encuadre. No se emite comparación.
          </InfoBox>
        )
      ) : (
        <InfoBox>
          {photos.length === 0
            ? 'Todavía no hay fotos. Sacá 2 para comparar la evolución.'
            : 'Ya tenés 1 foto. Sacá 1 más para poder comparar.'}
        </InfoBox>
      )}

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Historial de fotos ({photos.length})
      </ThemedText>
      <View style={styles.grid}>
        {photos
          .slice()
          .reverse()
          .map((p) => (
            <Card key={p.id} style={styles.gridItem}>
              <Image source={{ uri: p.uri }} style={styles.thumb} resizeMode="cover" />
              <ThemedText type="small">{fullDate(p.capturedAt)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                calidad: {p.assessment?.imageQuality}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => confirmDelete(p.id)}
                style={styles.deleteBtn}>
                <ThemedText type="smallBold" style={{ color: theme.danger }}>
                  Eliminar
                </ThemedText>
              </Pressable>
            </Card>
          ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { marginTop: Spacing.two },
  compareRow: { flexDirection: 'row', gap: Spacing.two },
  comparePane: { flex: 1, gap: Spacing.half },
  thumb: { width: '100%', height: 140, borderRadius: Radii.md, backgroundColor: '#E5E7EB' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  gridItem: { width: '47%', gap: Spacing.half },
  deleteBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
});
