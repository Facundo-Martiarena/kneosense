import { create } from 'zustand';

import { demoCases } from '@/data/mocks/loadScenarios';
import type { PhotoRecord, SymptomEntry } from '@/types';

/**
 * App-wide session state (in-memory, MVP). Persistence to disk/SQLite is a
 * post-MVP concern (plan section 2, "Almacenamiento: local para el MVP").
 */
type AppState = {
  selectedCaseId: string | null;
  photos: PhotoRecord[];
  symptoms: SymptomEntry[];

  selectCase: (caseId: string) => void;
  clearCase: () => void;

  addPhoto: (photo: PhotoRecord) => void;
  photosForCase: (caseId: string) => PhotoRecord[];

  addSymptom: (entry: SymptomEntry) => void;
  symptomsForCase: (caseId: string) => SymptomEntry[];
};

export const useAppStore = create<AppState>((set, get) => ({
  selectedCaseId: demoCases[0]?.scenarioId ?? null,
  photos: [],
  symptoms: [],

  selectCase: (caseId) => set({ selectedCaseId: caseId }),
  clearCase: () => set({ selectedCaseId: null }),

  addPhoto: (photo) => set((s) => ({ photos: [...s.photos, photo] })),
  photosForCase: (caseId) =>
    get()
      .photos.filter((p) => p.caseId === caseId)
      .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()),

  addSymptom: (entry) => set((s) => ({ symptoms: [...s.symptoms, entry] })),
  symptomsForCase: (caseId) =>
    get()
      .symptoms.filter((e) => e.caseId === caseId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()),
}));
