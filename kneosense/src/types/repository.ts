import type {
  AppPatient,
  ImpedanceMeasurement,
  PhotoRecord,
  SensorReading,
  SymptomEntry,
} from './domain';

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
  remove(id: string): Promise<void>;
}

export interface ISymptomRepository {
  /** Every stored symptom entry across all cases. */
  listAll(): Promise<SymptomEntry[]>;
  add(entry: SymptomEntry): Promise<void>;
}

/**
 * Persistence for the patch's multimodal sensor readings (temperatures,
 * bioimpedance, IMU activity, battery). Seeded from synthetic generators on
 * first run; new readings can be added at runtime.
 */
/** User-created patient profiles (demo scenarios stay bundled, read-only). */
export interface IPatientRepository {
  listAll(): Promise<AppPatient[]>;
  add(patient: AppPatient): Promise<void>;
}

export interface ISensorReadingRepository {
  /** Every stored reading across all cases, oldest first. */
  listAll(): Promise<SensorReading[]>;
  add(reading: SensorReading): Promise<void>;
  /** Count of stored readings (used to decide whether to seed). */
  count(): Promise<number>;
}
