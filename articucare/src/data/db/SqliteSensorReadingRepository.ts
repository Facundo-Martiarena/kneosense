import type { ISensorReadingRepository, SensorReading } from '@/types';

import { getDatabase } from './sqlite';

type SensorRow = {
  id: string;
  case_id: string;
  timestamp: string;
  temp_reference: number | null;
  temp_affected: number | null;
  bioimpedance: number | null;
  activity_index: number | null;
  battery: number;
  quality: string;
  is_synthetic: number;
};

function toReading(row: SensorRow): SensorReading {
  return {
    id: row.id,
    caseId: row.case_id,
    timestamp: row.timestamp,
    tempReferenceC: row.temp_reference,
    tempAffectedC: row.temp_affected,
    bioimpedanceOhm: row.bioimpedance,
    activityIndex: row.activity_index,
    batteryPct: row.battery,
    quality: row.quality as SensorReading['quality'],
    isSynthetic: row.is_synthetic === 1,
  };
}

/** SQLite-backed persistence for the patch's multimodal readings. */
export class SqliteSensorReadingRepository implements ISensorReadingRepository {
  async listAll(): Promise<SensorReading[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SensorRow>(
      'SELECT * FROM sensor_readings ORDER BY timestamp ASC;',
    );
    return rows.map(toReading);
  }

  async add(reading: SensorReading): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO sensor_readings
         (id, case_id, timestamp, temp_reference, temp_affected, bioimpedance, activity_index, battery, quality, is_synthetic)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      reading.id,
      reading.caseId,
      reading.timestamp,
      reading.tempReferenceC,
      reading.tempAffectedC,
      reading.bioimpedanceOhm,
      reading.activityIndex,
      reading.batteryPct,
      reading.quality,
      reading.isSynthetic ? 1 : 0,
    );
  }

  async count(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM sensor_readings;');
    return row?.n ?? 0;
  }
}
