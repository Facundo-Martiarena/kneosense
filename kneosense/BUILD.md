# KneoSense — Development build (EAS)

A development build is required to run the native modules this project uses
(`expo-gl` for the experimental 3D view, `expo-sqlite`, `expo-image-picker`).
Expo Go is NOT enough for the 3D view.

> Local native builds are not possible on this machine (no full Xcode, no
> CocoaPods, no Android SDK). Use EAS cloud builds below. EAS uploads the project
> to Expo's build servers and requires YOUR Expo account.

## Prerequisites (run in your terminal; use Node >= 20)

```bash
# This repo's app lives in ./kneosense
cd kneosense

# EAS CLI + login (uses YOUR Expo account)
npm install -g eas-cli      # or prefix commands with: npx eas-cli@latest
eas login
```

`eas.json` and the bundle identifiers (`com.kneosense.app`) are already
configured, so no `eas build:configure` is needed.

## Build

### Android (no Apple account needed) — installable APK
```bash
eas build --platform android --profile development
```

### iOS Simulator (no paid Apple account needed)
```bash
eas build --platform ios --profile development
```
The `development` profile sets `ios.simulator: true`, so the output runs on the
iOS Simulator without Apple Developer credentials.

### iOS physical device (requires Apple Developer credentials)
```bash
eas build --platform ios --profile development-device
```
EAS will prompt to handle signing credentials during this build.

## Install and run

```bash
# Download + install the finished build onto a running emulator/simulator/device:
eas build:run --platform android     # or: --platform ios

# Then start the dev server and connect the development build:
npx expo start --dev-client
```

## Demo build (preview) — shareable, no dev client

The `preview` profile produces a release-like build (no Metro/dev server needed)
for showing the demo. Android is a directly-installable APK; iOS targets the
Simulator so no paid Apple account is required.

```bash
# Android APK (no Apple account) — share the file and install it directly:
eas build --platform android --profile preview

# iOS Simulator demo (no Apple account):
eas build --platform ios --profile preview
```

To demo on physical iPhones (ad hoc, requires Apple Developer credentials and
registered device UDIDs), use `preview-device`:

```bash
eas build --platform ios --profile preview-device
```

Download links appear in the EAS build output; `eas build:run -p <platform>`
installs the finished artifact onto a running emulator/simulator.

## OTA updates (EAS Update)

Push JS/asset fixes to existing demo builds without rebuilding. `expo-updates` is
installed, `runtimeVersion` uses the `appVersion` policy, and each build profile
is bound to a channel (`development` / `preview` / `production`).

One authenticated setup step remains (writes `updates.url` + `extra.eas.projectId`
into app.json using YOUR Expo account):

```bash
cd kneosense
eas login
eas update:configure     # links the project and fills updates.url (run once)
```

Then publish updates to the channel your demo build uses:

```bash
# The 'preview' builds subscribe to the 'preview' channel.
eas update --branch preview --message "demo fix"
```

Notes:
- An update only applies to builds whose `runtimeVersion` matches. Changing native
  code / native deps bumps the app version → rebuild before updating.
- Branch→channel mapping: point a branch at a channel with
  `eas channel:edit preview --branch preview` if they diverge.
- OTA covers JS + assets only, never native modules (expo-gl, expo-sqlite, etc.).

## Profiles (see eas.json)
- `development`         → dev client, internal distribution; iOS targets the Simulator.
- `development-device`  → dev client for a physical iOS device (needs Apple creds).
- `preview`            → release-like demo, no dev client; Android APK + iOS Simulator (no Apple account).
- `preview-device`     → release-like demo; Android APK + iOS ad hoc for real devices (needs Apple creds).
- `production`         → store build (auto version increment).
