import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Elevation, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Gradient brand square used in the header. */
export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <LinearGradient
      colors={['#0CA9A3', '#356EE2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.mark, { width: size, height: size, borderRadius: size * 0.35 }]}>
      <ThemedText style={{ color: '#FFFFFF', fontSize: size * 0.5 }}>✦</ThemedText>
    </LinearGradient>
  );
}

/** Teal gradient hero card. The pill doubles as a synthetic-data marker. */
export function Hero({
  small,
  label,
  desc,
  pill,
}: {
  small: string;
  label: string;
  desc: string;
  pill?: string;
}) {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={[theme.heroFrom, theme.heroTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}>
      <View style={styles.heroCircle} pointerEvents="none" />
      <ThemedText style={styles.heroSmall}>{small}</ThemedText>
      <ThemedText style={styles.heroLabel}>{label}</ThemedText>
      <ThemedText style={styles.heroDesc}>{desc}</ThemedText>
      {pill ? (
        <View style={styles.pill}>
          <View style={styles.pillDot} />
          <ThemedText style={styles.pillText}>{pill}</ThemedText>
        </View>
      ) : null}
    </LinearGradient>
  );
}

/** 2-up metric tile (label + icon chip, big number, caption). */
export function MetricTile({
  label,
  icon,
  value,
  caption,
}: {
  label: string;
  icon: IconName;
  value: string;
  caption: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.tile,
        Elevation.sm,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, shadowColor: theme.shadow },
      ]}>
      <View style={styles.tileTop}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <View style={[styles.chip, { backgroundColor: theme.primarySoft }]}>
          <Icon name={icon} size={18} color={theme.primary} />
        </View>
      </View>
      <ThemedText style={[styles.tileNum, { color: theme.text }]}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {caption}
      </ThemedText>
    </View>
  );
}

/** Quick-action button (icon chip + label), used in a 3-up grid. */
export function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <View style={[styles.actionChip, { backgroundColor: theme.primarySoft }]}>
        <Icon name={icon} size={21} color={theme.primary} />
      </View>
      <ThemedText type="small" style={{ color: theme.text, fontWeight: '700' }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** Section header with an optional trailing action link. */
export function SectionTitle({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <ThemedText style={[styles.sectionTitleText, { color: theme.text }]}>{title}</ThemedText>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** List row: title + subtitle, trailing chevron. */
export function RowItem({
  title,
  subtitle,
  onPress,
  last = false,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={[styles.rowItem, { borderBottomColor: last ? 'transparent' : theme.border }]}>
      <View style={styles.rowText}>
        <ThemedText type="smallBold">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <Icon name="chevron" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

/** Soft teal info box for safety / guidance notes. */
export function InfoBox({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.info, { backgroundColor: theme.infoBg, borderColor: theme.infoBorder }]}>
      <ThemedText type="small" style={{ color: theme.info, lineHeight: 20 }}>
        {children}
      </ThemedText>
    </View>
  );
}

/** Full-width primary (teal) or secondary (soft teal) button. */
export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}) {
  const theme = useTheme();
  const secondary = variant === 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        {
          backgroundColor: secondary
            ? theme.primarySoft
            : pressed
              ? theme.primaryPressed
              : theme.primary,
        },
        style,
      ]}>
      <ThemedText style={{ color: secondary ? theme.primary : theme.primaryOn, fontWeight: '700' }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: Radii.xxl, padding: Spacing.three + 5, overflow: 'hidden', minHeight: 170 },
  heroCircle: {
    position: 'absolute',
    right: -70,
    top: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 28,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  heroSmall: {
    color: '#B6DCE2',
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroLabel: { color: '#FFFFFF', fontSize: 23, fontWeight: '700', marginTop: 9, marginBottom: 3 },
  heroDesc: { color: '#D0E5E8', fontSize: 12, lineHeight: 18, maxWidth: 235 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 16,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6AE6CE' },
  pillText: { color: '#FFFFFF', fontSize: 11 },
  tile: {
    flex: 1,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    minHeight: 118,
  },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { width: 30, height: 30, borderRadius: Radii.sm, alignItems: 'center', justifyContent: 'center' },
  tileNum: { fontSize: 25, fontWeight: '800', letterSpacing: -0.7, marginTop: 11, marginBottom: 2 },
  action: {
    flex: 1,
    borderRadius: Radii.lg + 2,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 96,
  },
  actionChip: { width: 40, height: 40, borderRadius: Radii.md + 2, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.four - 2,
    marginBottom: Spacing.two + 4,
  },
  sectionTitleText: { fontSize: 17, fontWeight: '800', letterSpacing: -0.35 },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  rowText: { flex: 1 },
  info: {
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three - 2,
  },
  primary: {
    width: '100%',
    borderRadius: Radii.md + 3,
    paddingVertical: Spacing.three - 1,
    alignItems: 'center',
  },
});
