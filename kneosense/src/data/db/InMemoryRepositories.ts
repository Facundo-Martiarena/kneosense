import type {
  AppPatient,
  IPatientRepository,
  IPhotoRepository,
  ISensorReadingRepository,
  ISymptomRepository,
  PhotoRecord,
  SensorReading,
  SymptomEntry,
} from '@/types';

/**
 * In-memory adapters. Used as the web fallback (expo-sqlite web needs wasm
 * wiring not set up for the MVP) and in tests. Not persistent across reloads,
 * but keeps the app fully functional everywhere.
 */
export class InMemoryPhotoRepository implements IPhotoRepository {
  private readonly items: PhotoRecord[] = [];

  async listAll(): Promise<PhotoRecord[]> {
    return [...this.items].sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
    );
  }

  async add(photo: PhotoRecord): Promise<void> {
    const i = this.items.findIndex((p) => p.id === photo.id);
    if (i >= 0) this.items[i] = photo;
    else this.items.push(photo);
  }

  async remove(id: string): Promise<void> {
    const i = this.items.findIndex((p) => p.id === id);
    if (i >= 0) this.items.splice(i, 1);
  }
}

export class InMemorySymptomRepository implements ISymptomRepository {
  private readonly items: SymptomEntry[] = [];

  async listAll(): Promise<SymptomEntry[]> {
    return [...this.items].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );
  }

  async add(entry: SymptomEntry): Promise<void> {
    const i = this.items.findIndex((e) => e.id === entry.id);
    if (i >= 0) this.items[i] = entry;
    else this.items.push(entry);
  }
}

export class InMemoryPatientRepository implements IPatientRepository {
  private readonly items: AppPatient[] = [];

  async listAll(): Promise<AppPatient[]> {
    return [...this.items].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  async add(patient: AppPatient): Promise<void> {
    const i = this.items.findIndex((p) => p.id === patient.id);
    if (i >= 0) this.items[i] = patient;
    else this.items.push(patient);
  }
}

export class InMemorySensorReadingRepository implements ISensorReadingRepository {
  private readonly items: SensorReading[] = [];

  async listAll(): Promise<SensorReading[]> {
    return [...this.items].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  async add(reading: SensorReading): Promise<void> {
    const i = this.items.findIndex((r) => r.id === reading.id);
    if (i >= 0) this.items[i] = reading;
    else this.items.push(reading);
  }

  async count(): Promise<number> {
    return this.items.length;
  }
}
