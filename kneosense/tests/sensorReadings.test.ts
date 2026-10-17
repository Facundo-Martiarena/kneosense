/// <reference types="jest" />

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  openDatabaseSync: jest.fn(),
}));

import { demoCases } from '@/data/mocks/loadScenarios';
import {
  InMemoryPhotoRepository,
  InMemorySensorReadingRepository,
  InMemorySymptomRepository,
} from '@/data/db/InMemoryRepositories';
import { __setRepositories, useAppStore } from '@/state/appStore';
import type { SensorReading } from '@/types';

function sr(id: string, caseId = 'c1', timestamp = '2026-10-01T09:00:00Z'): SensorReading {
  return {
    id,
    caseId,
    timestamp,
    tempReferenceC: 33.0,
    tempAffectedC: 33.5,
    bioimpedanceOhm: 100,
    activityIndex: 0.6,
    batteryPct: 80,
    quality: 'simulated',
    isSynthetic: true,
  };
}

describe('in-memory sensor reading repository', () => {
  it('adds, counts, lists oldest-first and upserts by id', async () => {
    const repo = new InMemorySensorReadingRepository();
    await repo.add(sr('r2', 'c1', '2026-10-02T09:00:00Z'));
    await repo.add(sr('r1', 'c1', '2026-10-01T09:00:00Z'));
    await repo.add({ ...sr('r1'), batteryPct: 50 });

    expect(await repo.count()).toBe(2);
    const all = await repo.listAll();
    expect(all.map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(all.find((r) => r.id === 'r1')?.batteryPct).toBe(50);
  });
});

describe('store sensor readings (seed + add)', () => {
  beforeEach(() => {
    useAppStore.setState({ photos: [], symptoms: [], sensorReadings: [], hydrated: false });
  });

  it('hydrate seeds synthetic readings when the DB is empty', async () => {
    __setRepositories(
      new InMemoryPhotoRepository(),
      new InMemorySymptomRepository(),
      new InMemorySensorReadingRepository(),
    );
    await useAppStore.getState().hydrate();
    const first = demoCases[0].scenarioId;
    expect(useAppStore.getState().readingsForCase(first).length).toBeGreaterThan(0);
  });

  it('addSensorReading persists to the repository and updates state', async () => {
    const repo = new InMemorySensorReadingRepository();
    __setRepositories(new InMemoryPhotoRepository(), new InMemorySymptomRepository(), repo);

    await useAppStore.getState().addSensorReading(sr('rx', 'c9'));

    expect((await repo.listAll()).some((r) => r.id === 'rx')).toBe(true);
    expect(useAppStore.getState().readingsForCase('c9')).toHaveLength(1);
  });
});
