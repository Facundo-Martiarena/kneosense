import type { VisualAssessment } from '@/types';

/**
 * Deterministic MOCK visual assessment. Plan section 5: the MVP integrates a
 * simulated result to complete the product flow; a real model (SurgWound) is a
 * separate offline experiment and only its weights would later be integrated.
 *
 * origin is always 'mock' and isClinicalDecision is permanently false. This is
 * NOT a diagnosis and never reports an infection probability (plan section 5.3).
 */

const MODEL_VERSION = 'mock-0.1.0';

/** Small deterministic hash so the same photoId always yields the same result. */
function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function mockAssess(photoId: string): VisualAssessment {
  const h = hash(photoId);
  const edemaStates = ['existent', 'non_existent', 'uncertain'] as const;
  const erythemaStates = ['non_existent', 'uncertain', 'existent'] as const;

  // ~1 in 4 photos is flagged for retake to exercise the "non-comparable" path.
  const imageQuality = h % 4 === 0 ? 'retake_required' : 'acceptable';

  return {
    photoId,
    origin: 'mock',
    edemaVisible: edemaStates[h % edemaStates.length],
    erythemaVisible: erythemaStates[(h >> 2) % erythemaStates.length],
    imageQuality,
    version: MODEL_VERSION,
    isClinicalDecision: false,
  };
}

/**
 * Two photos are comparable only if both passed quality. Plan section 3.2
 * "Foto no comparable": the app must request a new capture, never emit a
 * comparison for degraded images.
 */
export function areComparable(a: VisualAssessment, b: VisualAssessment): boolean {
  return a.imageQuality === 'acceptable' && b.imageQuality === 'acceptable';
}
