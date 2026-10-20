# Feature: KneoSense — persist backend data in Turso (libSQL)

## Objective
Stop losing data on Render free restarts/redeploys by moving the backoffice DB
from node:sqlite (local file, ephemeral) to Turso (libSQL, cloud, free, no card).

## Why
Render free has no persistent disk → the SQLite file resets, so paired-device
data and readings vanish on restart. Turso gives durable storage for free.

## Approach
- Replace node:sqlite (sync) with @libsql/client (async). URL from
  TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN); falls back to a local libSQL file
  (`file:...`) for dev — same async code path everywhere.
- All db.ts functions became async; all index.ts handlers became async and
  await DB calls, wrapped in an `ah()` async-error guard (Express 4 doesn't
  forward async rejections). `await seedIfEmpty()` and schema via top-level await.
- render.yaml: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN as `sync:false` (dashboard
  secrets, never committed — repo is public).

## Tasks
- [x] T1 · db.ts → @libsql/client async (schema via executeMultiple; toRow helpers).
- [x] T2 · index.ts → async handlers + ah() wrapper + awaits; top-level await seed.
- [x] T3 · render.yaml TURSO_* env (sync:false); @libsql/client dependency.
- [ ] T4 · USER: create Turso DB (free, no card), set the two env vars in Render,
      redeploy. Then verify persistence across a manual redeploy.

## Acceptance
- Server tsc clean; local smoke on a libSQL file (seed, device ingest, pair,
  patient-facing read) — DONE. Once Turso env set: data survives a redeploy.

## User steps (T4)
1. turso.tech → sign up with GitHub (no card).
2. Create DB + token (dashboard, or CLI `turso db create kneosense` then
   `turso db show --url kneosense` and `turso db tokens create kneosense`).
3. In Render → kneosense-backoffice → Environment: set TURSO_DATABASE_URL
   (libsql://…) and TURSO_AUTH_TOKEN → Save → redeploy.
