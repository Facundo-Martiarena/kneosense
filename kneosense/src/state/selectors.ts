import { useMemo } from 'react';

import { useAppStore } from '@/state/appStore';
import type { PhotoRecord, SensorReading, SymptomEntry } from '@/types';

/**
 * Stable derived selectors.
 *
 * IMPORTANT: a Zustand selector must return a reference-stable value. Returning
 * a freshly built array (e.g. `.filter().sort()`) from the selector makes
 * useSyncExternalStore see a new snapshot on every render → "Maximum update
 * depth exceeded". So we select the raw array (stable until a write) and derive
 * the filtered/sorted view with useMemo in the component.
 */

const EMPTY_PHOTOS: PhotoRecord[] = [];
const EMPTY_SYMPTOMS: SymptomEntry[] = [];
const EMPTY_READINGS: SensorReading[] = [];

export function usePhotosForCase(caseId: string | null): PhotoRecord[] {
  const photos = useAppStore((s) => s.photos);
  return useMemo(() => {
    if (!caseId) return EMPTY_PHOTOS;
    return photos
      .filter((p) => p.caseId === caseId)
      .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
  }, [photos, caseId]);
}

export function useSymptomsForCase(caseId: string | null): SymptomEntry[] {
  const symptoms = useAppStore((s) => s.symptoms);
  return useMemo(() => {
    if (!caseId) return EMPTY_SYMPTOMS;
    return symptoms
      .filter((e) => e.caseId === caseId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }, [symptoms, caseId]);
}

export function useReadingsForCase(caseId: string | null): SensorReading[] {
  const readings = useAppStore((s) => s.sensorReadings);
  return useMemo(() => {
    if (!caseId) return EMPTY_READINGS;
    return readings
      .filter((r) => r.caseId === caseId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [readings, caseId]);
}
