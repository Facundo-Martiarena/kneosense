import type { IPhotoRepository, ISymptomRepository } from '@/types';

import {
  InMemoryPhotoRepository,
  InMemorySymptomRepository,
} from './db/InMemoryRepositories';

/**
 * Web persistence adapter. Metro resolves this `.web` variant on web so the
 * native-only `expo-sqlite` import (which pulls a wasm worker Metro cannot
 * bundle for static web) never enters the web graph. Web keeps data in memory
 * for the MVP (plan section 2: persistence is a native-first local concern).
 */
export const photoRepository: IPhotoRepository = new InMemoryPhotoRepository();
export const symptomRepository: ISymptomRepository = new InMemorySymptomRepository();
