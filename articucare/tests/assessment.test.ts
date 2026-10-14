/// <reference types="jest" />
import { areComparable, mockAssess } from '@/features/assessment/mockAssessment';

describe('mock visual assessment', () => {
  it('is deterministic for the same photoId', () => {
    expect(mockAssess('photo-abc')).toEqual(mockAssess('photo-abc'));
  });

  it('always reports mock origin and never a clinical decision', () => {
    const a = mockAssess('photo-xyz');
    expect(a.origin).toBe('mock');
    expect(a.isClinicalDecision).toBe(false);
  });

  it('refuses comparison when either photo requires a retake', () => {
    const good = { ...mockAssess('p1'), imageQuality: 'acceptable' as const };
    const bad = { ...mockAssess('p2'), imageQuality: 'retake_required' as const };
    expect(areComparable(good, bad)).toBe(false);
    expect(areComparable(good, good)).toBe(true);
  });
});
