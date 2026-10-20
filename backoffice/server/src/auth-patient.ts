import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

/**
 * Minimal real patient auth (demo-grade but genuine): scrypt-hashed passwords
 * (stored in Turso) + in-memory bearer tokens mapped to a patientId. Sessions
 * reset on server restart/redeploy (users persist); that's acceptable here.
 */

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  return `${salt.toString('hex')}:${scryptSync(pw, salt, 64).toString('hex')}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(pw, Buffer.from(saltHex, 'hex'), 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const sessions = new Map<string, string>(); // token -> patientId

export function issuePatientToken(patientId: string): string {
  const token = randomUUID();
  sessions.set(token, patientId);
  return token;
}

export function patientIdForToken(token: string): string | null {
  return token ? (sessions.get(token) ?? null) : null;
}

export function revokePatientToken(token: string): void {
  sessions.delete(token);
}

export type PatientRequest = Request & { patientId?: string };

export function requirePatient(req: PatientRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const patientId = patientIdForToken(token);
  if (!patientId) return res.status(401).json({ error: 'unauthorized' });
  req.patientId = patientId;
  next();
}
