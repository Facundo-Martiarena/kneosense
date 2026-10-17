import type {
  DecisionResult,
  PhotoSignal,
  SensorReading,
  SignalFinding,
  SignalLevel,
} from '@/types';

/**
 * TRANSPARENT, rule-based decision engine for the KneoSense patch signals.
 *
 * This is NOT a trained model and NEVER a diagnosis. It combines the multimodal
 * readings against PUBLISHED per-signal thresholds and returns an illustrative,
 * non-diagnostic recommendation. Chosen over an ML model because no validated
 * multimodal dataset/model exists for this case and training on synthetic data
 * would only learn the simulation (see odd/tasks/kneosense-decision-engine.md).
 *
 * Cited references:
 * - Temp differential (affected − reference) ≥ 2.2 °C = inflammation alert
 *   (diabetic foot: Wijlens 2017, Int Wound J; Featherston 2024). NOT valid as a
 *   single reading → a lone ≥2.2 °C delta is WATCH; it escalates to ALERT only
 *   when CONFIRMED by the previous (next-day) reading.
 * - Absolute skin temp ≥ 38.0 °C associated with infection → ALERT on its own
 *   (wound-healing wearable review, PMC8070747).
 * - Bioimpedance = edema TREND signal (L-Dex ≥6/≥10 units vs baseline) with LOW
 *   sensitivity; Ω has no standardized clinical cutoff → supporting only.
 * - IMU activity = rehab-adherence indicator (no hard clinical cutoff).
 * - Photo cross-check: visible edema/erythema corroborates the thermal signal;
 *   elevated temp + visible photo signs escalate the overall level to ALERT.
 */

export const TEMP_DELTA_WATCH_C = 1.0;
export const TEMP_DELTA_ALERT_C = 2.2;
export const TEMP_ABS_ALERT_C = 38.0;
export const BATTERY_WATCH_PCT = 20;
export const BATTERY_ALERT_PCT = 10;
export const ACTIVITY_WATCH = 0.3;
export const PAIN_WATCH = 4;
export const PAIN_HIGH = 7;
/** Illustrative only — a relative bioimpedance drop vs baseline (no clinical cutoff in Ω). */
export const BIOZ_WATCH_DROP = 0.15;
export const BIOZ_ALERT_DROP = 0.25;

export type EvaluateOptions = {
  /** Enables the bioimpedance trend signal. */
  baselineOhm?: number | null;
  /** Previous (ideally next-day) reading, to confirm the temperature delta. */
  previousReading?: SensorReading | null;
  /** Latest photo findings, to corroborate the sensor signals. */
  photo?: PhotoSignal | null;
  /** Latest self-reported pain 0..10 (Celso's "dolor"), to corroborate. */
  pain?: number | null;
};

const SEVERITY: Record<SignalLevel, number> = { unavailable: -1, normal: 0, watch: 1, alert: 2 };

function tempDelta(r?: SensorReading | null): number | null {
  if (!r || r.tempReferenceC == null || r.tempAffectedC == null) return null;
  return r.tempAffectedC - r.tempReferenceC;
}

function evaluateTemperature(r: SensorReading, previous?: SensorReading | null): SignalFinding {
  const delta = tempDelta(r);
  if (delta == null || r.tempAffectedC == null || r.tempReferenceC == null) {
    return {
      key: 'temperature',
      level: 'unavailable',
      label: 'Temperatura no disponible',
      detail: 'Falta la lectura de referencia o de la zona afectada.',
    };
  }
  const deltaTxt = `Δ ${delta.toFixed(1)} °C (afectada ${r.tempAffectedC.toFixed(1)} − ref ${r.tempReferenceC.toFixed(1)})`;

  if (r.tempAffectedC >= TEMP_ABS_ALERT_C) {
    return {
      key: 'temperature',
      level: 'alert',
      label: 'Temperatura elevada',
      detail: `${deltaTxt}. Absoluta ≥38 °C (banda de infección).`,
    };
  }
  if (delta >= TEMP_DELTA_ALERT_C) {
    const prevDelta = tempDelta(previous);
    const confirmed = prevDelta != null && prevDelta >= TEMP_DELTA_ALERT_C;
    if (confirmed) {
      return {
        key: 'temperature',
        level: 'alert',
        label: 'Temperatura elevada (confirmada)',
        detail: `${deltaTxt}. ≥2,2 °C confirmado en 2 mediciones consecutivas (Wijlens 2017).`,
      };
    }
    return {
      key: 'temperature',
      level: 'watch',
      label: 'Temperatura elevada (a confirmar)',
      detail: `${deltaTxt}. ≥2,2 °C en una sola medición; confirmá al día siguiente antes de alertar (Wijlens 2017).`,
    };
  }
  if (delta >= TEMP_DELTA_WATCH_C) {
    return {
      key: 'temperature',
      level: 'watch',
      label: 'Temperatura a vigilar',
      detail: `${deltaTxt}. Por debajo del umbral de 2,2 °C.`,
    };
  }
  return { key: 'temperature', level: 'normal', label: 'Temperatura normal', detail: `${deltaTxt}.` };
}

