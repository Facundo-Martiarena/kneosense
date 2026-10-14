import type { DemoCase, ImpedanceMeasurement, PhotoAnnotation, Visualization } from '@/types';

import raw from './scenarios.json';

/**
 * Loads the bundled synthetic fixtures into typed DemoCase objects.
 *
 * The raw JSON has no interventionDate, so we synthesize it as the first
 * measurement's day (day 1). Every value stays SYNTHETIC — the file itself is
 * labelled educationalDemoOnly and the note warns values are invented.
 */

type RawFile = {
  educationalDemoOnly?: boolean;
  scenarios: RawScenario[];
};

type RawScenario = {
  scenarioId: string;
  patientId: string;
  synthetic: boolean;
  joint: string;
  procedure: string;
  measurements: ImpedanceMeasurement[];
  photoAnnotations: PhotoAnnotation[];
  visualization: Visualization;
};

function toDemoCase(s: RawScenario): DemoCase {
  const sorted = [...s.measurements].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const interventionDate = sorted[0]?.timestamp ?? new Date().toISOString();

  return {
    scenarioId: s.scenarioId,
    patientId: s.patientId,
    synthetic: true,
    joint: s.joint as DemoCase['joint'],
    procedure: s.procedure,
    interventionDate,
    measurements: sorted,
    photoAnnotations: s.photoAnnotations ?? [],
    visualization: s.visualization,
  };
}

const file = raw as RawFile;

export const demoCases: DemoCase[] = file.scenarios.map(toDemoCase);

export function getDemoCase(scenarioId: string): DemoCase | undefined {
  return demoCases.find((c) => c.scenarioId === scenarioId);
}

/** Human-readable scenario labels for the welcome/demo screen (Spanish UI). */
export const scenarioLabels: Record<string, { title: string; description: string }> = {
  tendencia_variable: {
    title: 'Tendencia variable',
    description: 'Serie sintética que cambia día a día.',
  },
  sin_cambios: {
    title: 'Sin cambios relevantes',
    description: 'Serie sintética aproximadamente estable.',
  },
  medicion_invalida: {
    title: 'Lectura inválida',
    description: 'Incluye un registro sin contacto válido.',
  },
};
