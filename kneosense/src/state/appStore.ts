import { create } from 'zustand';

import { demoCases } from '@/data/mocks/loadScenarios';
import { sensorReadingsForCase } from '@/data/mocks/sensorReadings';
import {
  patientRepository as defaultPatientRepo,
  photoRepository as defaultPhotoRepo,
  sensorReadingRepository as defaultSensorRepo,
  symptomRepository as defaultSymptomRepo,
} from '@/data/persistence';
import type {
  AppPatient,
  IPatientRepository,
  IPhotoRepository,
  ISensorReadingRepository,
  ISymptomRepository,
  Joint,
  PhotoRecord,
  SensorReading,
  SymptomEntry,
} from '@/types';
import { uid } from '@/utils/id';
import { loadAuth, saveAuth } from '@/features/auth/authStorage';
import type { PatientAuth } from '@/features/sync/syncClient';

/**
 * App-wide session state. User-generated data (photos, symptoms) and the patch's
 * multimodal sensor readings are persisted through the injected repositories
 * (SQLite on native, in-memory on web); synthetic scenarios stay bundled
 * read-only JSON (plan section 2). Sensor readings are SEEDED from the synthetic
 * generator on first run, then live in the DB.
 */

let photoRepo: IPhotoRepository = defaultPhotoRepo;
let symptomRepo: ISymptomRepository = defaultSymptomRepo;
let sensorRepo: ISensorReadingRepository = defaultSensorRepo;
let patientRepo: IPatientRepository = defaultPatientRepo;

/** Test seam: swap the persistence adapters before using the store. */
export function __setRepositories(
  p: IPhotoRepository,
  s: ISymptomRepository,
  sr?: ISensorReadingRepository,
  pr?: IPatientRepository,
) {
  photoRepo = p;
  symptomRepo = s;
  if (sr) sensorRepo = sr;
  if (pr) patientRepo = pr;
}

type AppState = {
  selectedCaseId: string | null;
  photos: PhotoRecord[];
  symptoms: SymptomEntry[];
  sensorReadings: SensorReading[];
  patients: AppPatient[];
  hydrated: boolean;

  /** Logged-in patient session (null = not logged in). Persisted via authStorage. */
  auth: PatientAuth | null;
  setAuth: (auth: PatientAuth | null) => void;

  /** Loads persisted data into memory (seeding sensor readings once). */
  hydrate: () => Promise<void>;

  selectCase: (caseId: string) => void;
  clearCase: () => void;

  /** Creates and persists a new patient profile, selecting it. */
  createPatient: (name: string, joint: Joint) => Promise<AppPatient>;

  addPhoto: (photo: PhotoRecord) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  photosForCase: (caseId: string) => PhotoRecord[];

  addSymptom: (entry: SymptomEntry) => Promise<void>;
  symptomsForCase: (caseId: string) => SymptomEntry[];

  addSensorReading: (reading: SensorReading) => Promise<void>;
  readingsForCase: (caseId: string) => SensorReading[];
};

/** Seed the DB with synthetic readings for every demo scenario (idempotent). */
async function seedSensorReadings() {
  if ((await sensorRepo.count()) > 0) return;
  for (const c of demoCases) {
    for (const r of sensorReadingsForCase(c.scenarioId)) {
      await sensorRepo.add(r);
    }
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedCaseId: demoCases[0]?.scenarioId ?? null,
  photos: [],
  symptoms: [],
  sensorReadings: [],
  patients: [],
  hydrated: false,
  auth: loadAuth(),

  setAuth: (auth) => {
    saveAuth(auth);
    set({ auth });
  },

  hydrate: async () => {
    const [photos, symptoms] = await Promise.all([photoRepo.listAll(), symptomRepo.listAll()]);
    let sensorReadings: SensorReading[] = [];
    let patients: AppPatient[] = [];
    try {
      await seedSensorReadings();
      sensorReadings = await sensorRepo.listAll();
    } catch {
      // Sensor persistence unavailable; continue without seeded readings.
    }
    try {
      patients = await patientRepo.listAll();
    } catch {
      // Patient persistence unavailable; continue without created patients.
    }
    set({ photos, symptoms, sensorReadings, patients, hydrated: true });
  },

  selectCase: (caseId) => set({ selectedCaseId: caseId }),
  clearCase: () => set({ selectedCaseId: null }),

  createPatient: async (name, joint) => {
    const patient: AppPatient = {
      id: uid('pat'),
      name: name.trim() || 'Paciente',
      joint,
      side: 'left',
      createdAt: new Date().toISOString(),
    };
    await patientRepo.add(patient);
    set((s) => ({ patients: [...s.patients, patient], selectedCaseId: patient.id }));
    return patient;
  },

  addPhoto: async (photo) => {
    await photoRepo.add(photo);
    set((s) => ({ photos: [...s.photos, photo] }));
  },
  removePhoto: async (id) => {
    await photoRepo.remove(id);
    set((s) => ({ photos: s.photos.filter((p) => p.id !== id) }));
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

  addSensorReading: async (reading) => {
    await sensorRepo.add(reading);
    set((s) => ({ sensorReadings: [...s.sensorReadings, reading] }));
  },
  readingsForCase: (caseId) =>
    get()
      .sensorReadings.filter((r) => r.caseId === caseId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
}));