function evaluateBioimpedance(r: SensorReading, baselineOhm?: number | null): SignalFinding {
  if (r.bioimpedanceOhm == null) {
    return {
      key: 'bioimpedance',
      level: 'unavailable',
      label: 'Bioimpedancia no disponible',
      detail: 'Lectura sin contacto válido; no se interpola.',
    };
  }
  const valTxt = `${r.bioimpedanceOhm.toFixed(1)} Ω`;
  if (baselineOhm != null && baselineOhm > 0) {
    const drop = (baselineOhm - r.bioimpedanceOhm) / baselineOhm; // fluid ↑ ⇒ impedance ↓
    const dropTxt = `${(drop * 100).toFixed(0)}% vs base ${baselineOhm.toFixed(0)} Ω`;
    if (drop >= BIOZ_ALERT_DROP) {
      return { key: 'bioimpedance', level: 'alert', label: 'Bioimpedancia en descenso marcado', detail: `${valTxt} (${dropTxt}). Posible aumento de líquido (edema). Banda ilustrativa; L-Dex usa ≥6/≥10 u. y tiene baja sensibilidad.` };
    }
    if (drop >= BIOZ_WATCH_DROP) {
      return { key: 'bioimpedance', level: 'watch', label: 'Bioimpedancia en descenso', detail: `${valTxt} (${dropTxt}). Señal de tendencia; L-Dex baja sensibilidad.` };
    }
  }
  return {
    key: 'bioimpedance',
    level: 'normal',
    label: 'Bioimpedancia estable',
    detail: `${valTxt}. Señal de tendencia (edema); sin umbral clínico estandarizado en Ω.`,
  };
}

function evaluateActivity(r: SensorReading): SignalFinding {
  if (r.activityIndex == null) {
    return { key: 'activity', level: 'unavailable', label: 'Actividad no disponible', detail: 'Sin datos del IMU.' };
  }
  const pct = Math.round(r.activityIndex * 100);
  if (r.activityIndex < ACTIVITY_WATCH) {
    return {
      key: 'activity',
      level: 'watch',
      label: 'Poca movilización',
      detail: `${pct}% del objetivo diario (IMU). Indicador de adherencia, no clínico.`,
    };
  }
  return { key: 'activity', level: 'normal', label: 'Movilización adecuada', detail: `${pct}% del objetivo diario (IMU).` };
}

function evaluateBattery(r: SensorReading): SignalFinding {
  if (r.batteryPct < BATTERY_ALERT_PCT) {
    return { key: 'battery', level: 'alert', label: 'Batería crítica', detail: `${r.batteryPct}%. Cargá el parche.` };
  }
  if (r.batteryPct < BATTERY_WATCH_PCT) {
    return { key: 'battery', level: 'watch', label: 'Batería baja', detail: `${r.batteryPct}%.` };
  }
  return { key: 'battery', level: 'normal', label: 'Batería OK', detail: `${r.batteryPct}%.` };
}

