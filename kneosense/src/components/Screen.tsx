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
 * Shared scrollable screen container for the tab screens. Renders the mockup's
 * page-heading typography and enforces the mandatory synthetic-data markers
 * (plan sections 10.1/10.3) so individual screens cannot forget them.
 */
export function Screen({ title, subtitle, showSafetyMarkers = true, children }: ScreenProps) {
  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic">
          {showSafetyMarkers ? (
            <View style={styles.markers}>
              <SyntheticBadge />
            </View>
          ) : null}
          <ThemedText style={styles.heading}>{title}</ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
              {subtitle}
            </ThemedText>
          ) : null}
          <View style={styles.body}>{children}</View>
          {showSafetyMarkers ? <DemoBanner /> : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  content: { paddingHorizontal: Spacing.three + 4, paddingTop: Spacing.three, paddingBottom: Spacing.five },
  markers: { marginBottom: Spacing.two },
  heading: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginBottom: 6 },
  sub: { marginBottom: Spacing.two, lineHeight: 20 },
  body: { gap: Spacing.three, marginTop: Spacing.two },
});
