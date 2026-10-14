import type { ImpedanceMeasurement } from './domain';

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
