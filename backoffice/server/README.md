# KneoSense — Backoffice API (doctor)

Node + TypeScript (Express) API for the doctor backoffice. Real DB via
`node:sqlite` (no native deps). Seeds synthetic patients + readings on first run
and runs the rule-based decision engine (Celso tetrad) server-side.

> Synthetic academic MVP. Never a diagnosis.

## Requirements
- Node ≥ 20 (uses `node:sqlite`). Tested on Node 22.

## Run
```bash
cd backoffice/server
npm install
npm start          # http://localhost:3001  (dev: npm run dev)
npm run typecheck
```

## Endpoints (slice 1)
- `GET /api/health` → `{ ok, patients }`
- `GET /api/patients` → triage list `[{ id, name, joint, side, overallLevel, lastReadingAt }]`
- `GET /api/patients/:id` → `{ patient, readings[], latestReading, evaluation }`
  where `evaluation` is the Celso decision (`overallLevel`, `findings[]`,
  `recommendation`, `isClinicalDecision: false`).

## Next slices
- B2 web doctor portal (React/Vite) consuming this API.
- B3 mobile sync (phone POSTs readings/symptoms).
- B4 image upload (phone → server storage → web).
- B5 doctor auth.
