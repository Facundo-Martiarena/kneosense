# Feature: KneoSense — multimodal patch signals + decision engine

## Objective
Model the real patch's multimodal signals (reference + affected skin temperature,
bioimpedance, IMU activity, battery) as synthetic data, and add a TRANSPARENT,
rule-based decision engine that combines them into an illustrative, NON-diagnostic
recommendation using cited clinical thresholds.

## Why (research, real sources)
No turnkey validated multimodal model for post-op joint infection exists publicly,
and training on synthetic data would only learn the simulation. The defensible
MVP/thesis choice is a rule engine on published per-signal thresholds:
- Temp differential (affected − reference) ≥ 2.2 °C = inflammation alert
  (diabetic-foot: Wijlens 2017 IWJ; Featherston 2024). Not valid as a single
  reading; improves with next-day confirmation + individual baseline.
- Absolute skin temp > 38.0 °C associated with infection (wound-healing wearable
  review, PMC8070747). Continuous monitoring detects SSI fever ~3× vs spot checks.
- Bioimpedance = edema TREND signal (L-Dex ≥6/≥10 units vs baseline) with LOW
  sensitivity → supporting only, Ω has no standardized clinical cutoff.
- IMU activity = rehab-adherence indicator (no hard clinical cutoff; illustrative).

## Scope (authorized)
- Types: `SensorReading`, `DecisionResult`, `SignalFinding` in types/domain.ts.
- `features/assessment/decisionEngine.ts` — pure `evaluateReading()` with cited
  thresholds; exported constants. Permanently `isClinicalDecision: false`.
- `data/mocks/sensorReadings.ts` — deterministic synthetic readings per scenario.
- Surface signals + decision card on the Mediciones screen; keep mandatory
  synthetic/non-diagnostic markers.
- Tests: `tests/decisionEngine.test.ts` (test-first RED→GREEN).

## Out of scope
- Any trained ML model or real clinical data. Real BLE/hardware. A diagnosis.

## Tasks
- [x] D1 · Test-first: `tests/decisionEngine.test.ts` (RED confirmed: module
  missing → then GREEN 9/9). Covers thresholds, overall severity, unavailable
  handling, non-diagnostic flag, determinism.
- [x] D2 · Types (`SensorReading`, `DecisionResult`, `SignalFinding`) +
  `features/assessment/decisionEngine.ts` with cited threshold constants.
- [x] D3 · `data/mocks/sensorReadings.ts` — deterministic per-scenario readings
  (reuse timestamps + bioimpedance; invalid → nulls). Scenarios differ so the
  engine shows normal / watch / alert.
- [x] D4 · `features/assessment/PatchAssessment.tsx` — signals grid + evaluation
  card (findings colored by level + recommendation + non-diagnostic note),
  mounted on Mediciones under the hero.
- [x] D5 · Verify: `tsc` clean · `npm test` 25/25 · `expo export` exit 0.

### Round 2 — next-day confirmation + photo cross-check
- [x] D6 · Temperature confirmation: a lone Δ≥2.2 °C is now WATCH ("a confirmar");
  it escalates to ALERT only when the previous reading also had Δ≥2.2 °C
  (Wijlens 2017: single reading not valid). Absolute ≥38 °C stays standalone ALERT.
  `evaluateReading(reading, { baselineOhm, previousReading, photo })`.
- [x] D7 · Photo cross-check: new `photo` finding from the scenario's latest
  photoAnnotation (edema/erythema). Corroboration rule: elevated temp + visible
  photo signs → overall ALERT with a corroboration message. Differentiated the
  three scenarios' latest photoAnnotation in scenarios.json (tendencia=visible,
  sin_cambios=none, invalida=uncertain).
- [x] D8 · Wired into `PatchAssessment` (previous reading + latest photo) + added
  a "Foto edema/eritema" signal cell. Test-first RED→GREEN (11 engine tests).
- [x] D9 · Verify: `tsc` clean · `npm test` 27/27 · `expo export` exit 0.

## Checks
- `npx tsc --noEmit` · `npm test` · `npx expo export --platform ios`
