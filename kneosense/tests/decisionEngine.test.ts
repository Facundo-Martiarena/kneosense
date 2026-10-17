/// <reference types="jest" />
import { evaluateReading, TEMP_DELTA_ALERT_C, TEMP_ABS_ALERT_C } from '@/features/assessment/decisionEngine';
import type { SensorReading } from '@/types';

function reading(partial: Partial<SensorReading>): SensorReading {
  return {
    id: 'r1',
    caseId: 'c1',
    timestamp: '2026-01-01T00:00:00.000Z',
    tempReferenceC: 33.0,
    tempAffectedC: 33.2,
    bioimpedanceOhm: 100,
    activityIndex: 0.7,
    batteryPct: 80,
    quality: 'simulated',
    isSynthetic: true,
    ...partial,
  };
}

const hotToday = reading({ tempReferenceC: 33.0, tempAffectedC: 33.0 + TEMP_DELTA_ALERT_C });
const hotYesterday = reading({
  id: 'r0',
  tempReferenceC: 33.0,
  tempAffectedC: 33.0 + TEMP_DELTA_ALERT_C,
});

describe('decision engine (rule-based, non-diagnostic)', () => {
  it('never emits a clinical decision', () => {
    expect(evaluateReading(reading({})).isClinicalDecision).toBe(false);
  });

  it('a single >=2.2 C delta is WATCH (pending next-day confirmation), not alert', () => {
    const temp = evaluateReading(hotToday).findings.find((f) => f.key === 'temperature');
    expect(temp?.level).toBe('watch');
  });

  it('a >=2.2 C delta CONFIRMED by the previous reading is ALERT', () => {
    const temp = evaluateReading(hotToday, { previousReading: hotYesterday }).findings.find(
      (f) => f.key === 'temperature',
    );
    expect(temp?.level).toBe('alert');
  });

  it('absolute affected temp >=38 C is ALERT on its own', () => {
    const temp = evaluateReading(reading({ tempReferenceC: 37, tempAffectedC: TEMP_ABS_ALERT_C }))
      .findings.find((f) => f.key === 'temperature');
    expect(temp?.level).toBe('alert');
  });

  it('reports temperature UNAVAILABLE when a temp is missing', () => {
    const temp = evaluateReading(reading({ tempAffectedC: null }))
      .findings.find((f) => f.key === 'temperature');
    expect(temp?.level).toBe('unavailable');
  });

  it('adds a photo finding: visible edema/erythema is WATCH', () => {
    const photo = evaluateReading(reading({}), {
      photo: { edemaVisible: 'existent', erythemaVisible: 'non_existent' },
    }).findings.find((f) => f.key === 'photo');
    expect(photo?.level).toBe('watch');
  });

  it('photo finding is UNAVAILABLE when no photo is provided', () => {
    const photo = evaluateReading(reading({})).findings.find((f) => f.key === 'photo');
    expect(photo?.level).toBe('unavailable');
  });

  it('adds a pain finding: high self-reported pain (>=7) is WATCH', () => {
    const pain = evaluateReading(reading({}), { pain: 8 }).findings.find((f) => f.key === 'pain');
    expect(pain?.level).toBe('watch');
  });

  it('pain finding is UNAVAILABLE when no pain is provided', () => {
    const pain = evaluateReading(reading({})).findings.find((f) => f.key === 'pain');
    expect(pain?.level).toBe('unavailable');
  });

  it('corroboration: elevated temp + high pain escalates overall to ALERT', () => {
    expect(evaluateReading(hotToday, { pain: 8 }).overallLevel).toBe('alert');
  });

  it('corroboration: elevated temp + visible photo signs escalates overall to ALERT', () => {
    // Single >=2.2 delta (would be watch alone) + visible edema → corroborated alert.
    const res = evaluateReading(hotToday, {
      photo: { edemaVisible: 'existent', erythemaVisible: 'uncertain' },
    });
    expect(res.overallLevel).toBe('alert');
  });

  it('flags battery ALERT under 10% and WATCH under 20%', () => {
    expect(evaluateReading(reading({ batteryPct: 8 })).findings.find((f) => f.key === 'battery')?.level).toBe('alert');
    expect(evaluateReading(reading({ batteryPct: 15 })).findings.find((f) => f.key === 'battery')?.level).toBe('watch');
  });

  it('flags low IMU activity as WATCH (rehab adherence)', () => {
    expect(evaluateReading(reading({ activityIndex: 0.1 })).findings.find((f) => f.key === 'activity')?.level).toBe('watch');
  });

  it('is deterministic', () => {
    expect(evaluateReading(hotToday, { previousReading: hotYesterday })).toEqual(
      evaluateReading(hotToday, { previousReading: hotYesterday }),
    );
  });
});
