/// <reference types="jest" />
import { buildSyncPayload } from '@/features/sync/syncClient';
import type { SensorReading } from '@/types';

function reading(id: string, over: Partial<SensorReading> = {}): SensorReading {
  return {
    id,
    caseId: 'scn',
    timestamp: '2026-10-16T09:00:00.000Z',
    tempReferenceC: 33,
    tempAffectedC: 35,
    bioimpedanceOhm: 100,
    activityIndex: 0.6,
    batteryPct: 80,
    quality: 'simulated',
    isSynthetic: true,
    ...over,
  };
}

describe('buildSyncPayload', () => {
  it('maps patient identity and strips app-only reading fields', () => {
    const payload = buildSyncPayload({
      patientId: 'scn',
      name: 'Paciente demo',
      joint: 'knee',
      side: 'left',
      edemaVisible: 'existent',
      erythemaVisible: 'non_existent',
      pain0to10: 7,
      readings: [reading('r0'), reading('r1', { tempAffectedC: null, quality: 'invalid_contact' })],
    });

    expect(payload.patient).toEqual({
      id: 'scn',
      name: 'Paciente demo',
      joint: 'knee',
      side: 'left',
      edemaVisible: 'existent',
      erythemaVisible: 'non_existent',
      pain0to10: 7,
    });
    expect(payload.readings).toHaveLength(2);
    expect(payload.readings[0]).toEqual({
      id: 'r0',
      timestamp: '2026-10-16T09:00:00.000Z',
      tempReferenceC: 33,
      tempAffectedC: 35,
      bioimpedanceOhm: 100,
      activityIndex: 0.6,
      batteryPct: 80,
      quality: 'simulated',
    });
    // app-only fields are not forwarded
    expect((payload.readings[0] as Record<string, unknown>).caseId).toBeUndefined();
    expect((payload.readings[0] as Record<string, unknown>).isSynthetic).toBeUndefined();
    expect(payload.readings[1].tempAffectedC).toBeNull();
  });
});
