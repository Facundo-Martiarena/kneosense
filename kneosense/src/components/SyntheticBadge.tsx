import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';

/**
 * MANDATORY safety marker. Plan sections 10.1 and 10.3: the "datos sintéticos"
 * mark must never be removable. This component is intentionally not dismissible
 * and is rendered on every screen that shows data.
 */
export function SyntheticBadge({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.badge, compact && styles.compact]} accessibilityRole="text">
      <View style={styles.dot} />
      <ThemedText type="smallBold" style={styles.text}>
        DEMO · DATOS SINTÉTICOS
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'flex-start',
    backgroundColor: '#B45309',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radii.pill,
  },
  compact: {
    paddingVertical: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radii.pill,
    backgroundColor: '#FCD34D',
  },
  text: {
    color: '#FFFFFF',
    letterSpacing: 0.6,
    fontSize: 12,
  },
});
