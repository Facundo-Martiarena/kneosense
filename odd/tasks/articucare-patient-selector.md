# Feature: ArticuCare — patient selector + create patient

## Objective
Replace the demo scenario-picker Alert with a real patient selector that lets
the user pick a demo scenario OR a user-created patient, and create a new patient
(name + joint) in-app. Enables the demo: create patient → load data → sync → the
doctor sees it.

## Done
- Types: `AppPatient` (domain.ts); `IPatientRepository` (repository.ts).
- SQLite v3 migration `app_patients` table; `SqlitePatientRepository` +
  `InMemoryPatientRepository`; exported from persistence(.web).ts.
- Store: `patients` state, `createPatient(name, joint)` (persists + selects),
  hydrate loads patients in its own resilient try; `__setRepositories` 4th arg.
- `useCurrentCase` resolves a demo scenario OR a created patient (adapted to the
  DemoCase shape with empty synthetic series), memoized (no re-render loop).
- `features/patients/PatientPicker.tsx` modal: list (created + demo) + create
  form (name + joint chips); Home profile button opens it.
- Coherence fix: Mediciones chart/list + Home trend/count now read the DB sensor
  readings (useReadingsForCase), so created patients + "+ Nueva medición" update
  live and demo scenarios show their seeded readings. Empty state on Mediciones.
- Tests: `tests/patients.test.ts` (repo + store.createPatient). 
- Repo-root `README.md` with run steps + a 3-min demo script.

## Checks
- `tsc` clean · `npm test` 36/36 · `expo export` exit 0.
