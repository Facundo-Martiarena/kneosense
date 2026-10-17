import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Non-dismissible academic-use note. Plan section 10.2: "no utilizar este MVP
 * como dispositivo sanitario real". Styled as the mockup's soft info box and
 * kept on every data screen so the academic/non-clinical framing stays visible.
 */
export function DemoBanner({ text }: { text?: string }) {
  const theme = useTheme();
  return (
    <View
      style={[styles.banner, { backgroundColor: theme.infoBg, borderColor: theme.infoBorder }]}
      accessibilityRole="text">
      <ThemedText type="small" style={{ color: theme.info, lineHeight: 20 }}>
        {text ??
          'Prototipo académico con datos simulados. No es un dispositivo sanitario ni emite diagnósticos.'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three - 2,
  },
});
