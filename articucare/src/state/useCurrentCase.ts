import { useMemo } from 'react';

import { getDemoCase } from '@/data/mocks/loadScenarios';
import { useAppStore } from '@/state/appStore';
import type { AppPatient, DemoCase } from '@/types';

/** Adapts a user-created patient into the DemoCase shape the screens consume. */
function patientToCase(p: AppPatient): DemoCase {
  return {
    scenarioId: p.id,
    patientId: p.name,
    synthetic: true,
    joint: p.joint,
    procedure: 'Seguimiento postoperatorio',
    interventionDate: p.createdAt,
    measurements: [],
    photoAnnotations: [],
    visualization: {
      mode: 'illustrative_2_5d',
      anatomy: p.joint,
      overlay: 'scenario_only',
      derivedFromPatientPhoto: false,
    },
  };
}

/**
 * Resolves the currently selected case: a bundled demo scenario, or a
 * user-created patient (adapted to the DemoCase shape, with empty synthetic
 * series). Memoized so the reference stays stable across renders.
 */
export function useCurrentCase(): DemoCase | null {
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);
  const patients = useAppStore((s) => s.patients);
  return useMemo(() => {
    if (!selectedCaseId) return null;
    const demo = getDemoCase(selectedCaseId);
    if (demo) return demo;
    const p = patients.find((x) => x.id === selectedCaseId);
    return p ? patientToCase(p) : null;
  }, [selectedCaseId, patients]);
}
