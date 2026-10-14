# Feature: ArticuCare — EAS Update (OTA) config

## Objective
Enable over-the-air JS/asset updates so demo builds can receive fixes without a
rebuild. Pairs with the `preview` demo profile.

## Scope (done)
- [x] Installed `expo-updates` (~57.0.26).
- [x] app.json `runtimeVersion` = `{ "policy": "appVersion" }`.
- [x] eas.json: bound each build profile to a channel
      (development→development, preview/preview-device→preview, production→production).
- [x] Documented the OTA workflow + the one authenticated setup step in BUILD.md.

## Verification
- eas.json valid JSON; `expo config` shows runtimeVersion policy appVersion.
- `tsc --noEmit` clean; `npm test` 16/16; `expo export --platform ios` bundles.

## User's next step (authenticated, outward-facing — their call)
```
cd articucare && eas login
eas update:configure                       # writes updates.url + extra.eas.projectId (once)
eas update --branch preview --message "…"  # publish OTA to the preview channel
```

## Not done (requires user credentials / project linking)
- `eas update:configure` / `eas update` (needs the user's Expo account; writes
  the project id + update URL into app.json).
- Channel/branch edits on EAS.
