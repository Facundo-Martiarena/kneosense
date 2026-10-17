import { mkdirSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import express from 'express';
import multer from 'multer';

import type { Response } from 'express';

import { isValidToken, login, logout, requireAuth } from './auth.js';
import { evaluateReading } from './decision.js';
import {
  addPhoto,
  addReading,
  getPatient,
  getPatients,
  getPhotos,
  getReadings,
  seedIfEmpty,
  upsertPatient,
} from './db.js';
import type { AttributeState, Patient, SensorReading } from './types.js';

seedIfEmpty();

const uploadsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
mkdirSync(uploadsDir, { recursive: true });

const EXT: Record<string, string> = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) =>
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${EXT[file.mimetype] ?? extname(file.originalname) ?? '.jpg'}`),
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadsDir));

/** Run the decision engine for a patient's latest reading. */
function evaluatePatient(patient: Patient, readings: SensorReading[]) {
  const latest = readings.length ? readings[readings.length - 1] : null;
  if (!latest) return { latest: null, evaluation: null };
  const previousReading = readings.length > 1 ? readings[readings.length - 2] : null;
  const baselineOhm = readings.find((r) => r.bioimpedanceOhm != null)?.bioimpedanceOhm ?? null;
  const evaluation = evaluateReading(latest, {
    baselineOhm,
    previousReading,
    photo: { edemaVisible: patient.edemaVisible, erythemaVisible: patient.erythemaVisible },
    pain: patient.pain0to10,
  });
  return { latest, evaluation };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'kneosense-backoffice', patients: getPatients().length });
});

// ---- Live updates (SSE): the doctor web gets pushed events on sync/photo. ----
const sseClients = new Set<Response>();

function broadcast(event: { type: 'sync' | 'photo'; patientId: string }) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const c of sseClients) c.write(data);
}

app.get('/api/events', (req, res) => {
  if (!isValidToken(String(req.query.token ?? ''))) return res.status(401).end();
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write(': connected\n\n');
  sseClients.add(res);
  const hb = setInterval(() => res.write(': hb\n\n'), 25000);
  req.on('close', () => {
    clearInterval(hb);
    sseClients.delete(res);
  });
});

/** Doctor login → bearer token. */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const token = login(String(email ?? ''), String(password ?? ''));
  if (!token) return res.status(401).json({ error: 'invalid_credentials' });
  res.json({ token });
});

app.post('/api/logout', requireAuth, (req, res) => {
  const header = req.header('authorization') ?? '';
  logout(header.startsWith('Bearer ') ? header.slice(7) : '');
  res.json({ ok: true });
});

/** Patient list with the latest overall level (triage view). Doctor-only. */
app.get('/api/patients', requireAuth, (_req, res) => {
  const list = getPatients().map((p) => {
    const { latest, evaluation } = evaluatePatient(p, getReadings(p.id));
    return {
      id: p.id,
      name: p.name,
      joint: p.joint,
      side: p.side,
      overallLevel: evaluation?.overallLevel ?? 'unavailable',
      lastReadingAt: latest?.timestamp ?? null,
    };
  });
  res.json(list);
});

/** Full patient detail: readings, latest evaluation (Celso), signals. Doctor-only. */
app.get('/api/patients/:id', requireAuth, (req, res) => {
  const patient = getPatient(req.params.id);
  if (!patient) return res.status(404).json({ error: 'patient_not_found' });
  const readings = getReadings(patient.id);
  const { latest, evaluation } = evaluatePatient(patient, readings);
  const photos = getPhotos(patient.id).map((p) => ({
    id: p.id,
    capturedAt: p.capturedAt,
    url: `/uploads/${p.filename}`,
    edema: p.edema,
    erythema: p.erythema,
    quality: p.quality,
  }));
  res.json({ patient, readings, latestReading: latest, evaluation, photos });
});

/** Upload one patient photo (multipart: field `file` + metadata). */
app.post('/api/patients/:id/photos', upload.single('file'), (req, res) => {
  if (!getPatient(req.params.id)) return res.status(404).json({ error: 'patient_not_found' });
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'missing_file' });
  const b = req.body ?? {};
  const id = typeof b.photoId === 'string' && b.photoId ? b.photoId : `ph-${Date.now()}`;
  addPhoto({
    id,
    patientId: req.params.id,
    capturedAt: typeof b.capturedAt === 'string' ? b.capturedAt : new Date().toISOString(),
    filename: file.filename,
    edema: typeof b.edema === 'string' ? b.edema : null,
    erythema: typeof b.erythema === 'string' ? b.erythema : null,
    quality: typeof b.quality === 'string' ? b.quality : null,
    note: typeof b.note === 'string' ? b.note : null,
  });
  broadcast({ type: 'photo', patientId: req.params.id });
  res.json({ ok: true, photo: { id, url: `/uploads/${file.filename}` } });
});

/** Sync from a patient's phone: upsert the patient + their readings. */
app.post('/api/sync', (req, res) => {
  const body = req.body ?? {};
  const p = body.patient;
  if (!p || typeof p.id !== 'string') {
    return res.status(400).json({ error: 'missing_patient' });
  }
  const attr = (v: unknown): AttributeState =>
    v === 'existent' || v === 'uncertain' || v === 'non_existent' ? v : 'uncertain';
  const patient: Patient = {
    id: p.id,
    name: typeof p.name === 'string' ? p.name : p.id,
    joint: typeof p.joint === 'string' ? p.joint : 'knee',
    side: typeof p.side === 'string' ? p.side : 'left',
    edemaVisible: attr(p.edemaVisible),
    erythemaVisible: attr(p.erythemaVisible),
    pain0to10: typeof p.pain0to10 === 'number' ? p.pain0to10 : null,
  };
  upsertPatient(patient);

  const readings: SensorReading[] = Array.isArray(body.readings) ? body.readings : [];
  let n = 0;
  for (const r of readings) {
    if (!r || typeof r.id !== 'string' || typeof r.timestamp !== 'string') continue;
    addReading({
      id: r.id,
      patientId: patient.id,
      timestamp: r.timestamp,
      tempReferenceC: r.tempReferenceC ?? null,
      tempAffectedC: r.tempAffectedC ?? null,
      bioimpedanceOhm: r.bioimpedanceOhm ?? null,
      activityIndex: r.activityIndex ?? null,
      batteryPct: typeof r.batteryPct === 'number' ? r.batteryPct : 0,
      quality: r.quality === 'invalid_contact' ? 'invalid_contact' : 'simulated',
    });
    n += 1;
  }
  broadcast({ type: 'sync', patientId: patient.id });
  res.json({ ok: true, patientId: patient.id, readings: n });
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`KneoSense backoffice API on http://localhost:${PORT}`);
});
