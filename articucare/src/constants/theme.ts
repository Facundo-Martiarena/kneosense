/**
 * KneoSense visual identity — "teal clinical" per the mobile mockup.
 * Existing keys (text, background, backgroundElement, backgroundSelected,
 * textSecondary) are preserved so current consumers keep working; brand,
 * hero and info tokens are added. Every key exists in both light and dark.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // neutrals / surfaces
    text: '#14283C',
    textSecondary: '#728397',
    background: '#F6F9FB',
    backgroundElement: '#FFFFFF', // card surface
    backgroundSelected: '#EAF5F3', // pressed / selected (light teal)
    border: '#E7EDF2',
    // brand (teal) + accent (blue)
    primary: '#087F85',
    primaryAlt: '#0CA9A3',
    primaryPressed: '#066A6F',
    primaryOn: '#FFFFFF',
    primarySoft: '#EAF5F3',
    accent: '#3267DE',
    accentSoft: '#E7EEFD',
    // hero gradient + info box
    heroFrom: '#083B51',
    heroTo: '#076C74',
    info: '#436D70',
    infoBg: '#EAF5F3',
    infoBorder: '#D9ECEB',
    // feedback
    danger: '#DC2626',
    shadow: '#18374B',
  },
  dark: {
    text: '#E8EEF2',
    textSecondary: '#93A4B3',
    background: '#0E1720',
    backgroundElement: '#16232E',
    backgroundSelected: '#1D2F39',
    border: '#243440',
    primary: '#2FB6B0',
    primaryAlt: '#3FD0C7',
    primaryPressed: '#1E8E88',
    primaryOn: '#06201F',
    primarySoft: '#163A37',
    accent: '#5B8DEF',
    accentSoft: '#1A2A44',
    heroFrom: '#06303F',
    heroTo: '#065258',
    info: '#9EC6C6',
    infoBg: '#11302E',
    infoBorder: '#1C3F3C',
    danger: '#F87171',
    shadow: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

/** Elevation presets (iOS shadow* + Android elevation). */
export const Elevation = {
  none: {},
  sm: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
