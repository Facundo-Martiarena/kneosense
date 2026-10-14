import { Platform } from 'react-native';

import type { IPhotoRepository, ISymptomRepository } from '@/types';

import {
  InMemoryPhotoRepository,
  InMemorySymptomRepository,
} from './db/InMemoryRepositories';
import { SqlitePhotoRepository } from './db/SqlitePhotoRepository';
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
