# Feature: KneoSense — patient login (real, token-based)

## Objective
Give the patient app a real login/registration with tokens, so each patient has
their own identity (instead of a shared demo scenario) and the patient-facing
endpoints are secured to the logged-in patient.

## Why
Today the patient web opens on a preselected demo scenario → everyone is the same
patient, and GET /api/patients/:id/readings + /api/pair are open by id. A real
login fixes identity and secures those endpoints.

## Approach
- Backend: patient_users table (patient_id, email unique, password_hash, name) in
  Turso. scrypt password hashing (node:crypto). In-memory token→patientId sessions
  (reset on redeploy; users persist). Endpoints: register, login, logout, me.
  requirePatient middleware. Then secure /api/pair + GET /api/patients/:id/readings
  to the token's patientId.
- App: login/register gate in _layout; persist token+patientId+name in the store;
  send the token on pair + readings; use the authenticated patientId.

## Tasks
- [x] T1 · Backend auth infra: auth-patient.ts (scrypt hash/verify, in-memory
      token→patientId sessions, requirePatient) + db patient_users table +
      createPatientUser/getPatientUserByEmail. tsc 0.
- [x] T2 · Backend endpoints: POST /api/patient/register, /login, /logout, GET
      /api/patient/me (additive). Smoke OK (register/me/409/login/401). Deploy.
- [ ] T3 · Secure /api/pair + GET /api/patients/:id/readings to requirePatient &
      matching patientId. (Ship together with the app so nothing breaks.)
- [ ] T4 · App: login/register screen + gate (_layout), persist auth in store,
      syncClient register/login + token on pair/readings, use authed patientId.

## Notes
- Sessions are in-memory → a Render redeploy logs everyone out (re-login). Users
  persist in Turso. Acceptable for the demo.
- T1+T2 are additive and safe to deploy alone. T3 must deploy with T4.
