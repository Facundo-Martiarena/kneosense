import { useState } from 'react';
import { Alert, Image, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/ui';
import { MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { patientLogin, patientRegister } from '@/features/sync/syncClient';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/appStore';

/** Patient login / registration gate. On success it stores the session in the
 * app store (persisted), which lets the rest of the app render. */
export function LoginScreen() {
  const theme = useTheme();
  const setAuth = useAppStore((s) => s.setAuth);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || password.length < 4) {
      Alert.alert('Faltan datos', 'Ingresá tu email y una contraseña de al menos 4 caracteres.');
      return;
    }
    setBusy(true);
    try {
      const auth =
        mode === 'register'
          ? await patientRegister(email.trim(), password, name.trim() || email.trim())
          : await patientLogin(email.trim(), password);
      setAuth(auth);
    } catch (e) {
      Alert.alert('No se pudo', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = [
    styles.input,
    { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Image
            source={require('../../../assets/images/kneosense-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="KneoSense"
          />
          <ThemedText style={[styles.title, { color: theme.text }]}>
            {mode === 'register' ? 'Crear cuenta' : 'Ingresar'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
            Tu espacio de seguimiento postoperatorio.
          </ThemedText>

          <Card style={styles.card}>
            {mode === 'register' ? (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor={theme.textSecondary}
                style={inputStyle}
              />
            ) : null}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              secureTextEntry
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
            />
            <PrimaryButton
              label={busy ? 'Un momento…' : mode === 'register' ? 'Crear cuenta' : 'Ingresar'}
              onPress={submit}
            />
            <PrimaryButton
              variant="secondary"
              label={mode === 'register' ? 'Ya tengo cuenta' : 'Crear una cuenta'}
              onPress={() => setMode(mode === 'register' ? 'login' : 'register')}
            />
          </Card>

          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            Prototipo · datos sintéticos. No es un dispositivo médico.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four, gap: Spacing.two },
  logo: { width: 96, height: 96, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' },
  sub: { textAlign: 'center', marginBottom: Spacing.two },
  card: { gap: Spacing.two + 2 },
  input: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  note: { textAlign: 'center', marginTop: Spacing.three },
});
