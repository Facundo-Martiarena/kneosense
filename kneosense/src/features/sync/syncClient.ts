import { BACKOFFICE_URL } from '@/config';
import type { AttributeState, PhotoRecord, SensorReading } from '@/types';

/**
 * Pushes the patient's local data to the doctor backoffice API. The phone is one
 * patient: it syncs its identity + sensor readings so the doctor's web can see
 * them. Pure payload builder + a thin POST, kept out of the UI.
 */

export type SyncReading = {
  id: string;
  timestamp: string;
  tempReferenceC: number | null;
  tempAffectedC: number | null;
  bioimpedanceOhm: number | null;
  activityIndex: number | null;
  batteryPct: number;
  quality: SensorReading['quality'];
};

export type SyncPayload = {
  patient: {
    id: string;
    name: string;
    joint: string;
    side: string;
    edemaVisible: AttributeState;
    erythemaVisible: AttributeState;
    pain0to10: number | null;
  };
  readings: SyncReading[];
};

export type SyncInput = {
  patientId: string;
  name: string;
  joint: string;
  side: string;
  edemaVisible: AttributeState;
  erythemaVisible: AttributeState;
  pain0to10: number | null;
  readings: SensorReading[];
};

/** Builds the sync payload from the local store slice. Pure + deterministic. */
export function buildSyncPayload(input: SyncInput): SyncPayload {
  return {
    patient: {
      id: input.patientId,
      name: input.name,
      joint: input.joint,
      side: input.side,
      edemaVisible: input.edemaVisible,
      erythemaVisible: input.erythemaVisible,
      pain0to10: input.pain0to10,
    },
    readings: input.readings.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      tempReferenceC: r.tempReferenceC,
      tempAffectedC: r.tempAffectedC,
      bioimpedanceOhm: r.bioimpedanceOhm,
      activityIndex: r.activityIndex,
      batteryPct: r.batteryPct,
      quality: r.quality,
    })),
  };
}

export type SyncResult = { ok: boolean; patientId: string; readings: number };

/** POSTs the payload to the backoffice. Throws on network/HTTP error. */
export async function postSync(payload: SyncPayload, baseUrl = BACKOFFICE_URL): Promise<SyncResult> {
  const res = await fetch(`${baseUrl}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`sync ${res.status}`);
  return res.json();
}

/** Uploads one photo (multipart) to the patient's record on the backoffice. */
export async function uploadPhoto(
  patientId: string,
  photo: PhotoRecord,
  baseUrl = BACKOFFICE_URL,
): Promise<void> {
  const form = new FormData();
  // React Native file part: { uri, name, type }.
  form.append('file', { uri: photo.uri, name: `${photo.id}.jpg`, type: 'image/jpeg' } as never);
  form.append('photoId', photo.id);
  form.append('capturedAt', photo.capturedAt);
  if (photo.assessment) {
    form.append('edema', photo.assessment.edemaVisible);
    form.append('erythema', photo.assessment.erythemaVisible);
    form.append('quality', photo.assessment.imageQuality);
  }
  const res = await fetch(`${baseUrl}/api/patients/${patientId}/photos`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`photo ${res.status}`);
}

export type PairResult = { ok: boolean; deviceId: string; patientId: string };

/** Links a physical patch to this patient using the code shown by the device. */
export async function pairDevice(
  code: string,
  patientId: string,
  name: string,
  joint: string,
  baseUrl = BACKOFFICE_URL,
): Promise<PairResult> {
  const res = await fetch(`${baseUrl}/api/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, patientId, name, joint }),
  });
  if (res.status === 404) throw new Error('Código inválido');
  if (!res.ok) throw new Error(`pair ${res.status}`);
  return res.json();
}

export type BackendReadings = {
  patient: { id: string; name: string };
  readings: SyncReading[];
  evaluation: { overallLevel: string; recommendation: string } | null;
};

/** Reads this patient's own readings from the backend (no doctor token). */
export async function fetchBackendReadings(
  patientId: string,
  baseUrl = BACKOFFICE_URL,
): Promise<BackendReadings> {
  const res = await fetch(`${baseUrl}/api/patients/${patientId}/readings`);
  if (!res.ok) throw new Error(`readings ${res.status}`);
  return res.json();
}
