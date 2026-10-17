/// <reference types="jest" />

// Neutralize the native expo-sqlite module so importing the store's persistence
// chain never touches the native binding under jest.
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  openDatabaseSync: jest.fn(),
}));

import {
  InMemoryPhotoRepository,
  InMemorySymptomRepository,
} from '@/data/db/InMemoryRepositories';
import { __setRepositories, useAppStore } from '@/state/appStore';
import type { PhotoRecord, SymptomEntry } from '@/types';

function photo(id: string, caseId = 'c1', capturedAt = '2026-10-01T09:00:00Z'): PhotoRecord {
  return { id, caseId, uri: `file://${id}`, capturedAt, joint: 'knee', side: 'left' };
}
function symptom(id: string, caseId = 'c1', recordedAt = '2026-10-01T09:00:00Z'): SymptomEntry {
  return {
    id,
    caseId,
    recordedAt,
    pain0to10: 3,
    swellingPerception: 'mild',
    stiffness0to10: 2,
  };
}

describe('in-memory adapters', () => {
  it('adds and lists photos sorted oldest-first, upserting by id', async () => {
    const repo = new InMemoryPhotoRepository();
    await repo.add(photo('p2', 'c1', '2026-10-02T09:00:00Z'));
    await repo.add(photo('p1', 'c1', '2026-10-01T09:00:00Z'));
    await repo.add({ ...photo('p1', 'c1', '2026-10-01T09:00:00Z'), note: 'edited' });

    const all = await repo.listAll();
    expect(all.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(all.find((p) => p.id === 'p1')?.note).toBe('edited');
  });

  it('adds and lists symptoms', async () => {
    const repo = new InMemorySymptomRepository();
    await repo.add(symptom('s1'));
    const all = await repo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].pain0to10).toBe(3);
  });
});

describe('store hydration + persist-on-add', () => {
  beforeEach(() => {
    useAppStore.setState({ photos: [], symptoms: [], hydrated: false });
  });

  it('hydrate() loads persisted data from the injected repositories', async () => {
    const photos = new InMemoryPhotoRepository();
    const symptoms = new InMemorySymptomRepository();
    await photos.add(photo('p1'));
    await symptoms.add(symptom('s1'));
    __setRepositories(photos, symptoms);

    await useAppStore.getState().hydrate();

    const state = useAppStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.photosForCase('c1')).toHaveLength(1);
    expect(state.symptomsForCase('c1')).toHaveLength(1);
  });

  it('addPhoto persists to the repository and updates state', async () => {
    const photos = new InMemoryPhotoRepository();
    const symptoms = new InMemorySymptomRepository();
    __setRepositories(photos, symptoms);

    await useAppStore.getState().addPhoto(photo('p9', 'c2'));

    expect(await photos.listAll()).toHaveLength(1);
    expect(useAppStore.getState().photosForCase('c2')).toHaveLength(1);
  });
});
