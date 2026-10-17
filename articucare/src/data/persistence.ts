import { Platform } from 'react-native';

import type {
  IPatientRepository,
  IPhotoRepository,
  ISensorReadingRepository,
  ISymptomRepository,
} from '@/types';

import {
  InMemoryPatientRepository,
  InMemoryPhotoRepository,
  InMemorySensorReadingRepository,
  InMemorySymptomRepository,
} from './db/InMemoryRepositories';
import { SqlitePatientRepository } from './db/SqlitePatientRepository';
import { SqlitePhotoRepository } from './db/SqlitePhotoRepository';
import { SqliteSensorReadingRepository } from './db/SqliteSensorReadingRepository';
import { SqliteSymptomRepository } from './db/SqliteSymptomRepository';

/**
 * Selects the persistence adapter per platform:
 * - native (iOS/Android): SQLite (persists across restarts, plan section 2).
 * - web: in-memory fallback (no wasm SQLite wiring in the MVP).
 */
const useSqlite = Platform.OS === 'ios' || Platform.OS === 'android';

export const photoRepository: IPhotoRepository = useSqlite
  ? new SqlitePhotoRepository()
  : new InMemoryPhotoRepository();

export const symptomRepository: ISymptomRepository = useSqlite
  ? new SqliteSymptomRepository()
  : new InMemorySymptomRepository();

export const sensorReadingRepository: ISensorReadingRepository = useSqlite
  ? new SqliteSensorReadingRepository()
  : new InMemorySensorReadingRepository();

export const patientRepository: IPatientRepository = useSqlite
  ? new SqlitePatientRepository()
  : new InMemoryPatientRepository();
