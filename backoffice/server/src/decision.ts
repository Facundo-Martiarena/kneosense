import type { DecisionResult, PhotoSignal, SensorReading, SignalFinding, SignalLevel } from './types.js';

/**
 * Standalone copy of the app's rule-based decision engine (same cited
 * thresholds + Celso tetrad). Kept server-local to avoid RN/path-alias deps.
 * NEVER a diagnosis (isClinicalDecision: false).
 */

export const TEMP_DELTA_WATCH_C = 1.0;
export const TEMP_DELTA_ALERT_C = 2.2;
export const TEMP_ABS_ALERT_C = 38.0;
export const BATTERY_WATCH_PCT = 20;
export const BATTERY_ALERT_PCT = 10;
export const ACTIVITY_WATCH = 0.3;
export const PAIN_WATCH = 4;
export const PAIN_HIGH = 7;
export const BIOZ_WATCH_DROP = 0.15;
export const BIOZ_ALERT_DROP = 0.25;

export type EvaluateOptions = {
  baselineOhm?: number | null;
  previousReading?: SensorReading | null;
  photo?: PhotoSignal | null;
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
    return { key: 'temperature', level: 'unavailable', label: 'Temperatura no disponible', detail: 'Falta referencia o zona afectada.' };
  }
  const deltaTxt = `Δ ${delta.toFixed(1)} °C (afectada ${r.tempAffectedC.toFixed(1)} − ref ${r.tempReferenceC.toFixed(1)})`;
  if (r.tempAffectedC >= TEMP_ABS_ALERT_C) {
    return { key: 'temperature', level: 'alert', label: 'Temperatura elevada', detail: `${deltaTxt}. Absoluta ≥38 °C (banda de infección).` };
  }
  if (delta >= TEMP_DELTA_ALERT_C) {
    const prevDelta = tempDelta(previous);
    const confirmed = prevDelta != null && prevDelta >= TEMP_DELTA_ALERT_C;
    return confirmed
      ? { key: 'temperature', level: 'alert', label: 'Temperatura elevada (confirmada)', detail: `${deltaTxt}. ≥2,2 °C confirmado en 2 mediciones (Wijlens 2017).` }
      : { key: 'temperature', level: 'watch', label: 'Temperatura elevada (a confirmar)', detail: `${deltaTxt}. ≥2,2 °C en una sola medición; confirmar al día siguiente.` };
  }
  if (delta >= TEMP_DELTA_WATCH_C) {
    return { key: 'temperature', level: 'watch', label: 'Temperatura a vigilar', detail: `${deltaTxt}. Por debajo de 2,2 °C.` };
  }
  return { key: 'temperature', level: 'normal', label: 'Temperatura normal', detail: `${deltaTxt}.` };
}

function evaluateBioimpedance(r: SensorReading, baselineOhm?: number | null): SignalFinding {
  if (r.bioimpedanceOhm == null) {
    return { key: 'bioimpedance', level: 'unavailable', label: 'Bioimpedancia no disponible', detail: 'Lectura sin contacto válido.' };
  }
  const valTxt = `${r.bioimpedanceOhm.toFixed(1)} Ω`;
  if (baselineOhm != null && baselineOhm > 0) {
    const drop = (baselineOhm - r.bioimpedanceOhm) / baselineOhm;
    const dropTxt = `${(drop * 100).toFixed(0)}% vs base ${baselineOhm.toFixed(0)} Ω`;
    if (drop >= BIOZ_ALERT_DROP) return { key: 'bioimpedance', level: 'alert', label: 'Bioimpedancia en descenso marcado', detail: `${valTxt} (${dropTxt}). Posible edema. Banda ilustrativa; L-Dex baja sensibilidad.` };
    if (drop >= BIOZ_WATCH_DROP) return { key: 'bioimpedance', level: 'watch', label: 'Bioimpedancia en descenso', detail: `${valTxt} (${dropTxt}). Señal de tendencia.` };
  }
  return { key: 'bioimpedance', level: 'normal', label: 'Bioimpedancia estable', detail: `${valTxt}. Tendencia de edema; sin umbral clínico en Ω.` };
}

