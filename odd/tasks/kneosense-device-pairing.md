# Feature: KneoSense — device↔patient pairing + reading validation

## Objective
Tie a physical device (ESP32) to ONE patient via a pairing code, so its readings
belong to that patient (not "all"), surfaced in the doctor web and the patient app.
Also reject physically impossible sensor values so junk doesn't trigger false alerts.

## Why
The device posts real readings (quality=measured) but: (1) they land on a
provisional patient id with no formal link to a patient record or the patient app;
(2) a miswired temp sensor sent ~100 °C and the engine raised a FALSE "alert".

## Model (chosen: pairing)
- `devices` table: device_id → patient_id (null until paired), pairing_code, paired_at, last_seen.
- Device posts to `POST /api/devices/:deviceId/readings`. First contact auto-registers
  the device with a 6-char pairing_code; the POST response returns that code so the
  firmware can print it on serial. Unpaired readings land on a provisional patient
  (id = deviceId); on pairing they migrate to the real patient.
- Patient enters the code in the app → `POST /api/pair {code, patientId}` links the
  device and migrates past readings.
- Validation: temps outside 20–45 °C, bioz outside 1–100000 Ω, activity outside 0–1
  are nulled; battery clamped 0–100.

## Tasks
- [x] T1 · Backend: `devices` table + Device type; db fns (registerDeviceIfNew,
      getDevice, getDeviceByCode, pairDevice w/ reading migration, listDevices, touch).
- [x] T2 · Backend: `POST /api/devices/:deviceId/readings` (register + sanitize +
      provisional patient + return pairingCode), `POST /api/pair`, `GET /api/devices`
      (doctor). sanitize applied to the legacy `/api/patients/:id/readings` too.
- [x] T3 · Updated ARDUINO_PROMPT.md: posts to /api/devices/:id/readings; prints the
      returned pairingCode on serial.
- [x] T4 · Deployed backend (commit c33df66 → Render auto-deploy, live in ~40s).
      Verified live: pairingCode returned, temp=100 nulled. Local smoke covered
      register→pair→migrate→404 provisional.
- [x] T5 · Patient app: `app/pair.tsx` ("Vincular parche": enter 6-char code →
      pairDevice → POST /api/pair; then fetchBackendReadings → GET
      /api/patients/:id/readings and show them). Route registered in _layout
      (href:null); entry button on measurements. New backend GET
      /api/patients/:id/readings (unauth, patient reads own id). tsc 0, tests 36/36.
- [ ] T6 · Doctor web: show device/pairing status + list of unpaired devices. (NEXT)

## Acceptance
- Server tsc clean; local smoke of register→pair→migrate→sanitize.
- Live on Render: a POST with temp=100 is stored as null temp (no false alert);
  pairing moves readings to the chosen patient.

## Checks
- `cd backoffice/server && npx tsc --noEmit`
