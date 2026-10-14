/// <reference types="jest" />
import { demoCases } from '@/data/mocks/loadScenarios';
import { buildSummary } from '@/features/export/buildSummary';

describe('buildSummary', () => {
  const demoCase = demoCases[0];

  it('includes the mandatory synthetic-data and non-clinical markers', () => {
    const out = buildSummary(demoCase, [], []);
    expect(out).toContain('SINTÉTICOS');
    expect(out).toContain('NO ES UN INFORME CLÍNICO');
    expect(out).toContain('No es un dispositivo sanitario');
  });

  it('reports measurement counts including invalid readings', () => {
    const invalidCase = demoCases.find((c) => c.scenarioId === 'medicion_invalida')!;
    const out = buildSummary(invalidCase, [], []);
    expect(out).toContain('inválidos');
  });
});

describe('loadScenarios', () => {
  it('loads three synthetic demo cases', () => {
    expect(demoCases).toHaveLength(3);
    expect(demoCases.every((c) => c.synthetic)).toBe(true);
  });

  it('synthesizes an intervention date from the first measurement', () => {
    const c = demoCases[0];
    expect(c.interventionDate).toBe(c.measurements[0].timestamp);
  });
});
