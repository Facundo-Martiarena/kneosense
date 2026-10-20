import { Platform } from 'react-native';

import type { PatientAuth } from '@/features/sync/syncClient';

/**
 * Minimal persistence for the patient session. On web (the main demo surface) it
 * uses localStorage so a refresh keeps you logged in; on native it falls back to
 * an in-memory value (re-login per launch — fine for the demo).
 */
const KEY = 'kneosense_patient_auth';
let mem: string | null = null;

function read(): string | null {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }
  return mem;
}

function write(value: string | null): void {
  if (Platform.OS === 'web') {
    try {
      if (value) window.localStorage.setItem(KEY, value);
      else window.localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable; session stays in memory for this load */
    }
    return;
  }
  mem = value;
}

export function loadAuth(): PatientAuth | null {
  const raw = read();
  if (!raw) return null;
  try {
    const a = JSON.parse(raw) as PatientAuth;
    return a?.token && a?.patientId ? a : null;
  } catch {
    return null;
  }
}

export function saveAuth(auth: PatientAuth | null): void {
  write(auth ? JSON.stringify(auth) : null);
}
