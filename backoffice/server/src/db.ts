import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import type { MeasurementQuality, Patient, Photo, SensorReading } from './types.js';

const here = dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(join(here, '..', 'kneosense-backoffice.db'));

db.exec(`
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
`);

type ReadingRow = {
  id: string;
  patient_id: string;
  timestamp: string;
  temp_reference: number | null;
  temp_affected: number | null;
  bioimpedance: number | null;
  activity_index: number | null;
  battery: number;
  quality: string;
};

function toReading(r: ReadingRow): SensorReading {
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

export function getPatients(): Patient[] {
  return db.prepare('SELECT * FROM patients ORDER BY name ASC;').all().map((p: any) => ({
    id: p.id,
    name: p.name,
    joint: p.joint,
    side: p.side,
    edemaVisible: p.edema,
    erythemaVisible: p.erythema,
    pain0to10: p.pain ?? null,
  }));
}

export function getPatient(id: string): Patient | null {
  const p: any = db.prepare('SELECT * FROM patients WHERE id = ?;').get(id);
  if (!p) return null;
  return { id: p.id, name: p.name, joint: p.joint, side: p.side, edemaVisible: p.edema, erythemaVisible: p.erythema, pain0to10: p.pain ?? null };
}

export function getReadings(patientId: string): SensorReading[] {
  return db
    .prepare('SELECT * FROM sensor_readings WHERE patient_id = ? ORDER BY timestamp ASC;')
    .all(patientId)
    .map((r) => toReading(r as ReadingRow));
}

export function upsertPatient(p: Patient): void {
  db.prepare(
    'INSERT OR REPLACE INTO patients (id, name, joint, side, edema, erythema, pain) VALUES (?, ?, ?, ?, ?, ?, ?);',
  ).run(p.id, p.name, p.joint, p.side, p.edemaVisible, p.erythemaVisible, p.pain0to10);
}

export function addReading(r: SensorReading): void {
  db.prepare(
    `INSERT OR REPLACE INTO sensor_readings
       (id, patient_id, timestamp, temp_reference, temp_affected, bioimpedance, activity_index, battery, quality)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
  ).run(r.id, r.patientId, r.timestamp, r.tempReferenceC, r.tempAffectedC, r.bioimpedanceOhm, r.activityIndex, r.batteryPct, r.quality);
}

export function addPhoto(p: Photo): void {
  db.prepare(
    `INSERT OR REPLACE INTO photos (id, patient_id, captured_at, filename, edema, erythema, quality, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
  ).run(p.id, p.patientId, p.capturedAt, p.filename, p.edema, p.erythema, p.quality, p.note);
}

export function getPhotos(patientId: string): Photo[] {
  return db
    .prepare('SELECT * FROM photos WHERE patient_id = ? ORDER BY captured_at ASC;')
    .all(patientId)
    .map((r: any) => ({
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

export function seedIfEmpty(): void {
  const n = (db.prepare('SELECT COUNT(*) AS n FROM patients;').get() as any).n as number;
  if (n > 0) return;

  const N = 6;
  const dayMs = 86_400_000;
  const now = Date.now();
  const insertPatient = db.prepare('INSERT INTO patients (id, name, joint, side, edema, erythema, pain) VALUES (?, ?, ?, ?, ?, ?, ?);');

  for (const p of PROFILES) {
    insertPatient.run(p.patient.id, p.patient.name, p.patient.joint, p.patient.side, p.patient.edemaVisible, p.patient.erythemaVisible, p.patient.pain0to10);
    for (let i = 0; i < N; i++) {
      const t = N > 1 ? i / (N - 1) : 1;
      const invalid = p.invalidLast && i === N - 1;
      const delta = lerp(p.deltaStart, p.deltaEnd, t);
      addReading({
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
