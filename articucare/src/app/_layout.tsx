import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAppStore } from '@/state/appStore';

SplashScreen.preventAutoHideAsync();

/**
 * Root stack navigation. ArticuCare uses a stack (Welcome -> Panel -> sections)
 * instead of a tab bar because the MVP has 7 screens (plan section 8) and the
 * flow is linear: open app -> see demo -> pick a section.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    hydrate().catch(() => {
      // Persistence unavailable; the app continues with empty in-memory data.
    });
  }, [hydrate]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerBackTitle: 'Atrás' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="panel" options={{ title: 'Panel principal' }} />
        <Stack.Screen name="measurements" options={{ title: 'Mediciones' }} />
        <Stack.Screen name="photos" options={{ title: 'Fotos' }} />
        <Stack.Screen name="anatomy" options={{ title: 'Vista anatómica' }} />
        <Stack.Screen name="symptoms" options={{ title: 'Registro de síntomas' }} />
        <Stack.Screen name="history" options={{ title: 'Historial / resumen' }} />
      </Stack>
    </ThemeProvider>
  );
}
