export type SignalLevel = 'normal' | 'watch' | 'alert' | 'unavailable';

export type Finding = { key: string; level: SignalLevel; label: string; detail: string };

export type Reading = {
  id: string;
  timestamp: string;
  tempReferenceC: number | null;
  tempAffectedC: number | null;
  bioimpedanceOhm: number | null;
  activityIndex: number | null;
  batteryPct: number;
  quality: string;
};

export type PatientListItem = {
  id: string;
  name: string;
  joint: string;
  side: string;
  overallLevel: SignalLevel;
  lastReadingAt: string | null;
};

export type Evaluation = {
  findings: Finding[];
  overallLevel: SignalLevel;
  recommendation: string;
};

export type Photo = {
  id: string;
  url: string;
  capturedAt: string;
  edema: string | null;
  erythema: string | null;
  quality: string | null;
};

export type PatientDetail = {
  patient: {
    id: string;
    name: string;
    joint: string;
    side: string;
    edemaVisible: string;
    erythemaVisible: string;
    pain0to10: number | null;
  };
  readings: Reading[];
  latestReading: Reading | null;
  evaluation: Evaluation | null;
  photos?: Photo[];
};

export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3001';

const TOKEN_KEY = 'kneosense_token';
let authToken: string | null = localStorage.getItem(TOKEN_KEY);

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Thrown on 401 so the UI can send the doctor back to the login screen. */
export class UnauthorizedError extends Error {}

async function authGet<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (r.status === 401) {
    setAuthToken(null);
    throw new UnauthorizedError('unauthorized');
  }
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

export async function login(email: string, password: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error('Credenciales inválidas');
  const { token } = (await r.json()) as { token: string };
  setAuthToken(token);
}

export function logout(): void {
  fetch(`${API_BASE}/api/logout`, {
    method: 'POST',
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  }).catch(() => {});
  setAuthToken(null);
}

export function fetchPatients(): Promise<PatientListItem[]> {
  return authGet<PatientListItem[]>('/api/patients');
}

export function fetchPatient(id: string): Promise<PatientDetail> {
  return authGet<PatientDetail>(`/api/patients/${id}`);
}
