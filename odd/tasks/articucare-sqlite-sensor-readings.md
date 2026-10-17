# Feature: ArticuCare — patch readings in SQLite (not hardcoded) + CRUD

## Objective
Move the patch's multimodal sensor readings out of hardcoded/generated code into
the app's existing local SQLite DB (expo-sqlite), seeded on first run, and add
real functionality: "+ Nueva medición" inserts a reading; the decision engine
reads the latest reading from the DB.

## Why
User: "que los datos no sean hardcodeados, usar una base". H2 does NOT run in
React Native (JVM-only) → the correct in-app DB is SQLite, already wired
(src/data/db/sqlite.ts, repositories, in-memory web/test fallback). Scenarios
stay bundled read-only JSON by design (plan section 2); the time-series readings
are what benefit from a DB + CRUD.

## Scope (authorized)
- `ISensorReadingRepository` port; `SqliteSensorReadingRepository` +
  `InMemorySensorReadingRepository`; export from persistence.ts.
- sqlite.ts migration v2: `sensor_readings` table (nullable temps/bioz/activity).
- appStore: `sensorReadings` state, `readingsForCase`, `addSensorReading`, and
  idempotent SEED from the existing generator on first hydrate (only if empty).
- `sensorReadings.ts`: keep generator as the seed source; add
  `generateNextReading()` for the "+ Nueva medición" action.
- PatchAssessment + measurements read readings from the store (DB-backed), not
  the generator. Wire "+ Nueva medición" to insert + refresh.
- Tests: in-memory sensor repo + store seed/add (test-first where runnable).

## Out of scope
- Moving scenarios.json into the DB (stays read-only reference). A backend/H2.

## Tasks
- [x] S1 · `ISensorReadingRepository` + `SqliteSensorReadingRepository` +
  `InMemorySensorReadingRepository`; exported from persistence.ts + .web.ts.
- [x] S2 · sqlite.ts SCHEMA_VERSION 1→2, `sensor_readings` table + index.
- [x] S3 · appStore: `sensorReadings` state, `readingsForCase`,
  `addSensorReading`, idempotent `seedSensorReadings()` on hydrate (only if
  count 0). `hydrate` wrapped so sensor-persistence failure never blocks
  photos/symptoms. `__setRepositories` takes optional 3rd (sensor) repo.
- [x] S4 · `generateNextReading()` (drifts from previous, now-timestamp, −2%
  battery); "+ Nueva medición" inserts it + refreshes; PatchAssessment reads
  readings from the store (DB-backed), baseline/previous computed from store.
- [x] S5 · Tests: `tests/sensorReadings.test.ts` (repo add/count/list/upsert +
  store seed-on-hydrate + addSensorReading). `tsc` clean · `npm test` 30/30 ·
  `expo export` exit 0.

## Checks
- `npx tsc --noEmit` · `npm test` · `npx expo export --platform ios`
