import type { ISymptomRepository, SymptomEntry } from '@/types';

import { getDatabase } from './sqlite';

type SymptomRow = {
  id: string;
  case_id: string;
  recorded_at: string;
  pain: number;
  swelling: string;
  stiffness: number;
  comment: string | null;
};

function toEntry(row: SymptomRow): SymptomEntry {
  return {
    id: row.id,
    caseId: row.case_id,
    recordedAt: row.recorded_at,
    pain0to10: row.pain,
    swellingPerception: row.swelling as SymptomEntry['swellingPerception'],
    stiffness0to10: row.stiffness,
    comment: row.comment ?? undefined,
  };
}

/** SQLite-backed symptom persistence. Plan section 2. */
export class SqliteSymptomRepository implements ISymptomRepository {
  async listAll(): Promise<SymptomEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SymptomRow>(
      'SELECT * FROM symptoms ORDER BY recorded_at ASC;',
    );
    return rows.map(toEntry);
  }

  async add(entry: SymptomEntry): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO symptoms
         (id, case_id, recorded_at, pain, swelling, stiffness, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      entry.id,
      entry.caseId,
      entry.recordedAt,
      entry.pain0to10,
      entry.swellingPerception,
      entry.stiffness0to10,
      entry.comment ?? null,
    );
  }
}
