# Feature: ArticuCare — UI redesign to the mobile mockup

## Objective
Match the provided HTML mockup (`articucare_mobile_preview.html`): teal identity,
bottom-tab navigation, a Home dashboard, and the mockup's cards/hero/tiles/
actions/rowitems/info boxes — wired to the real scenario data, preserving the
mandatory synthetic-data markers.

## Palette (from mockup)
ink `#14283C` · muted `#728397` · teal primary `#087F85` · blue accent `#3267DE`
· bg `#F6F9FB` · line `#E7EDF2` · hero gradient `#083B51→#076C74` · info `#EAF5F3`.

## Decisions (authorized)
- Entry flow: open directly on the Home tab; auto-select a default demo scenario;
  scenario switch lives in the profile button (user choice).
- Icons via react-native-svg (replicate mockup SVGs), no vector-icons dep.
- Gradients via expo-linear-gradient (installed).
- Mandatory "datos sintéticos / académico" markers kept, restyled into the new
  look (pill + notes + info boxes). Non-negotiable per plan 10.1/10.3.
- Keep the real domain/data + scenario model.

## Tasks
- [x] R1 · Theme → teal palette + hero/info tokens in `constants/theme.ts`.
- [x] R2 · `components/icons.tsx` (SVG icon set) + `BrandMark` (in `ui.tsx`).
- [x] R3 · Reusable UI in `components/ui.tsx`: `Hero`, `MetricTile`,
  `ActionButton`, `SectionTitle`, `RowItem`, `InfoBox`, `PrimaryButton`,
  `BrandMark`. Restyled `Screen` (page-heading + markers) and `DemoBanner`
  (teal info box). SyntheticBadge kept as the synthetic marker.
- [x] R4 · Bottom-tab nav in `app/_layout.tsx` (Inicio/Mediciones/Fotos/Síntomas/
  Historial); panel + anatomy as `href:null` hidden routes. Scenario is
  preselected by the store default, so the app opens on Home.
- [x] R5 · Home dashboard `app/index.tsx` (brand header + profile scenario
  switch, hero w/ synthetic pill, 2 metric tiles, trend chart, 3 quick actions,
  academic note). Wired to real scenario data.
- [x] R6 · Adopted mockup knee SVG in `AnatomyView`; anatomy reachable via a
  secondary button on Fotos. Rebuilt the 3 tab screens to the mockup:
  - measurements: action Hero + "Evolución" chart card (⤢ Ampliar → landscape) +
    "Mediciones recientes" grouped RowItem list + "+ Nueva medición" (Alert) +
    InfoBox.
  - symptoms: discomfort Slider (@react-native-community/slider) + Observaciones
    TextInput + "Guardar registro" + InfoBox (swelling/stiffness dropped per the
    simpler mockup form; saved as defaults).
  - history: single Card with chronological RowItems + "Exportar registros".
- [x] R7 · Verify: `tsc` clean · `npm test` 16/16 · `expo export` exit 0.

## Checks
- `npx tsc --noEmit` · `npm test` · `npx expo export --platform ios`
- Device (user, Expo Go): tabs, Home, teal look, markers present.

## Route
Inline single-writer (full design context held). Verify with tsc + bundle;
device sign-off by user.
