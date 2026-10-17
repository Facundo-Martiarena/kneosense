import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

/**
 * Minimal doctor auth for the backoffice (demo). A single doctor credential
 * (env-configurable); login issues an in-memory bearer token. Good enough to
 * gate the read endpoints for the MVP — NOT production-grade auth.
 */

const DOCTOR_EMAIL = process.env.DOCTOR_EMAIL ?? 'medico@kneosense.demo';
const DOCTOR_PASSWORD = process.env.DOCTOR_PASSWORD ?? 'kneosense';

const tokens = new Set<string>();

export function login(email: string, password: string): string | null {
  if (email === DOCTOR_EMAIL && password === DOCTOR_PASSWORD) {
    const token = randomUUID();
    tokens.add(token);
    return token;
  }
  return null;
}

export function logout(token: string): void {
  tokens.delete(token);
}

/** Validates a raw token (e.g. from an EventSource query param). */
export function isValidToken(token: string): boolean {
  return !!token && tokens.has(token);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token && tokens.has(token)) return next();
  res.status(401).json({ error: 'unauthorized' });
}
