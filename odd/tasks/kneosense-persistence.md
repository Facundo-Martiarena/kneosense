# Feature: KneoSense — local persistence with expo-sqlite

## Objective
Persist user-generated data (photos + symptom entries) across app restarts using
expo-sqlite, so the demo journey survives relaunch. Plan section 2
("Persistencia: JSON local y expo-sqlite si hace falta") + 11.2 roadmap.

## Problem / Why
Today photos and symptoms live only in the in-memory Zustand store, so they are
lost on reload. The synthetic measurements/scenarios stay bundled read-only JSON
(no need to persist those).

## Scope (authorized)
- Add expo-sqlite.
- Ports (hexagonal): `IPhotoRepository`, `ISymptomRepository`.
- SQLite adapters implementing those ports (tables + CRUD).
- In-memory adapter as fallback (web / unavailable SQLite) and for tests.
- Adapter factory selecting implementation by platform with graceful fallback.
- Refactor Zustand store: async `hydrate()` at startup + persist on add.
- Hydrate on app mount in `_layout`.
- Tests for the in-memory adapter + store hydration with a fake repo.

## Out of scope
- Persisting synthetic measurements/scenarios (stay bundled JSON).
- Cloud/backend sync, accounts (post-MVP, plan 11.2).
- Web wasm SQLite wiring (web uses in-memory fallback).

## Decisions (automatic)
- Modern expo-sqlite async API (`openDatabaseAsync`, `execAsync`, `runAsync`, `getAllAsync`).
- One DB file `kneosense.db`, schema versioned via `PRAGMA user_version`.
- Store loads ALL photos/symptoms once; existing per-case selectors filter in memory.
- Native → SQLite; web / init failure → in-memory (persistence degraded but app works).

## Tasks
- [x] P1 · Installed expo-sqlite ~57.0.4; added `IPhotoRepository` / `ISymptomRepository` to src/types/repository.ts.
- [x] P2 · SQLite adapter: `src/data/db/sqlite.ts` (open + PRAGMA user_version migration) + `SqlitePhotoRepository` + `SqliteSymptomRepository` (JSON-serialized assessment).
- [x] P3 · `InMemoryRepositories` + `src/data/persistence.ts` factory (native→SQLite, web→in-memory).
- [x] P4 · Store refactor: `hydrate()`, async `addPhoto`/`addSymptom` persist-on-add, `__setRepositories` test seam; hydrate in `_layout` useEffect; photos/symptoms screens await persistence.
- [x] P5 · `tests/persistence.test.ts` (in-memory adapters + store hydration/persist). 16/16 tests pass, tsc clean.

## Route: direct inline (full context held; cohesive persistence layer).

## Acceptance
- Added photo/symptom is written to SQLite on native and reloaded after restart.
- App still runs on web (in-memory fallback, no crash).
- `tsc --noEmit` clean; `npm test` green; `expo export` bundles.

## Checks
- `npx tsc --noEmit`
- `npm test`
- `npx expo export --platform ios`

## Progress / evidence
(updated per task)
