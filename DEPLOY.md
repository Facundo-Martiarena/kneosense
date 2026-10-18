# KneoSense — Deploy runbook (end-to-end)

Four pieces: **backoffice API** (Fly.io), **patient web**, **doctor web**, and
the **patient APK**. Do the API first — the webs and the APK need its public URL.

Prerequisites: a Fly.io account and an Expo account. No Docker on your machine:
Fly builds the image remotely.

---

## 1. Backoffice API → Fly.io

Config already in `backoffice/server/`: `Dockerfile`, `.dockerignore`, `fly.toml`
(persistent volume at `/data`, HTTPS forced, listens on 8080). The server reads
`PORT`, `DB_PATH`, `UPLOADS_DIR` from env (set in `fly.toml`).

```bash
cd backoffice/server

# Install the Fly CLI once (macOS): brew install flyctl
fly auth login

# First deploy. Accept the app name/region from fly.toml (or let it pick).
# Do NOT let it overwrite fly.toml if asked; we already have one.
fly launch --no-deploy --copy-config --name kneosense-backoffice --region eze

# Create the persistent volume (once) — must match fly.toml source + region:
fly volumes create kneosense_data --size 1 --region eze

# Doctor login credentials as secrets (override the demo defaults):
fly secrets set DOCTOR_EMAIL="medico@kneosense.demo" DOCTOR_PASSWORD="CAMBIALA"

fly deploy
```

Your API is now at `https://kneosense-backoffice.fly.dev` (shown by `fly deploy`).
Quick check: `curl https://kneosense-backoffice.fly.dev/api/patients` → `401`
(auth required) means it is up.

> Use that HTTPS URL as `API_URL` below. It MUST be https (the webs are served
> over https, so an http API would be blocked as mixed content).

---

Both webs are served as static Fly apps via `nginx:alpine`. The deploy configs
live in `deploy/web-patient/` and `deploy/web-doctor/` (Dockerfile + nginx.conf +
fly.toml). The built `dist/` is copied into each deploy dir (gitignored —
regenerate before deploying).

## 2. Patient web (Expo static export → Fly)

```bash
# Build with the live API URL baked in:
cd kneosense
EXPO_PUBLIC_BACKOFFICE_URL=https://kneosense-backoffice.fly.dev \
  npx expo export --platform web            # → kneosense/dist

# Copy the build into the deploy dir and ship it:
cp -R dist ../deploy/web-patient/dist
cd ../deploy/web-patient
fly deploy --remote-only                    # live at https://kneosense-web.fly.dev
```

## 3. Doctor web (Vite → Fly)

```bash
cd backoffice/web
VITE_API_BASE=https://kneosense-backoffice.fly.dev npm run build   # → backoffice/web/dist
cp -R dist ../../deploy/web-doctor/dist
cd ../../deploy/web-doctor
fly deploy --remote-only                    # live at https://kneosense-doctor.fly.dev
```

Log in with the `DOCTOR_EMAIL` / `DOCTOR_PASSWORD` (defaults: `medico@kneosense.demo`
/ `kneosense`, override via Fly secrets).

---

## 4. Patient APK (EAS)

The `preview` profile in `kneosense/eas.json` already builds an APK.

```bash
cd kneosense
npx eas-cli login
# Bake the public API URL into the build so sync works off your machine:
EXPO_PUBLIC_BACKOFFICE_URL=https://kneosense-backoffice.fly.dev \
  npx eas-cli build -p android --profile preview
```

First run creates the EAS project (say yes) and the Android keystore. When it
finishes, EAS gives a download link for the `.apk`. Share/install it directly.

---

## Order & notes
1. Deploy the API first; copy its `https://…fly.dev` URL.
2. Build the two webs and the APK with that URL baked in (env vars above).
3. Changing the API URL later = rebuild the webs and the APK (the URL is baked
   at build time, not read at runtime).
4. Persistence: DB + photos live on the Fly volume `kneosense_data`. Deleting the
   volume wipes synced data (the patient app re-seeds its own local scenarios).
5. Cost: `min_machines_running = 1` keeps the doctor panel's live stream (SSE)
   connected. Set it to `0` in `fly.toml` to scale to zero and save cost, at the
   price of cold starts and dropped live updates.
