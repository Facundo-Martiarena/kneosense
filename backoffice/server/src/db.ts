import { createClient } from '@libsql/client';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import type { Device, MeasurementQuality, Patient, Photo, SensorReading } from './types.js';

const here = dirname(fileURLToPath(import.meta.url));
// Persistence: Turso (libSQL) in production via TURSO_DATABASE_URL (+ auth token).
// Falls back to a local libSQL file for development, so the same async code path
// is exercised everywhere. intMode 'number' keeps INTEGER columns as JS numbers.
const url =
  process.env.TURSO_DATABASE_URL ?? `file:${process.env.DB_PATH ?? join(here, '..', 'kneosense-backoffice.db')}`;
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN, intMode: 'number' });

await db.executeMultiple(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    joint TEXT NOT NULL,
    side TEXT NOT NULL,
    edema TEXT NOT NULL,
    erythema TEXT NOT NULL,
    pain INTEGER
  );
  CREATE TABLE IF NOT EXISTS sensor_readings (
    id TEXT PRIMARY KEY NOT NULL,
    patient_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    temp_reference REAL,
    temp_affected REAL,
    bioimpedance REAL,
    activity_index REAL,
    battery INTEGER NOT NULL,
    quality TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sr_patient ON sensor_readings(patient_id);
  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY NOT NULL,
    patient_id TEXT NOT NULL,
    captured_at TEXT NOT NULL,
    filename TEXT NOT NULL,
    edema TEXT,
    erythema TEXT,
    quality TEXT,
    note TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_photos_patient ON photos(patient_id);
  CREATE TABLE IF NOT EXISTS devices (
    device_id TEXT PRIMARY KEY NOT NULL,
    patient_id TEXT,
    pairing_code TEXT NOT NULL,
    paired_at TEXT,
    last_seen TEXT
  );
`);

/* eslint-disable @typescript-eslint/no-explicit-any */

function toReading(r: any): SensorReading {
  return {
    id: r.id,
    patientId: r.patient_id,
    timestamp: r.timestamp,
    tempReferenceC: r.temp_reference,
    tempAffectedC: r.temp_affected,
    bioimpedanceOhm: r.bioimpedance,
    activityIndex: r.activity_index,
    batteryPct: r.battery,
    quality: r.quality as MeasurementQuality,
  };
}

function toPatient(p: any): Patient {
  return {
    id: p.id,
    name: p.name,
    joint: p.joint,
    side: p.side,
    edemaVisible: p.edema,
    erythemaVisible: p.erythema,
    pain0to10: p.pain ?? null,
  };
}

export async function getPatients(): Promise<Patient[]> {
  const rs = await db.execute('SELECT * FROM patients ORDER BY name ASC;');
  return rs.rows.map(toPatient);
}

export async function getPatient(id: string): Promise<Patient | null> {
  const rs = await db.execute({ sql: 'SELECT * FROM patients WHERE id = ?;', args: [id] });
  return rs.rows[0] ? toPatient(rs.rows[0]) : null;
}

export async function getReadings(patientId: string): Promise<SensorReading[]> {
  const rs = await db.execute({
    sql: 'SELECT * FROM sensor_readings WHERE patient_id = ? ORDER BY timestamp ASC;',
    args: [patientId],
  });
  return rs.rows.map(toReading);
}

export async function upsertPatient(p: Patient): Promise<void> {
  await db.execute({
    sql: 'INSERT OR REPLACE INTO patients (id, name, joint, side, edema, erythema, pain) VALUES (?, ?, ?, ?, ?, ?, ?);',
    args: [p.id, p.name, p.joint, p.side, p.edemaVisible, p.erythemaVisible, p.pain0to10],
  });
}

export async function addReading(r: SensorReading): Promise<void> {
  await db.execute({
    sql: `INSERT OR REPLACE INTO sensor_readings
       (id, patient_id, timestamp, temp_reference, temp_affected, bioimpedance, activity_index, battery, quality)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    args: [
      r.id,
      r.patientId,
      r.timestamp,
      r.tempReferenceC,
      r.tempAffectedC,
      r.bioimpedanceOhm,
      r.activityIndex,
      r.batteryPct,
      r.quality,
    ],
  });
}

