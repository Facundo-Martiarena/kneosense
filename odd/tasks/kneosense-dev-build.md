# Feature: KneoSense — development build prep (EAS)

## Objective
Prepare the project so the user can produce an installable development build
(needed for expo-gl 3D, expo-sqlite, image-picker) with a single authenticated
command. The build itself runs on EAS (user's account); not triggered here.

## Why not built here
Local native builds are impossible on this machine (evidence):
- `xcodebuild` → only Command Line Tools, no full Xcode; no CocoaPods.
- No Android SDK: `ANDROID_HOME` empty, no `adb`.
EAS cloud build is the only path; it uploads the project and needs the user's
Expo account (and Apple credentials for an iOS device build) — outward-facing,
so not run on their behalf.

## Scope (done)
- [x] Installed `expo-dev-client` (~57.0.20).
- [x] Added `ios.bundleIdentifier` + `android.package` = `com.kneosense.app` to app.json.
- [x] Created `eas.json` with `development` (iOS simulator, no Apple account),
      `development-device` (physical iOS), `preview`, `production` profiles.
- [x] Wrote `kneosense/BUILD.md` with exact login/build/install commands.
- [x] Demo `preview` profile: release-like, no dev client; Android APK + iOS Simulator
      (no Apple account). Added `preview-device` (iOS ad hoc for real devices, needs Apple creds).
      Documented demo build commands in BUILD.md.

## Verification
- `eas.json` valid JSON; `expo config` resolves bundleIdentifier + package.
- `tsc --noEmit` clean; `npm test` 16/16.

## User's next step (authenticated, outward-facing — their call)
```
cd kneosense && eas login
eas build -p android --profile development   # APK, no Apple account
eas build -p ios     --profile development   # iOS Simulator, no Apple account
```
Then `eas build:run -p <platform>` and `npx expo start --dev-client`.

## Not done (requires user credentials / remote upload)
- Running `eas login` / `eas build` (user's Expo account + project upload).
- iOS device signing (Apple Developer credentials).
