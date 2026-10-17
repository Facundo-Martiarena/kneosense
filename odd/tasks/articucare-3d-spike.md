# Spike: ArticuCare — interactive 3D (expo-gl + Three.js)

## Objective
Compatibility spike (plan section 6, "Intermedio: 3D interactivo"; task 11.1 #7):
prove expo-gl + Three.js can render an interactive (rotatable) generic joint
inside the app, as a gated EXPERIMENTAL mode, before committing it as a
production dependency. Real device perf/compat testing stays a human step.

## Problem / Why
The MVP ships illustrative 2.5D SVG. The plan requires a compatibility spike
before adopting real 3D. This validates the toolchain and UX wiring; it does NOT
make 3D the default and does NOT reconstruct anatomy from photos.

## Scope (authorized)
- Add expo-gl + three (+ expo-three bridge if compatible).
- `Interactive3DJoint` component: GLView rendering a stylized generic joint
  (primitives), auto-rotation + touch drag, illustrative overlay color driven by
  the scenario demo value.
- Gate it behind an EXPERIMENTAL toggle in the anatomy screen; 2.5D stays default.
- Permanent "ilustrativa / experimental / no reconstruida" labelling preserved.
- Verify it typechecks and bundles (expo export). Record spike findings.

## Out of scope
- Making 3D the default or removing the 2.5D view.
- GLB model loading, textures, real anatomy, photo-derived geometry.
- On-device performance/compat sign-off (human step per plan section 6).

## Decisions (automatic)
- Stylized primitives (cylinders + sphere), not a GLB asset, for a pure-code spike.
- expo-three `Renderer` if it resolves cleanly against three + RN 0.86; else fall
  back to a raw expo-gl + three WebGLRenderer glue and record that as a finding.
- Web: GLView uses WebGL; keep guarded. Spike verification = typecheck + bundle.

## Tasks
- [x] S1 · Installed expo-gl ~57.0.2 + three ^0.186.1 + @types/three ^0.186.0. Chose direct expo-gl+three glue (NO expo-three) to avoid an unmaintained bridge.
- [x] S2 · `src/features/visuals/Interactive3DJoint.tsx`: GLView + three WebGLRenderer (canvas shim), auto-rotate + PanResponder drag, amber emissive overlay scaled by demo highlight.
- [x] S3 · `src/app/anatomy.tsx`: 2.5D / "3D interactivo (experimental)" toggle; 2.5D default; experimental + illustrative labels preserved.
- [x] S4 · tsc clean; 16/16 tests still pass; bundle check in progress (see Findings).

## Acceptance
- `tsc --noEmit` clean; `npx expo export --platform ios` bundles with the 3D path.
- 2.5D remains the default; 3D is opt-in and labelled experimental/illustrative.
- Findings (what resolved, what the human must verify on device) recorded below.

## Checks
- `npx tsc --noEmit`
- `npm test`
- `npx expo export --platform ios`

## Findings
- Toolchain resolves cleanly: expo-gl ~57.0.2 + three, direct glue (no expo-three). `tsc --noEmit` clean, 16/16 tests, `expo export --platform ios` bundles the 3D path (exit 0).
- DEVICE FINDING (physical iPhone via Expo Go dev server): three r163+ throws at runtime `THREE.WebGLRenderer: WebGL 1 is not supported since r163`. three r163+ requires WebGL2 but cannot detect expo-gl's context as WebGL2 (React Native has no global `WebGL2RenderingContext`). Fix: pin `three` to `0.162.0` (last release supporting the expo-gl WebGL1 context) + `@types/three@0.162.0`. With that, the 3D view renders on device. Alternatives for later: polyfill `global.WebGL2RenderingContext`, or adopt expo-three.
- Direct glue works: `THREE.WebGLRenderer({ canvas: <shim>, context: gl })` + `gl.endFrameEXP()` per frame; PanResponder drives rotation. No need for the unmaintained expo-three.
- STILL NEEDS HUMAN ON-DEVICE SIGN-OFF (the real point of the spike, plan section 6):
  1. expo-gl `GLView` needs a **development build** (native module) — it does NOT run in Expo Go, and web uses a WebGL path not exercised here.
  2. Verify render + drag rotation and frame rate on real iOS and Android, including New Architecture (RN 0.86 defaults to it).
  3. three adds notable bundle size; adopt as a production dependency only if device perf is acceptable.
- Decision gate: keep 3D as the gated EXPERIMENTAL mode; 2.5D SVG stays the default/production path until device sign-off.

## Verification
- `npx tsc --noEmit`: clean.
- `npm test`: 16/16.
- `npx expo export --platform ios`: Exported (3D graph bundles).
