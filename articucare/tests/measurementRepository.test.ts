/// <reference types="jest" />
import { MockMeasurementRepository } from '@/features/measurements/MockMeasurementRepository';

describe('MockMeasurementRepository', () => {
  const repo = new MockMeasurementRepository();

  it('lists synthetic measurements for a known scenario', async () => {
    const list = await repo.listForCase('tendencia_variable');
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((m) => m.isSynthetic)).toBe(true);
    expect(list.every((m) => m.source === 'mock')).toBe(true);
  });

  it('returns measurements sorted oldest-first', async () => {
    const list = await repo.listForCase('tendencia_variable');
    for (let i = 1; i < list.length; i++) {
      expect(new Date(list[i].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(list[i - 1].timestamp).getTime(),
      );
    }
  });

  it('preserves null values for invalid readings (never fabricates)', async () => {
    const list = await repo.listForCase('medicion_invalida');
    const invalid = list.filter((m) => m.quality === 'invalid_contact');
    expect(invalid.length).toBeGreaterThan(0);
    expect(invalid.every((m) => m.impedanceMagnitudeOhm === null)).toBe(true);
  });

  it('getLatest returns the most recent measurement', async () => {
    const list = await repo.listForCase('tendencia_variable');
    const latest = await repo.getLatest('tendencia_variable');
    expect(latest?.id).toBe(list[list.length - 1].id);
  });

  it('returns empty / null for unknown case', async () => {
    expect(await repo.listForCase('does_not_exist')).toEqual([]);
    expect(await repo.getLatest('does_not_exist')).toBeNull();
  });
});
