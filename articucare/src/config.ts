/**
 * Runtime config. The backoffice URL is read from an Expo public env var so it
 * can point at the doctor API server. On a physical device, `localhost` is the
 * PHONE — set EXPO_PUBLIC_BACKOFFICE_URL to the server's LAN IP (e.g.
 * http://192.168.1.50:3001) when running the sync.
 */
export const BACKOFFICE_URL =
  process.env.EXPO_PUBLIC_BACKOFFICE_URL ?? 'http://localhost:3001';
