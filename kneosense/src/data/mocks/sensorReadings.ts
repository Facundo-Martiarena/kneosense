import type { SensorReading } from '@/types';
import { uid } from '@/utils/id';

import { getDemoCase } from './loadScenarios';

/**
 * Deterministic synthetic multimodal patch readings per scenario. Reuses each
 * case's measurement timestamps + bioimpedance so the signals stay consistent
 * with the chart. Every value is SYNTHETIC; invalid readings carry nulls (never
 * fabricated). The scenarios tell different stories so the decision engine shows
 * distinct outcomes.
 */

type Profile = {
  refTempC: number;
  deltaStartC: number;
  deltaEndC: number;
  activity: number;
  batteryStart: number;
  batteryEnd: number;
};

const PROFILES: Record<string, Profile> = {
  // stable, no alarm
  sin_cambios: { refTempC: 33.0, deltaStartC: 0.3, deltaEndC: 0.6, activity: 0.72, batteryStart: 96, batteryEnd: 62 },
  // rising thermal differential → ends in alert, battery runs low
  tendencia_variable: { refTempC: 33.0, deltaStartC: 0.8, deltaEndC: 2.6, activity: 0.48, batteryStart: 90, batteryEnd: 14 },
  // low mobilization + an invalid reading
  medicion_invalida: { refTempC: 33.0, deltaStartC: 0.4, deltaEndC: 0.9, activity: 0.22, batteryStart: 80, batteryEnd: 41 },
};

const DEFAULT_PROFILE: Profile = { refTempC: 33.0, deltaStartC: 0.3, deltaEndC: 0.7, activity: 0.6, batteryStart: 95, batteryEnd: 60 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function sensorReadingsForCase(scenarioId: string | null): SensorReading[] {
  if (!scenarioId) return [];
  const demoCase = getDemoCase(scenarioId);
  if (!demoCase) return [];
  const p = PROFILES[scenarioId] ?? DEFAULT_PROFILE;
  const ms = demoCase.measurements;
  const n = Math.max(1, ms.length);

  return ms.map((m, i) => {
    const t = n > 1 ? i / (n - 1) : 1;
    const invalid = m.quality === 'invalid_contact' || m.impedanceMagnitudeOhm == null;
    const delta = lerp(p.deltaStartC, p.deltaEndC, t);
    const battery = Math.round(lerp(p.batteryStart, p.batteryEnd, t));
    return {
      id: `sr_${scenarioId}_${i}`,
      caseId: scenarioId,
      timestamp: m.timestamp,
      tempReferenceC: invalid ? null : Math.round(p.refTempC * 10) / 10,
      tempAffectedC: invalid ? null : Math.round((p.refTempC + delta) * 10) / 10,
      bioimpedanceOhm: m.impedanceMagnitudeOhm,
      activityIndex: invalid ? null : p.activity,
      batteryPct: battery,
      quality: m.quality,
      isSynthetic: true,
    };
  });
}

/** The most recent reading for a case (or null). */
export function latestSensorReading(scenarioId: string | null): SensorReading | null {
  const all = sensorReadingsForCase(scenarioId);
  return all.length ? all[all.length - 1] : null;
}

/** First valid bioimpedance as the baseline for the trend signal. */
export function bioimpedanceBaseline(scenarioId: string | null): number | null {
  const all = sensorReadingsForCase(scenarioId);
  const firstValid = all.find((r) => r.bioimpedanceOhm != null);
  return firstValid?.bioimpedanceOhm ?? null;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/**
 * Generates a new synthetic reading "now", drifting from the previous one. Used
 * by the "+ Nueva medición" action so the patch data is live (not hardcoded):
 * the reading is persisted and the decision re-evaluates. Uses light randomness
 * for demo liveliness — still clearly synthetic.
 */
export function generateNextReading(scenarioId: string, previous: SensorReading | null): SensorReading {
  const refT = previous?.tempReferenceC ?? 33.0;
  const prevDelta =
    previous && previous.tempAffectedC != null && previous.tempReferenceC != null
      ? previous.tempAffectedC - previous.tempReferenceC
      : 0.5;
  const delta = clamp(prevDelta + (Math.random() * 0.7 - 0.25), 0, 4);
  const bioz = (previous?.bioimpedanceOhm ?? 100) * (1 + (Math.random() * 0.06 - 0.03));
  const activity = clamp((previous?.activityIndex ?? 0.6) + (Math.random() * 0.2 - 0.1), 0, 1);
  return {
    id: uid('sr'),
    caseId: scenarioId,
    timestamp: new Date().toISOString(),
    tempReferenceC: round(refT),
    tempAffectedC: round(refT + delta),
    bioimpedanceOhm: round(bioz),
    activityIndex: round(activity, 2),
    batteryPct: Math.max(0, (previous?.batteryPct ?? 80) - 2),
    quality: 'simulated',
    isSynthetic: true,
  };
}
