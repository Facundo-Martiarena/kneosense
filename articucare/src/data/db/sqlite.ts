import * as SQLite from 'expo-sqlite';

/**
 * Opens (once) and migrates the local SQLite database. Plan section 2:
 * local persistence for the MVP. Only user-generated data (photos, symptoms)
 * is stored; synthetic scenarios stay bundled read-only JSON.
 */

const DB_NAME = 'articucare.db';
const SCHEMA_VERSION = 3;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;

  if (current < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY NOT NULL,
        case_id TEXT NOT NULL,
        uri TEXT NOT NULL,
        captured_at TEXT NOT NULL,
        joint TEXT NOT NULL,
        side TEXT NOT NULL,
        day INTEGER,
        assessment TEXT,
        note TEXT
      );
      CREATE TABLE IF NOT EXISTS symptoms (
        id TEXT PRIMARY KEY NOT NULL,
        case_id TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        pain INTEGER NOT NULL,
        swelling TEXT NOT NULL,
        stiffness INTEGER NOT NULL,
        comment TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_photos_case ON photos(case_id);
      CREATE INDEX IF NOT EXISTS idx_symptoms_case ON symptoms(case_id);
    `);
  }

  if (current < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id TEXT PRIMARY KEY NOT NULL,
        case_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        temp_reference REAL,
        temp_affected REAL,
        bioimpedance REAL,
        activity_index REAL,
        battery INTEGER NOT NULL,
        quality TEXT NOT NULL,
        is_synthetic INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sensor_case ON sensor_readings(case_id);
    `);
  }

  if (current < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_patients (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        joint TEXT NOT NULL,
        side TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  return db;
}
