import { create } from 'zustand';

import { demoCases } from '@/data/mocks/loadScenarios';
import {
  photoRepository as defaultPhotoRepo,
  symptomRepository as defaultSymptomRepo,
} from '@/data/persistence';
import type { IPhotoRepository, ISymptomRepository, PhotoRecord, SymptomEntry } from '@/types';

/**
 * App-wide session state. User-generated data (photos, symptoms) is persisted
 * through the injected repositories (SQLite on native, in-memory on web);
 * synthetic scenarios stay bundled read-only JSON (plan section 2).
 */

let photoRepo: IPhotoRepository = defaultPhotoRepo;
let symptomRepo: ISymptomRepository = defaultSymptomRepo;

/** Test seam: swap the persistence adapters before using the store. */
export function __setRepositories(p: IPhotoRepository, s: ISymptomRepository) {
  photoRepo = p;
  symptomRepo = s;
}

type AppState = {
  selectedCaseId: string | null;
  photos: PhotoRecord[];
  symptoms: SymptomEntry[];
  hydrated: boolean;

  /** Loads persisted data into memory. Call once at app startup. */
  hydrate: () => Promise<void>;

  selectCase: (caseId: string) => void;
  clearCase: () => void;

  addPhoto: (photo: PhotoRecord) => Promise<void>;
  photosForCase: (caseId: string) => PhotoRecord[];

  addSymptom: (entry: SymptomEntry) => Promise<void>;
  symptomsForCase: (caseId: string) => SymptomEntry[];
};

export const useAppStore = create<AppState>((set, get) => ({
  selectedCaseId: demoCases[0]?.scenarioId ?? null,
  photos: [],
  symptoms: [],
  hydrated: false,

  hydrate: async () => {
    const [photos, symptoms] = await Promise.all([photoRepo.listAll(), symptomRepo.listAll()]);
    set({ photos, symptoms, hydrated: true });
  },

  selectCase: (caseId) => set({ selectedCaseId: caseId }),
  clearCase: () => set({ selectedCaseId: null }),

  addPhoto: async (photo) => {
    await photoRepo.add(photo);
    set((s) => ({ photos: [...s.photos, photo] }));
  },
  photosForCase: (caseId) =>
    get()
      .photos.filter((p) => p.caseId === caseId)
      .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()),

  addSymptom: async (entry) => {
    await symptomRepo.add(entry);
    set((s) => ({ symptoms: [...s.symptoms, entry] }));
  },
  symptomsForCase: (caseId) =>
    get()
      .symptoms.filter((e) => e.caseId === caseId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()),
}));
