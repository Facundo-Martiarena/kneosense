import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { areComparable, mockAssess } from '@/features/assessment/mockAssessment';
import { useAppStore } from '@/state/appStore';
import { useCurrentCase } from '@/state/useCurrentCase';
import type { PhotoRecord } from '@/types';
import { fullDate } from '@/utils/date';
import { uid } from '@/utils/id';

/**
 * Photos screen. Plan section 4 + RF-03/RF-04: guided capture or gallery,
 * date metadata, and side-by-side temporal comparison. When two photos are not
 * comparable the app requests a new capture instead of emitting a comparison
 * (plan section 3.2). EXIF location is disabled (plan section 4.1 step 4).
 */
export default function PhotosScreen() {
  const demoCase = useCurrentCase();
  const addPhoto = useAppStore((s) => s.addPhoto);
  const photos = useAppStore((s) =>
    demoCase ? s.photosForCase(demoCase.scenarioId) : ([] as PhotoRecord[]),
  );
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

  const [a, b] = [photos[photos.length - 2], photos[photos.length - 1]];
  const comparable = a?.assessment && b?.assessment && areComparable(a.assessment, b.assessment);

  return (
    <Screen
      title="Fotos estandarizadas"
      subtitle="Silueta de encuadre, luz homogénea, distancia y ángulo consistentes.">
      <View style={styles.actions}>
        <Pressable
          disabled={busy}
          style={styles.btn}
          onPress={() => addFrom('camera')}
          accessibilityRole="button">
          <ThemedText style={styles.btnText}>Capturar con cámara</ThemedText>
        </Pressable>
        <Pressable
          disabled={busy}
          style={styles.btn}
          onPress={() => addFrom('gallery')}
          accessibilityRole="button">
          <ThemedText style={styles.btnText}>Elegir de galería</ThemedText>
        </Pressable>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Guía: colocá la articulación centrada, con buena luz y a distancia fija. La app no infiere
        volumen ni emite diagnóstico.
      </ThemedText>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Comparación de las dos fotos más recientes
      </ThemedText>
      {a && b ? (
        comparable ? (
          <View style={styles.compareRow}>
            {[a, b].map((p) => (
              <Card key={p.id} style={styles.comparePane}>
                <Image source={{ uri: p.uri }} style={styles.thumb} resizeMode="cover" />
                <ThemedText type="small">{fullDate(p.capturedAt)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  edema {p.assessment?.edemaVisible} · eritema {p.assessment?.erythemaVisible}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  origen: {p.assessment?.origin}
                </ThemedText>
              </Card>
            ))}
          </View>
        ) : (
          <Card>
            <ThemedText type="smallBold" style={styles.warn}>
              Fotos no comparables
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Una de las imágenes requiere nueva toma (calidad insuficiente). No se emite
              comparación.
            </ThemedText>
          </Card>
        )
      ) : (
        <Card>
          <ThemedText type="small" themeColor="textSecondary">
            Agregá al menos dos fotos para comparar.
          </ThemedText>
        </Card>
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
            </Card>
          ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  btn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  btnText: { color: '#FFFFFF', fontWeight: '600' },
  sectionTitle: { marginTop: Spacing.two },
  compareRow: { flexDirection: 'row', gap: Spacing.two },
  comparePane: { flex: 1, gap: Spacing.half },
  thumb: { width: '100%', height: 140, borderRadius: Spacing.two, backgroundColor: '#E5E7EB' },
  warn: { color: '#B45309' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  gridItem: { width: '47%', gap: Spacing.half },
});