export async function addPhoto(p: Photo): Promise<void> {
  await db.execute({
    sql: `INSERT OR REPLACE INTO photos (id, patient_id, captured_at, filename, edema, erythema, quality, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    args: [p.id, p.patientId, p.capturedAt, p.filename, p.edema, p.erythema, p.quality, p.note],
  });
}

export async function getPhotos(patientId: string): Promise<Photo[]> {
  const rs = await db.execute({
    sql: 'SELECT * FROM photos WHERE patient_id = ? ORDER BY captured_at ASC;',
    args: [patientId],
  });
  return rs.rows.map((r: any) => ({
    id: r.id,
    patientId: r.patient_id,
    capturedAt: r.captured_at,
    filename: r.filename,
    edema: r.edema,
    erythema: r.erythema,
    quality: r.quality,
    note: r.note,
  }));
}

// ---- Devices (pairing) ----

function toDevice(r: any): Device {
  return {
    deviceId: r.device_id,
    patientId: r.patient_id,
    pairingCode: r.pairing_code,
    pairedAt: r.paired_at,
    lastSeen: r.last_seen,
  };
}

// Unambiguous charset (no 0/O/1/I/L) for a human-typed pairing code.
function genPairingCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function getDevice(deviceId: string): Promise<Device | null> {
  const rs = await db.execute({ sql: 'SELECT * FROM devices WHERE device_id = ?;', args: [deviceId] });
  return rs.rows[0] ? toDevice(rs.rows[0]) : null;
}

export async function getDeviceByCode(code: string): Promise<Device | null> {
  const rs = await db.execute({ sql: 'SELECT * FROM devices WHERE pairing_code = ?;', args: [code] });
  return rs.rows[0] ? toDevice(rs.rows[0]) : null;
}

export async function listDevices(): Promise<Device[]> {
  const rs = await db.execute('SELECT * FROM devices ORDER BY last_seen DESC;');
  return rs.rows.map(toDevice);
}

/** Register the device on first contact (with a fresh pairing code) and touch last_seen. */
export async function registerDeviceIfNew(deviceId: string): Promise<Device> {
  const now = new Date().toISOString();
  const existing = await getDevice(deviceId);
  if (!existing) {
    await db.execute({
      sql: 'INSERT INTO devices (device_id, patient_id, pairing_code, paired_at, last_seen) VALUES (?, NULL, ?, NULL, ?);',
      args: [deviceId, genPairingCode(), now],
    });
  } else {
    await db.execute({ sql: 'UPDATE devices SET last_seen = ? WHERE device_id = ?;', args: [now, deviceId] });
  }
  return (await getDevice(deviceId))!;
}

/** Link a device to a patient and migrate its provisional readings to that patient. */
export async function pairDevice(deviceId: string, patientId: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE devices SET patient_id = ?, paired_at = ? WHERE device_id = ?;',
    args: [patientId, new Date().toISOString(), deviceId],
  });
  if (deviceId !== patientId) {
    await db.execute({
      sql: 'UPDATE sensor_readings SET patient_id = ? WHERE patient_id = ?;',
      args: [patientId, deviceId],
    });
    await db.execute({ sql: 'DELETE FROM patients WHERE id = ?;', args: [deviceId] }); // drop provisional patient
  }
}

// ---- Seed (synthetic) ----

type Profile = {
  patient: Omit<Patient, 'id'> & { id: string };
  refTemp: number;
  deltaStart: number;
  deltaEnd: number;
  activity: number;
  batteryStart: number;
  batteryEnd: number;
  biozStart: number;
  biozEnd: number;
  invalidLast?: boolean;
};

const PROFILES: Profile[] = [
  {
    patient: { id: 'p-001', name: 'María López', joint: 'knee', side: 'left', edemaVisible: 'existent', erythemaVisible: 'existent', pain0to10: 8 },
    refTemp: 33, deltaStart: 0.8, deltaEnd: 2.6, activity: 0.5, batteryStart: 90, batteryEnd: 14, biozStart: 110, biozEnd: 95,
  },
  {
    patient: { id: 'p-002', name: 'Juan Pérez', joint: 'knee', side: 'right', edemaVisible: 'non_existent', erythemaVisible: 'non_existent', pain0to10: 2 },
    refTemp: 33, deltaStart: 0.3, deltaEnd: 0.6, activity: 0.72, batteryStart: 96, batteryEnd: 62, biozStart: 100, biozEnd: 101,
  },
  {
    patient: { id: 'p-003', name: 'Ana García', joint: 'knee', side: 'left', edemaVisible: 'uncertain', erythemaVisible: 'non_existent', pain0to10: 5 },
    refTemp: 33, deltaStart: 0.4, deltaEnd: 0.9, activity: 0.22, batteryStart: 80, batteryEnd: 41, biozStart: 100, biozEnd: 97, invalidLast: true,
  },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

export async function seedIfEmpty(): Promise<void> {
  const rs = await db.execute('SELECT COUNT(*) AS n FROM patients;');
  const n = Number((rs.rows[0] as any).n);
  if (n > 0) return;

  const N = 6;
  const dayMs = 86_400_000;
  const now = Date.now();

  for (const p of PROFILES) {
    await upsertPatient(p.patient);
    for (let i = 0; i < N; i++) {
      const t = N > 1 ? i / (N - 1) : 1;
      const invalid = p.invalidLast && i === N - 1;
      const delta = lerp(p.deltaStart, p.deltaEnd, t);
      await addReading({
        id: `${p.patient.id}-r${i}`,
        patientId: p.patient.id,
        timestamp: new Date(now - (N - 1 - i) * dayMs).toISOString(),
        tempReferenceC: invalid ? null : round(p.refTemp),
        tempAffectedC: invalid ? null : round(p.refTemp + delta),
        bioimpedanceOhm: invalid ? null : round(lerp(p.biozStart, p.biozEnd, t)),
        activityIndex: invalid ? null : round(p.activity, 2),
        batteryPct: Math.round(lerp(p.batteryStart, p.batteryEnd, t)),
        quality: invalid ? 'invalid_contact' : 'simulated',
      });
    }
  }
}
