# ArticuCare — Development build (EAS)

A development build is required to run the native modules this project uses
(`expo-gl` for the experimental 3D view, `expo-sqlite`, `expo-image-picker`).
Expo Go is NOT enough for the 3D view.

> Local native builds are not possible on this machine (no full Xcode, no
> CocoaPods, no Android SDK). Use EAS cloud builds below. EAS uploads the project
> to Expo's build servers and requires YOUR Expo account.

## Prerequisites (run in your terminal; use Node >= 20)

```bash
# This repo's app lives in ./articucare
cd articucare

# EAS CLI + login (uses YOUR Expo account)
npm install -g eas-cli      # or prefix commands with: npx eas-cli@latest
eas login
```

`eas.json` and the bundle identifiers (`com.articucare.app`) are already
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

## Profiles (see eas.json)
- `development`         → dev client, internal distribution; iOS targets the Simulator.
- `development-device`  → dev client for a physical iOS device (needs Apple creds).
- `preview`            → internal distribution, release-like, no dev client.
- `production`         → store build (auto version increment).
