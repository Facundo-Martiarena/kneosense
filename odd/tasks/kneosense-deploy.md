# Feature: KneoSense — end-to-end deploy (APK + webs + hosted backoffice)

## Objective
Publish the whole prototype end-to-end: patient Android APK (EAS), patient web
(Expo static export), doctor web (Vite static), all talking to the backoffice
API hosted publicly on Fly.io over HTTPS with a persistent volume.

## Why
User wants a shareable, working demo. Today the backoffice server is local-only
(`localhost:3001`), so sync and the doctor panel only work on the dev machine.

## Constraints / evidence
- Server uses `node:sqlite` → host needs Node ≥ 22.22 (works unflagged on
  22.22.1; verified locally, only an ExperimentalWarning).
- Server persists a SQLite file + disk uploads (multer) → needs a persistent
  volume or data/photos reset on every deploy.
- `PORT` already read from env (src/index.ts:198). CORS already open.
- `tsx` was a devDependency but `start` needs it → must be a runtime dep.
- Webs read the API URL from env: patient web `EXPO_PUBLIC_BACKOFFICE_URL`,
  doctor web `VITE_API_BASE` (backoffice/web/src/api.ts:56). HTTPS required to
  avoid mixed-content from the published (HTTPS) webs.
- EAS: no projectId pinned; `preview` profile already builds an APK.

## Scope
backoffice/server (deploy config + small env-path edits), DEPLOY.md runbook.
NOT in scope: running `fly deploy`/`eas build` (needs user accounts, remote).

## Tasks
- [x] T1 · Parameterize DB path + uploads dir via env (DB_PATH, UPLOADS_DIR) with
      current defaults, so a Fly volume at /data can hold them.
- [x] T2 · Move `tsx` to dependencies so production start works.
- [x] T3 · Add backoffice/server Dockerfile (node:22-slim) + .dockerignore.
- [x] T4 · Add backoffice/server/fly.toml (http service + [mounts] /data volume).
- [x] T5 · Write DEPLOY.md: Fly deploy + volume + secrets, then build/publish both
      webs with the Fly URL, then EAS APK with the Fly URL.

## Acceptance — met
- Server `tsc --noEmit` exit 0; app tests 36/36.
- Smoke test: server boots via tsx, GET /api/patients → 401, DB + uploads created
  at DB_PATH/UPLOADS_DIR (verified with /tmp paths).
- Artifacts consistent: fly.toml PORT/internal_port=8080, DB_PATH/UPLOADS_DIR→/data,
  DEPLOY.md uses the same env names.

## Status
Deploy artifacts + runbook ready. Running `fly deploy` / `eas build` is the
user's step (needs their Fly + Expo accounts; remote). NOT committed yet.

## Checks
- `cd backoffice/server && npx tsc --noEmit`
- `cd kneosense && npm test`
