/** Date helpers. All dates are ISO 8601 strings in the domain model. */

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Days since the fictional intervention, clamped to >= 0. */
export function daysSince(interventionIso: string, atIso: string): number {
  return Math.max(0, daysBetween(interventionIso, atIso));
}

/** Short date like "01/10". */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

/** Full local date like "01/10/2026". */
export function fullDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}
