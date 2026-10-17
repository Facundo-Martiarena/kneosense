/// <reference types="jest" />

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  openDatabaseSync: jest.fn(),
}));

import {
  InMemoryPatientRepository,
  InMemoryPhotoRepository,
  InMemorySensorReadingRepository,
  InMemorySymptomRepository,
} from '@/data/db/InMemoryRepositories';
import { __setRepositories, useAppStore } from '@/state/appStore';

describe('in-memory patient repository', () => {
  it('adds and lists created patients', async () => {
    const repo = new InMemoryPatientRepository();
    await repo.add({ id: 'pa', name: 'Ana', joint: 'knee', side: 'left', createdAt: '2026-01-01T00:00:00Z' });
    const all = await repo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Ana');
  });
});

describe('store createPatient', () => {
  beforeEach(() => {
    useAppStore.setState({ patients: [], selectedCaseId: null });
  });

  it('creates, persists, selects and lists the patient', async () => {
    const repo = new InMemoryPatientRepository();
    __setRepositories(
      new InMemoryPhotoRepository(),
      new InMemorySymptomRepository(),
      new InMemorySensorReadingRepository(),
      repo,
    );

    const p = await useAppStore.getState().createPatient('Juan', 'wrist');

    expect(p.name).toBe('Juan');
    expect(p.joint).toBe('wrist');
    expect((await repo.listAll()).some((x) => x.id === p.id)).toBe(true);
    expect(useAppStore.getState().patients.some((x) => x.id === p.id)).toBe(true);
    expect(useAppStore.getState().selectedCaseId).toBe(p.id);
  });
});
