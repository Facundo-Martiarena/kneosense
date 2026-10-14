# Feature: ArticuCare AI — MVP mobile app

## Objective
Bootstrap and implement the engineering core of the ArticuCare AI MVP described in
`ArticuCare_Plan_Desarrollo_iOS_Android.md`: a React Native + Expo + TypeScript app
(iOS/Android) that lets a demo patient review synthetic bioimpedance, photos,
symptoms and an illustrative 2.5D anatomy view — all clearly labelled as synthetic/DEMO.

## Problem / Why
The plan is a roadmap; the repo had only the plan + a synthetic-data JSON. The user asked
to execute the plan with automatic decisions. This builds the runnable MVP foundation
(plan sections 8, 11, 11.1) with the mandatory safety labelling.

## Scope (authorized)
- Scaffold Expo project (expo-router + TypeScript) under `articucare/`.
- TypeScript contracts: Case, ImpedanceMeasurement, PhotoRecord, VisualAssessment.
- Mock data layer: bundle synthetic JSON + `MockMeasurementRepository` implementing `IMeasurementRepository`.
- 7 screens (plan §8): Welcome/demo, Panel, Measurements, Photos, Anatomy 2.5D, Symptoms, History/summary.
- Reusable DEMO / synthetic safety labels enforced everywhere.
- Lightweight SVG line chart (no heavy/incompatible deps).
- Photo capture/compare via expo-image-picker.
- Symptom log (pain 0-10, swelling perception, stiffness, comment).
- Export summary of the demo case.
- Basic tests (jest-expo) for repo + safety-label presence.

## Out of scope (plan explicitly defers / not executable here)
- Real SurgWound AI training / model weights (stays mock — plan §5 says mock for MVP).
- BLE real sensor (`BleMeasurementRepository`) — plan RF-09 "Fuera MVP".
- Real Three.js/expo-gl 3D spike + physical-device testing.
- Backend, accounts, RGPD real-data handling.

## Decisions (automatic, per user instruction)
- State: Zustand (plan allows Context/Zustand).
- Routing: expo-router (plan mandates it).
- Charts: custom react-native-svg (avoids compatibility risk flagged in plan §2/§6).
- 2.5D anatomy: colored-region SVG placeholder with permanent "ilustrativa" label.
- Artifact language: English identifiers/code; Spanish UI copy (target users are Spanish-speaking patients).

## Tasks
- [x] T1 · Scaffold Expo app (expo-router + TS, SDK 57 under `articucare/`). Node 18 too old; used nvm Node 22.22.1.
- [x] T2 · TypeScript contracts in `src/types/` (DemoCase, ImpedanceMeasurement, PhotoRecord, VisualAssessment, SymptomEntry, IMeasurementRepository).
- [x] T3 · Bundled synthetic JSON into `src/data/mocks/scenarios.json` + loader + `MockMeasurementRepository` + Zustand store.
- [x] T4 · `SyntheticBadge` + `DemoBanner` (non-dismissible) + `Screen` wrapper that enforces them.
- [x] T5 · Stack nav (replaced NativeTabs) + Welcome/demo + Panel screens.
- [x] T6 · Measurements screen: custom react-native-svg `LineChart` with null-gaps, frequency, valid/invalid, source=mock.
- [x] T7 · Photos screen: expo-image-picker camera/gallery, side-by-side compare, non-comparable refusal, EXIF off.
- [x] T8 · Anatomy 2.5D SVG view + front/side angle selector + permanent "ilustrativa" legend.
- [x] T9 · Symptoms log screen (pain 0-10 / stiffness 0-10 / swelling perception / comment).
- [x] T10 · History/summary screen + timeline + export via RN Share (`buildSummary`).
- [x] T11 · `mockAssess` (deterministic, origin=mock, isClinicalDecision=false) + `areComparable`, wired into photos.
- [x] T12 · Jest (jest-expo) tests: 12 passing (repo/assessment/summary/loader). `tsc --noEmit` clean.

## Route: direct inline (greenfield, full context held by parent).

## Acceptance
- App boots on Expo (web/simulator) without type errors.
- Every data screen shows an un-hideable synthetic/DEMO marker.
- Invalid measurement renders "medición no disponible" and never fabricates values.
- Non-comparable photos refuse to emit a comparison.
- Anatomy view shows permanent "Representación ilustrativa" label.
- Tests green; `tsc --noEmit` clean.

## Checks
- `npx tsc --noEmit`
- `npm test`

## Progress / evidence
- Status: ALL 12 TASKS DONE for the in-session engineering core.
- `npx tsc --noEmit`: clean (exit 0).
- `npm test` (jest-expo): 12 passed / 12 total, 3 suites.
- `npx expo export --platform ios`: succeeded ("Exported: dist") — full module graph bundles, app boots without import/route errors.
- Toolchain: project requires Node >= 20; use nvm Node 22.22.1 (Node 18.17 breaks create-expo-app). Run app cmds with that node on PATH.
- Git: repo initialized at Matequife root; work committed on branch `feat/articucare-mvp`, commit 3c6503a. 79 app files tracked, node_modules ignored. Push/PR left to the user.
- NOT executed (out of session, per plan): SurgWound AI training, BLE sensor, real Three.js/expo-gl 3D spike, physical-device testing, backend/RGPD real-data handling.

## How to run
- `cd articucare && npm start` (with Node 22 on PATH), then press i / a / w for iOS / Android / web.
