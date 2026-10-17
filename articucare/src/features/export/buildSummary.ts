import type { DemoCase, PhotoRecord, SymptomEntry } from '@/types';
import { fullDate } from '@/utils/date';

/**
 * Builds a plain-text export of the demo case. Plan RF-08 + section 8
 * "Historial / resumen". The output is explicitly labelled as synthetic demo
 * data and carries the clinical-safety disclaimer (plan section 10.2).
 */
export function buildSummary(
  demoCase: DemoCase,
  photos: PhotoRecord[],
  symptoms: SymptomEntry[],
): string {
  const valid = demoCase.measurements.filter((m) => m.impedanceMagnitudeOhm != null);
  const invalid = demoCase.measurements.length - valid.length;
  const lines: string[] = [];

  lines.push('KNEOSENSE AI — RESUMEN DE CASO DEMOSTRATIVO');
  lines.push('*** DATOS 100% SINTÉTICOS · NO ES UN INFORME CLÍNICO ***');
  lines.push('');
  lines.push(`Escenario: ${demoCase.scenarioId}`);
  lines.push(`Paciente ficticio: ${demoCase.patientId}`);
  lines.push(`Articulación: ${demoCase.joint}`);
  lines.push(`Procedimiento (ficticio): ${demoCase.procedure}`);
  lines.push('');
  lines.push('BIOIMPEDANCIA SINTÉTICA');
  lines.push(`- Registros: ${demoCase.measurements.length} (válidos ${valid.length}, inválidos ${invalid})`);
  if (valid.length) {
    const last = valid[valid.length - 1];
    lines.push(`- Último valor sintético: ${last.impedanceMagnitudeOhm?.toFixed(1)} Ω @ ${last.frequencyHz / 1000} kHz`);
  }
  lines.push('');
  lines.push(`FOTOS: ${photos.length} (todas marcadas como demostrativas)`);
  photos.forEach((p) => {
    lines.push(`- ${fullDate(p.capturedAt)} · calidad ${p.assessment?.imageQuality ?? 'n/d'} · origen ${p.assessment?.origin ?? 'n/d'}`);
  });
  lines.push('');
  lines.push(`SÍNTOMAS REGISTRADOS: ${symptoms.length}`);
  symptoms.forEach((s) => {
    lines.push(`- ${fullDate(s.recordedAt)} · dolor ${s.pain0to10}/10 · rigidez ${s.stiffness0to10}/10 · hinchazón ${s.swellingPerception}`);
  });
  lines.push('');
  lines.push('LÍMITES DE USO');
  lines.push('No es un dispositivo sanitario. No presenta porcentajes de inflamación, diagnósticos');
  lines.push('ni alertas de infección. El profesional de salud interpreta la evolución postoperatoria.');
  lines.push(`Generado: ${fullDate(new Date().toISOString())}`);

  return lines.join('\n');
}
