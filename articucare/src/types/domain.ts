/**
 * Core domain contracts for ArticuCare AI.
 *
 * SAFETY: every value handled here is SYNTHETIC demo data. Nothing in this app
 * represents a real clinical measurement, diagnosis, or recommendation.
 * See ArticuCare_Plan_Desarrollo_iOS_Android.md (sections 1.2, 3, 5, 10).
 */

export type Joint = 'knee' | 'wrist' | 'ankle' | 'elbow';
export type Side = 'left' | 'right';

/** Measurement quality flag. `invalid_contact` means the reading is unusable. */
export type MeasurementQuality = 'simulated' | 'invalid_contact';

/** Where a measurement came from. Only `mock` exists in the MVP. */
export type MeasurementSource = 'mock' | 'ble_device';

/**
 * A single bioimpedance reading. Mirrors the shape a future BLE sensor would
 * emit so the UI never needs to change when real hardware is adapted in.
 * Plan section 3.1.
 */
export type ImpedanceMeasurement = {
  id: string;
  timestamp: string; // ISO 8601
  joint: Joint;
  side: Side;
  frequencyHz: number;
  /** null when the reading is invalid; the app must NOT fabricate a value. */
  impedanceMagnitudeOhm: number | null;
  phaseDegrees: number | null;
  skinTemperatureC?: number;
  /** Synthetic pain score bundled with the demo fixtures (0-10). */
  pain0to10?: number;
  quality: MeasurementQuality;
  source: MeasurementSource;
  /** Always true in the MVP. Drives the mandatory synthetic-data labelling. */
  isSynthetic: boolean;
};

/** Visual analysis attribute state. `uncertain` is a first-class value. */
export type AttributeState = 'existent' | 'non_existent' | 'uncertain';

/**
 * Result of visual photo analysis. Plan section 5.3.
 * `isClinicalDecision` is permanently false: this is never a diagnosis.
 */
export type VisualAssessment = {
  photoId: string;
  origin: 'mock' | 'experimental_model';
  edemaVisible: AttributeState;
  erythemaVisible: AttributeState;
  imageQuality: 'acceptable' | 'retake_required';
  version: string;
  isClinicalDecision: false;
};

/** A captured/uploaded photo of the joint with minimal metadata. */
export type PhotoRecord = {
  id: string;
  caseId: string;
  uri: string;
  capturedAt: string; // ISO 8601
  joint: Joint;
  side: Side;
  /** Day number relative to the fictional intervention date. */
  day?: number;
  assessment?: VisualAssessment;
  /** User note attached to the photo. */
  note?: string;
};

/** A self-reported symptom entry. Plan RF-05, screen "Registro de síntomas". */
export type SymptomEntry = {
  id: string;
  caseId: string;
  recordedAt: string; // ISO 8601
  pain0to10: number;
  /** Perceived swelling, NOT a measured value. */
  swellingPerception: 'none' | 'mild' | 'moderate' | 'severe';
  stiffness0to10: number;
  comment?: string;
};

/** Illustrative visualization config (never derived from a patient photo). */
export type Visualization = {
  mode: 'illustrative_3d' | 'illustrative_2_5d';
  anatomy: Joint;
  overlay: 'scenario_only' | string;
  derivedFromPatientPhoto: false;
};

/**
 * A demonstration case: one fictional patient + one joint + a synthetic series.
 * Plan sections 1.1, 8 (panel principal).
 */
export type DemoCase = {
  scenarioId: string;
  patientId: string;
  synthetic: true;
  joint: Joint;
  procedure: string;
  /** Fictional intervention date, used to compute "days since surgery". */
  interventionDate: string; // ISO 8601
  measurements: ImpedanceMeasurement[];
  photoAnnotations: PhotoAnnotation[];
  visualization: Visualization;
};

/** Pre-baked demo photo annotation shipped with the fixtures. */
export type PhotoAnnotation = {
  day: number;
  edemaVisible: AttributeState;
  erythemaVisible: AttributeState;
  imageUri: string;
};
