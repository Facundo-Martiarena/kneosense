/** Server-local domain types (mirrors the app; kept standalone, no RN deps). */

export type AttributeState = 'existent' | 'non_existent' | 'uncertain';
export type MeasurementQuality = 'simulated' | 'invalid_contact';

export type Patient = {
  id: string;
  name: string;
  joint: string;
  side: string;
  /** Latest demo photo signs + pain, used to corroborate the sensor signals. */
  edemaVisible: AttributeState;
  erythemaVisible: AttributeState;
  pain0to10: number | null;
};

export type SensorReading = {
  id: string;
  patientId: string;
  timestamp: string;
  tempReferenceC: number | null;
  tempAffectedC: number | null;
  bioimpedanceOhm: number | null;
  activityIndex: number | null;
  batteryPct: number;
  quality: MeasurementQuality;
};

export type SignalLevel = 'normal' | 'watch' | 'alert' | 'unavailable';
export type SignalKey = 'temperature' | 'bioimpedance' | 'activity' | 'battery' | 'photo' | 'pain';

export type SignalFinding = {
  key: SignalKey;
  level: SignalLevel;
  label: string;
  detail: string;
};

export type DecisionResult = {
  findings: SignalFinding[];
  overallLevel: SignalLevel;
  recommendation: string;
  isClinicalDecision: false;
};

export type PhotoSignal = { edemaVisible: AttributeState; erythemaVisible: AttributeState };

export type Photo = {
  id: string;
  patientId: string;
  capturedAt: string;
  filename: string;
  edema: string | null;
  erythema: string | null;
  quality: string | null;
  note: string | null;
};
