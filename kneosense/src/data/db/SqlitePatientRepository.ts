import type { AppPatient, IPatientRepository } from '@/types';

import { getDatabase } from './sqlite';

type PatientRow = {
  id: string;
  name: string;
  joint: string;
  side: string;
  created_at: string;
};

function toPatient(row: PatientRow): AppPatient {
  return {
    id: row.id,
    name: row.name,
    joint: row.joint as AppPatient['joint'],
    side: row.side as AppPatient['side'],
    createdAt: row.created_at,
  };
}

/** SQLite-backed storage for user-created patient profiles. */
export class SqlitePatientRepository implements IPatientRepository {
  async listAll(): Promise<AppPatient[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PatientRow>('SELECT * FROM app_patients ORDER BY created_at ASC;');
    return rows.map(toPatient);
  }

  async add(patient: AppPatient): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO app_patients (id, name, joint, side, created_at) VALUES (?, ?, ?, ?, ?);',
      patient.id,
      patient.name,
      patient.joint,
      patient.side,
      patient.createdAt,
    );
  }
}
