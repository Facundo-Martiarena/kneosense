import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LineChart, type ChartPoint } from '@/features/measurements/LineChart';

/**
 * Fullscreen, landscape view of the bioimpedance chart. Opening it locks the
 * device to landscape; closing restores portrait. Locking degrades gracefully
 * (try/catch) if the native module is unavailable so the modal still renders.
 */
export function FullscreenChart({
  visible,
  onClose,
  points,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  points: ChartPoint[];
  title?: string;
}) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (!visible) return;
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, [visible]);

  // Use the long edge as chart width so it works whether rotation has settled yet.
  const chartWidth = Math.max(width, height) - Spacing.five * 2;
  const chartHeight = Math.min(width, height) - Spacing.six * 2;

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
      supportedOrientations={['landscape', 'portrait']}>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <ThemedText type="smallBold">{title ?? 'Bioimpedancia sintética'}</ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.close, { backgroundColor: theme.primarySoft }]}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              Cerrar ✕
            </ThemedText>
          </Pressable>
        </View>
        <View style={styles.chartWrap}>
          <LineChart
            points={points}
            width={chartWidth}
            height={Math.max(180, chartHeight)}
            color={theme.primary}
            unit="Ω"
            yTicks={6}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: Spacing.three },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  close: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radii.pill,
  },
  chartWrap: { flex: 1, justifyContent: 'center' },
});
