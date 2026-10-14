import type { IPhotoRepository, ISymptomRepository, PhotoRecord, SymptomEntry } from '@/types';

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