function evaluatePhoto(photo?: PhotoSignal | null): SignalFinding {
  if (!photo) {
    return { key: 'photo', level: 'unavailable', label: 'Sin foto para cruzar', detail: 'Agregá una foto para corroborar las señales del parche.' };
  }
  const visible: string[] = [];
  if (photo.edemaVisible === 'existent') visible.push('edema');
  if (photo.erythemaVisible === 'existent') visible.push('eritema');
  if (visible.length) {
    return { key: 'photo', level: 'watch', label: 'Signos visibles en foto', detail: `Se observa ${visible.join(' y ')} (ilustrativo, no diagnóstico).` };
  }
  if (photo.edemaVisible === 'uncertain' || photo.erythemaVisible === 'uncertain') {
    return { key: 'photo', level: 'watch', label: 'Hallazgos inciertos en foto', detail: 'Calidad/indeterminado; conviene una nueva toma.' };
  }
  return { key: 'photo', level: 'normal', label: 'Sin signos visibles', detail: 'No se observa edema ni eritema en la foto.' };
}

function evaluatePain(pain?: number | null): SignalFinding {
  if (pain == null) {
    return {
      key: 'pain',
      level: 'unavailable',
      label: 'Sin registro de dolor',
      detail: 'Registrá tu dolor en Síntomas para cruzarlo con el resto.',
    };
  }
  if (pain >= PAIN_HIGH) {
    return {
      key: 'pain',
      level: 'watch',
      label: 'Dolor alto',
      detail: `${pain}/10 (autoinforme). El dolor es uno de los signos de Celso.`,
    };
  }
  if (pain >= PAIN_WATCH) {
    return { key: 'pain', level: 'watch', label: 'Dolor moderado', detail: `${pain}/10 (autoinforme).` };
  }
  return { key: 'pain', level: 'normal', label: 'Dolor bajo', detail: `${pain}/10 (autoinforme).` };
}

function recommend(level: SignalLevel): string {
  switch (level) {
    case 'alert':
      return 'Hay señales compatibles con inflamación/infección. Esto NO es un diagnóstico: consultá a tu equipo de salud.';
    case 'watch':
      return 'Hay señales a vigilar. Repetí la medición al día siguiente y seguí la evolución; ante dudas, consultá.';
    case 'unavailable':
      return 'No hay señales suficientes para evaluar. Revisá la colocación del parche y repetí la medición.';
    default:
      return 'Sin señales de alarma en esta medición. Seguí con tu plan de recuperación.';
  }
}

/**
 * Evaluate one multimodal reading. Pure and deterministic. `opts` enables the
 * bioimpedance trend (baselineOhm), the next-day temperature confirmation
 * (previousReading) and the photo cross-check (photo).
 */
export function evaluateReading(reading: SensorReading, opts: EvaluateOptions = {}): DecisionResult {
  const findings: SignalFinding[] = [
    evaluateTemperature(reading, opts.previousReading),
    evaluateBioimpedance(reading, opts.baselineOhm),
    evaluateActivity(reading),
    evaluateBattery(reading),
    evaluatePhoto(opts.photo),
    evaluatePain(opts.pain),
  ];

  const ranked = findings.filter((f) => f.level !== 'unavailable');
  const base: SignalLevel = ranked.length
    ? ranked.reduce<SignalLevel>((acc, f) => (SEVERITY[f.level] > SEVERITY[acc] ? f.level : acc), 'normal')
    : 'unavailable';

  // Cross-signal corroboration: elevated temperature + visible photo signs.
  const delta = tempDelta(reading);
  const tempElevated =
    (delta != null && delta >= TEMP_DELTA_ALERT_C) ||
    (reading.tempAffectedC != null && reading.tempAffectedC >= TEMP_ABS_ALERT_C);
  const photoPositive =
    !!opts.photo && (opts.photo.edemaVisible === 'existent' || opts.photo.erythemaVisible === 'existent');
  const painHigh = opts.pain != null && opts.pain >= PAIN_HIGH;
  const corroborated = tempElevated && (photoPositive || painHigh);

  const signs: string[] = [];
  if (photoPositive) signs.push('signos visibles en la foto');
  if (painHigh) signs.push('dolor alto');

  const overallLevel: SignalLevel = corroborated ? 'alert' : base;
  const recommendation = corroborated
    ? `La temperatura elevada coincide con ${signs.join(' y ')} — varios signos de inflamación (tétrada de Celso). Esto NO es un diagnóstico: consultá a tu equipo de salud.`
    : recommend(overallLevel);

  return { findings, overallLevel, recommendation, isClinicalDecision: false };
}
