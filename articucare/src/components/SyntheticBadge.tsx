import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

/**
 * MANDATORY safety marker. Plan sections 10.1 and 10.3: the "datos sintéticos"
 * mark must never be removable. This component is intentionally not dismissible
 * and is rendered on every screen that shows data.
 */
export function SyntheticBadge({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.badge, compact && styles.compact]} accessibilityRole="text">
      <ThemedText type="smallBold" style={styles.text}>
        DEMO · DATOS SINTÉTICOS
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#B45309',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
  compact: {
    paddingVertical: 2,
  },
  text: {
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
