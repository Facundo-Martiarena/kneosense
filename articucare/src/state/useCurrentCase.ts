import { getDemoCase } from '@/data/mocks/loadScenarios';
import type { DemoCase } from '@/types';
import { useAppStore } from '@/state/appStore';

/** Resolves the currently selected DemoCase, or null if none is selected. */
export function useCurrentCase(): DemoCase | null {
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);
  if (!selectedCaseId) return null;
  return getDemoCase(selectedCaseId) ?? null;
}
