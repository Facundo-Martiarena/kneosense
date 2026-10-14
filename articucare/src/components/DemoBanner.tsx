import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

/**
 * Non-dismissible academic-use banner. Plan section 10.2 safety note:
 * "no utilizar este MVP como dispositivo sanitario real". Rendered at the top
 * of data screens to keep the academic/non-clinical framing always visible.
 */
export function DemoBanner({ text }: { text?: string }) {
  return (
    <View style={styles.banner} accessibilityRole="text">
      <ThemedText type="small" style={styles.text}>
        {text ??
          'Prototipo académico con datos simulados. No es un dispositivo sanitario ni emite diagnósticos.'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  text: {
    color: '#DBEAFE',
  },
});
