import type { ImpedanceMeasurement, PhotoRecord, SymptomEntry } from './domain';

/**
 * Repository contract the UI depends on. Screens NEVER import a sensor library
 * directly; they depend only on this interface. Plan section 3.3.
 *
 * MVP implementation: MockMeasurementRepository.
 * Future: BleMeasurementRepository (out of MVP scope, plan RF-09).
 */
export interface IMeasurementRepository {
  /** All measurements for a case, oldest first. */
  listForCase(caseId: string): Promise<ImpedanceMeasurement[]>;
  /** Most recent measurement, or null if the case has none. */
  getLatest(caseId: string): Promise<ImpedanceMeasurement | null>;
}

/**
 * Persistence ports for user-generated data (plan section 2: local storage,
 * expo-sqlite). The store depends on these ports; concrete adapters (SQLite on
 * native, in-memory on web/tests) are swapped behind them.
 */
export interface IPhotoRepository {
  /** Every stored photo across all cases (store filters per case). */
  listAll(): Promise<PhotoRecord[]>;
  add(photo: PhotoRecord): Promise<void>;
}

export interface ISymptomRepository {
  /** Every stored symptom entry across all cases. */
  listAll(): Promise<SymptomEntry[]>;
  add(entry: SymptomEntry): Promise<void>;
}
