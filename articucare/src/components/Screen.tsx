import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DemoBanner } from '@/components/DemoBanner';
import { SyntheticBadge } from '@/components/SyntheticBadge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenProps = {
  title: string;
  subtitle?: string;
  /** When true (default) the mandatory synthetic-data markers are rendered. */
  showSafetyMarkers?: boolean;
  children: ReactNode;
};

/**
 * Shared scrollable screen container. Enforces the mandatory DEMO banner and
 * synthetic badge on every data screen (plan sections 10.1/10.3) so individual
 * screens cannot forget them.
 */
export function Screen({ title, subtitle, showSafetyMarkers = true, children }: ScreenProps) {
  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic">
          {showSafetyMarkers && (
            <View style={styles.markers}>
              <SyntheticBadge />
              <DemoBanner />
            </View>
          )}
          <ThemedText type="subtitle">{title}</ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          ) : null}
          <View style={styles.body}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, alignItems: 'center' },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  markers: { gap: Spacing.two, marginBottom: Spacing.one },
  body: { gap: Spacing.three, marginTop: Spacing.two },
});
