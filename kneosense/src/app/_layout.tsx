import { DarkTheme, DefaultTheme, Tabs, ThemeProvider } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { type ColorValue, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Icon, type IconName } from '@/components/icons';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/state/appStore';

SplashScreen.preventAutoHideAsync();

const TAB_ICON: Record<string, IconName> = {
  index: 'home',
  measurements: 'pulse',
  photos: 'camera',
  symptoms: 'heart',
  history: 'clock',
};

/**
 * Bottom-tab navigation (mobile mockup): Inicio, Mediciones, Fotos, Síntomas,
 * Historial. A default demo scenario is preselected in the store, so the app
 * opens directly on the Home tab. panel/anatomy stay routable but are not tabs.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    hydrate().catch(() => {
      // Persistence unavailable; the app continues with empty in-memory data.
    });
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, [hydrate]);

  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.backgroundElement,
      text: palette.text,
      border: palette.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <AnimatedSplashOverlay />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: palette.textSecondary,
          tabBarStyle: {
            backgroundColor: palette.backgroundElement,
            borderTopColor: palette.border,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
          sceneStyle: { backgroundColor: palette.background },
        }}>
        <Tabs.Screen name="index" options={tab('Inicio', 'index')} />
        <Tabs.Screen name="measurements" options={tab('Mediciones', 'measurements')} />
        <Tabs.Screen name="photos" options={tab('Fotos', 'photos')} />
        <Tabs.Screen name="symptoms" options={tab('Síntomas', 'symptoms')} />
        <Tabs.Screen name="history" options={tab('Historial', 'history')} />
        <Tabs.Screen name="panel" options={{ href: null }} />
        <Tabs.Screen name="anatomy" options={{ href: null }} />
        <Tabs.Screen name="pair" options={{ href: null }} />
      </Tabs>
    </ThemeProvider>
  );
}

function tab(title: string, route: keyof typeof TAB_ICON) {
  return {
    title,
    tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => (
      <Icon name={TAB_ICON[route]} size={size ?? 22} color={color as string} strokeWidth={2} />
    ),
  };
}
