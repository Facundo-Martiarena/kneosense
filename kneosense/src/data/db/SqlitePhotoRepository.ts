import type { IPhotoRepository, PhotoRecord, VisualAssessment } from '@/types';

import { getDatabase } from './sqlite';

type PhotoRow = {
  id: string;
  case_id: string;
  uri: string;
  captured_at: string;
  joint: string;
  side: string;
  day: number | null;
  assessment: string | null;
  note: string | null;
};

function toRecord(row: PhotoRow): PhotoRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    uri: row.uri,
    capturedAt: row.captured_at,
    joint: row.joint as PhotoRecord['joint'],
    side: row.side as PhotoRecord['side'],
    day: row.day ?? undefined,
    assessment: row.assessment ? (JSON.parse(row.assessment) as VisualAssessment) : undefined,
    note: row.note ?? undefined,
  };
}

/** SQLite-backed photo persistence. Plan section 2. */
export class SqlitePhotoRepository implements IPhotoRepository {
  async listAll(): Promise<PhotoRecord[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PhotoRow>('SELECT * FROM photos ORDER BY captured_at ASC;');
    return rows.map(toRecord);
  }

  async add(photo: PhotoRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO photos
         (id, case_id, uri, captured_at, joint, side, day, assessment, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      photo.id,
      photo.caseId,
      photo.uri,
      photo.capturedAt,
      photo.joint,
      photo.side,
      photo.day ?? null,
      photo.assessment ? JSON.stringify(photo.assessment) : null,
      photo.note ?? null,
    );
  }

  async remove(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM photos WHERE id = ?;', id);
  }
}