function evaluateActivity(r: SensorReading): SignalFinding {
  if (r.activityIndex == null) return { key: 'activity', level: 'unavailable', label: 'Actividad no disponible', detail: 'Sin datos del IMU.' };
  const pct = Math.round(r.activityIndex * 100);
  return r.activityIndex < ACTIVITY_WATCH
    ? { key: 'activity', level: 'watch', label: 'Poca movilización', detail: `${pct}% del objetivo (IMU). Adherencia, no clínico.` }
    : { key: 'activity', level: 'normal', label: 'Movilización adecuada', detail: `${pct}% del objetivo (IMU).` };
}

function evaluateBattery(r: SensorReading): SignalFinding {
  if (r.batteryPct < BATTERY_ALERT_PCT) return { key: 'battery', level: 'alert', label: 'Batería crítica', detail: `${r.batteryPct}%.` };
  if (r.batteryPct < BATTERY_WATCH_PCT) return { key: 'battery', level: 'watch', label: 'Batería baja', detail: `${r.batteryPct}%.` };
  return { key: 'battery', level: 'normal', label: 'Batería OK', detail: `${r.batteryPct}%.` };
}

function evaluatePhoto(photo?: PhotoSignal | null): SignalFinding {
  if (!photo) return { key: 'photo', level: 'unavailable', label: 'Sin foto para cruzar', detail: 'No hay foto reciente.' };
  const visible: string[] = [];
  if (photo.edemaVisible === 'existent') visible.push('edema');
  if (photo.erythemaVisible === 'existent') visible.push('eritema');
  if (visible.length) return { key: 'photo', level: 'watch', label: 'Signos visibles en foto', detail: `Se observa ${visible.join(' y ')} (ilustrativo).` };
  if (photo.edemaVisible === 'uncertain' || photo.erythemaVisible === 'uncertain') return { key: 'photo', level: 'watch', label: 'Hallazgos inciertos en foto', detail: 'Conviene nueva toma.' };
  return { key: 'photo', level: 'normal', label: 'Sin signos visibles', detail: 'No se observa edema ni eritema.' };
}

function evaluatePain(pain?: number | null): SignalFinding {
  if (pain == null) return { key: 'pain', level: 'unavailable', label: 'Sin registro de dolor', detail: 'El paciente no registró dolor.' };
  if (pain >= PAIN_HIGH) return { key: 'pain', level: 'watch', label: 'Dolor alto', detail: `${pain}/10 (autoinforme). Signo de Celso.` };
  if (pain >= PAIN_WATCH) return { key: 'pain', level: 'watch', label: 'Dolor moderado', detail: `${pain}/10 (autoinforme).` };
  return { key: 'pain', level: 'normal', label: 'Dolor bajo', detail: `${pain}/10 (autoinforme).` };
}

function recommend(level: SignalLevel): string {
  switch (level) {
    case 'alert':
      return 'Señales compatibles con inflamación/infección. NO es un diagnóstico: valorar al paciente.';
    case 'watch':
      return 'Señales a vigilar. Seguir la evolución; repetir medición.';
    case 'unavailable':
      return 'Señales insuficientes. Revisar la colocación del parche.';
    default:
      return 'Sin señales de alarma en esta medición.';
  }
}

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

  const delta = tempDelta(reading);
  const tempElevated =
    (delta != null && delta >= TEMP_DELTA_ALERT_C) ||
    (reading.tempAffectedC != null && reading.tempAffectedC >= TEMP_ABS_ALERT_C);
  const photoPositive = !!opts.photo && (opts.photo.edemaVisible === 'existent' || opts.photo.erythemaVisible === 'existent');
  const painHigh = opts.pain != null && opts.pain >= PAIN_HIGH;
  const corroborated = tempElevated && (photoPositive || painHigh);

  const signs: string[] = [];
  if (photoPositive) signs.push('signos visibles en la foto');
  if (painHigh) signs.push('dolor alto');

  const overallLevel: SignalLevel = corroborated ? 'alert' : base;
  const recommendation = corroborated
    ? `Temperatura elevada + ${signs.join(' y ')} — varios signos de inflamación (tétrada de Celso). NO es un diagnóstico: valorar al paciente.`
    : recommend(overallLevel);

  return { findings, overallLevel, recommendation, isClinicalDecision: false };
}
