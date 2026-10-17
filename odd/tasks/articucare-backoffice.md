# Feature: ArticuCare — doctor backoffice (backend + web)

## Objective
A doctor-facing web backoffice to view each patient's values and images, backed
by a real server + shared DB. The mobile app syncs its data to the server; the
web reads it live. Built in verifiable slices (Node + TypeScript stack).

## Architecture (chosen)
- Backend: Node + TypeScript (Express) + `node:sqlite` (real file DB, no native dep).
- Web: React/Vite doctor portal (later slice).
- Mobile: sync module POSTs local data + uploads images (later slice).
- Auth for the doctor (later slice).

## Honest constraints
- Phone data is local SQLite; the web can't read it without this backend + sync.
- Patient-captured photos are local `file://` → must be UPLOADED to the server to
  appear in the web (image slice).
- Not offline / not Expo Go: needs the server running (hosting later).
- Data stays synthetic for the MVP/thesis.

## Slices
- [x] B1 · Backend API (`backoffice/server/`): Express + node:sqlite, seeds 3
  synthetic patients (p-001 alert / p-002 normal / p-003 watch) + 6 readings
  each, decision engine (Celso) server-side. Endpoints GET /api/health,
  /api/patients (triage w/ overallLevel), /api/patients/:id (readings +
  evaluation). `npm run typecheck` clean; curl-verified on :3001.
- [x] B2 · Web backoffice (`backoffice/web/`, React + Vite + TS): patient triage
  list (name/joint/level badge) → detail with Celso evaluation (findings +
  recommendation + badge), temp/bioz sparklines, full readings table, and an
  Images placeholder (pending B4). Teal identity. `npm run build` clean
  (typecheck + vite build). Consumes the API at :3001 (CORS on).
- [x] B3 · Mobile sync: `POST /api/sync` on the server (upsert patient +
  readings, curl-verified: phone-demo → alert). App: `src/config.ts`
  (EXPO_PUBLIC_BACKOFFICE_URL), `src/features/sync/syncClient.ts`
  (buildSyncPayload pure + postSync), "Sincronizar con el médico" button on Home
  (pushes identity + readings + latest pain + photo signs). Test for the payload
  builder. Network caveat: on device the URL must be the server LAN IP.
- [x] B4 · Image upload (mobile → server → web). Server: multer disk storage in
  `uploads/`, `photos` table, POST /api/patients/:id/photos (multipart),
  `express.static('/uploads')`, photos included in GET detail. Curl-verified
  (upload PNG → served 200 image/png). App: `uploadPhoto()` (RN FormData) folded
  into the Home "Sincronizar" action (uploads each case photo after readings).
  Web: patient detail renders the photo gallery (`API_BASE + url`).
- [x] B5 · Doctor auth. Server `src/auth.ts`: single env-configurable doctor
  credential, in-memory bearer tokens; POST /api/login + /api/logout;
  `requireAuth` gates GET /api/patients and /api/patients/:id (sync/upload stay
  open = patient side). Curl-verified: no token 401, login→token, token 200,
  bad creds 401. Web: login screen + token in localStorage + Authorization
  header + logout + 401→login. `npm run build` clean.

- [x] B6 · Live communication (SSE): server `GET /api/events` (token-gated,
  EventSource) + `broadcast()` on sync/photo; web subscribes after login,
  re-fetches the list + open patient live, shows an "En vivo" indicator.
  Curl-verified: sync → `data: {type:"sync",patientId}` pushed; no token → 401.
- [x] B7 · Rebrand to **KneoSense** + logo (logo.png → app header image, app.json
  name/icon/splash, web header `<img>` + favicon, titles, server service name).
  Technical ids (slug, bundleId, DB names) kept.
- [x] B8 · Web **responsive** (viewport meta, media queries ≤640/≤380,
  scalable sparklines via viewBox, stacking cards/photos, scrollable table).

## Status: backoffice COMPLETE (B1–B8)
Run: `backoffice/server` (`npm start`, :3001) + `backoffice/web` (`npm run dev`,
:5173). Doctor login demo: medico@articucare.demo / articucare (override via
DOCTOR_EMAIL / DOCTOR_PASSWORD env). Not hosted / not offline. All synthetic.

## Checks
- server: `npm run typecheck`; start + curl endpoints return seeded data.
