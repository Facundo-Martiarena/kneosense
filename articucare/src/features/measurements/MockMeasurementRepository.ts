import { getDemoCase } from '@/data/mocks/loadScenarios';
import type { IMeasurementRepository, ImpedanceMeasurement } from '@/types';

/**
 * MVP implementation of IMeasurementRepository backed by bundled synthetic
 * fixtures. Plan section 3.3. A future BleMeasurementRepository will implement
 * the same interface without any screen changes.
 *
 * caseId == scenarioId in the demo.
 */
export class MockMeasurementRepository implements IMeasurementRepository {
  async listForCase(caseId: string): Promise<ImpedanceMeasurement[]> {
    const demoCase = getDemoCase(caseId);
    return demoCase ? demoCase.measurements : [];
  }

  async getLatest(caseId: string): Promise<ImpedanceMeasurement | null> {
    const measurements = await this.listForCase(caseId);
    return measurements.length > 0 ? measurements[measurements.length - 1] : null;
  }
}

/** Shared singleton used by the app. Swap here to adopt a real repository. */
export const measurementRepository: IMeasurementRepository = new MockMeasurementRepository();
