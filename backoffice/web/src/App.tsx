import { useEffect, useRef, useState, type FormEvent } from 'react';

import {
  API_BASE,
  fetchDevices,
  fetchPatient,
  fetchPatients,
  getAuthToken,
  login,
  logout,
  UnauthorizedError,
  type Device,
  type PatientDetail,
  type PatientListItem,
  type Reading,
  type SignalLevel,
} from './api';

const LEVEL_LABEL: Record<SignalLevel, string> = {
  alert: 'Alerta',
  watch: 'Vigilar',
  normal: 'Normal',
  unavailable: 'Sin datos',
};

function LevelBadge({ level }: { level: SignalLevel }) {
  return <span className={`badge badge-${level}`}>{LEVEL_LABEL[level]}</span>;
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Tiny inline sparkline over a numeric series (nulls are skipped). */
function Sparkline({ values, color = '#087F85' }: { values: (number | null)[]; color?: string }) {
  const w = 220;
  const h = 44;
  const pad = 4;
  const valid = values.filter((v): v is number => v != null);
  if (valid.length < 2) return <div className="sparkline-empty">—</div>;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const span = max - min || 1;
  const n = values.length;
  const pts: string[] = [];
  values.forEach((v, i) => {
    if (v == null) return;
    const x = pad + ((w - 2 * pad) * i) / (n - 1);
    const y = pad + (h - 2 * pad) * (1 - (v - min) / span);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      preserveAspectRatio="none"
      className="sparkline">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function delta(r: Reading): number | null {
  return r.tempReferenceC != null && r.tempAffectedC != null ? r.tempAffectedC - r.tempReferenceC : null;
}

export function App() {
  const [authed, setAuthed] = useState<boolean>(!!getAuthToken());
  const [patients, setPatients] = useState<PatientListItem[] | null>(null);
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [live, setLive] = useState(false);
  const [uiTheme, setUiTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('kneosense_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', uiTheme);
    localStorage.setItem('kneosense_theme', uiTheme);
  }, [uiTheme]);

  function onError(e: unknown) {
    if (e instanceof UnauthorizedError) {
      setAuthed(false);
      return;
    }
    setError(String(e));
  }

  useEffect(() => {
    if (!authed) return;
    setError(null);
    fetchPatients().then(setPatients).catch(onError);
    fetchDevices().then(setDevices).catch(onError);
  }, [authed]);

  useEffect(() => {
    if (!selectedId) return;
    setDetail(null);
    fetchPatient(selectedId).then(setDetail).catch(onError);
  }, [selectedId]);

  // Live updates: re-fetch the list (and the open patient) when the phone syncs.
  useEffect(() => {
    if (!authed) return;
    const es = new EventSource(`${API_BASE}/api/events?token=${getAuthToken() ?? ''}`);
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.onmessage = () => {
      fetchPatients().then(setPatients).catch(onError);
      fetchDevices().then(setDevices).catch(onError);
      const open = selectedIdRef.current;
      if (open) fetchPatient(open).then(setDetail).catch(onError);
    };
    return () => {
      es.close();
      setLive(false);
    };
  }, [authed]);

  function doLogout() {
    logout();
    setPatients(null);
    setDevices(null);
    setSelectedId(null);
    setDetail(null);
    setAuthed(false);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/logo.png" className="brand-logo" alt="KneoSense" />
          <span className="brand-muted">Panel médico</span>
        </div>
        <div className="topbar-right">
          <button
            className="theme-toggle"
            onClick={() => setUiTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            title="Cambiar tema"
            aria-label="Cambiar tema claro/oscuro">
            {uiTheme === 'dark' ? '☀' : '☾'}
          </button>
          {authed ? (
            <span className={`live ${live ? 'on' : ''}`}>
              <span className="live-dot" />
              {live ? 'En vivo' : 'Conectando…'}
            </span>
          ) : null}
          <span className="demo-pill">Prototipo · Datos sintéticos</span>
          {authed ? (
            <button className="logout" onClick={doLogout}>
              Cerrar sesión
            </button>
          ) : null}
        </div>
      </header>

      <main className="container">
        {!authed ? (
          <LoginView onSuccess={() => setAuthed(true)} />
        ) : (
          <>
            {error ? (
              <div className="error">
                No se pudo conectar con la API ({error}). ¿Está corriendo{' '}
                <code>backoffice/server</code> en :3001?
              </div>
            ) : null}
            {!selectedId ? (
              <>
                <PatientList patients={patients} onSelect={setSelectedId} />
                <DevicesPanel devices={devices} patients={patients} />
              </>
            ) : (
              <PatientDetailView detail={detail} onBack={() => setSelectedId(null)} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function LoginView({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('medico@kneosense.demo');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(email, password);
      onSuccess();
    } catch (e2) {
      setErr(String((e2 as Error).message ?? e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card login" onSubmit={submit}>
      <h1>Ingreso del profesional</h1>
      <p className="muted">Accedé para ver los pacientes y sus registros.</p>
      <label className="field">
        Email
        <input value={email} onChange={(ev) => setEmail(ev.target.value)} type="email" autoComplete="username" />
      </label>
      <label className="field">
        Contraseña
        <input
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          type="password"
          autoComplete="current-password"
        />
      </label>
      {err ? <div className="error">{err}</div> : null}
      <button className="primary" type="submit" disabled={busy}>
        {busy ? 'Ingresando…' : 'Ingresar'}
      </button>
      <p className="muted login-hint">Demo: medico@kneosense.demo · contraseña “kneosense”.</p>
    </form>
  );
}

function PatientList({
  patients,
  onSelect,
}: {
  patients: PatientListItem[] | null;
  onSelect: (id: string) => void;
}) {
  if (!patients) return <p className="muted">Cargando pacientes…</p>;
  return (
    <>
      <h1>Pacientes</h1>
      <p className="muted">Seguimiento postoperatorio · tocá un paciente para ver el detalle.</p>
      <div className="list">
        {patients.map((p) => (
          <button key={p.id} className="row" onClick={() => onSelect(p.id)}>
            <div>
              <div className="row-title">{p.name}</div>
              <div className="row-sub">
                {p.joint} / {p.side} · última: {fmtDateTime(p.lastReadingAt)}
              </div>
            </div>
            <LevelBadge level={p.overallLevel} />
          </button>
        ))}
      </div>
    </>
  );
}

function DevicesPanel({
  devices,
  patients,
}: {
  devices: Device[] | null;
  patients: PatientListItem[] | null;
}) {
  if (!devices) return null;
  const nameOf = (id: string | null) => patients?.find((p) => p.id === id)?.name ?? id ?? '—';
  const unpaired = devices.filter((d) => !d.patientId).length;

  return (
    <section className="devices">
      <h2>Dispositivos ({devices.length})</h2>
      <p className="muted">
        {devices.length === 0
          ? 'Todavía no hay parches conectados.'
          : unpaired > 0
            ? `${unpaired} sin vincular — el paciente ingresa el código en su app para asociarlo.`
            : 'Todos los parches están vinculados a un paciente.'}
      </p>
      <div className="list">
        {devices.map((d) => (
          <div key={d.deviceId} className="row">
            <div>
              <div className="row-title">{d.deviceId}</div>
              <div className="row-sub">
                {d.patientId
                  ? `Vinculado a ${nameOf(d.patientId)} · últ. ${fmtDateTime(d.lastSeen)}`
                  : `Código ${d.pairingCode} · últ. ${fmtDateTime(d.lastSeen)}`}
              </div>
            </div>
            <span className={`badge badge-${d.patientId ? 'normal' : 'watch'}`}>
              {d.patientId ? 'Vinculado' : 'Sin vincular'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PatientDetailView({ detail, onBack }: { detail: PatientDetail | null; onBack: () => void }) {
  if (!detail) return <p className="muted">Cargando detalle…</p>;
  const { patient, readings, evaluation } = detail;

  return (
    <>
      <button className="back" onClick={onBack}>
        ← Volver
      </button>
      <div className="detail-head">
        <h1>{patient.name}</h1>
        {evaluation ? <LevelBadge level={evaluation.overallLevel} /> : null}
      </div>
      <p className="muted">
        {patient.joint} / {patient.side} · dolor {patient.pain0to10 ?? '—'}/10 · edema{' '}
        {patient.edemaVisible} · eritema {patient.erythemaVisible}
      </p>

      {evaluation ? (
        <section className="card">
          <h2>Evaluación (tétrada de Celso)</h2>
          <p className="reco">{evaluation.recommendation}</p>
          <ul className="findings">
            {evaluation.findings.map((f) => (
              <li key={f.key}>
                <span className={`dot dot-${f.level}`} />
                <span>
                  <strong>{f.label}</strong> — <span className="muted">{f.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="disclaimer">Evaluación por reglas con umbrales citados. NO es un diagnóstico.</p>
        </section>
      ) : null}

      <section className="card">
        <h2>Tendencias</h2>
        <div className="trends">
          <div>
            <div className="trend-label">Temp. afectada (°C)</div>
            <Sparkline values={readings.map((r) => r.tempAffectedC)} color="#DC2626" />
          </div>
          <div>
            <div className="trend-label">Bioimpedancia (Ω)</div>
            <Sparkline values={readings.map((r) => r.bioimpedanceOhm)} color="#087F85" />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Mediciones ({readings.length})</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Temp. ref</th>
                <th>Temp. afect.</th>
                <th>Δ</th>
                <th>Bioimp.</th>
                <th>IMU</th>
                <th>Batería</th>
                <th>Calidad</th>
              </tr>
            </thead>
            <tbody>
              {[...readings].reverse().map((r) => {
                const d = delta(r);
                return (
                  <tr key={r.id}>
                    <td>{fmtDateTime(r.timestamp)}</td>
                    <td>{r.tempReferenceC ?? '—'}</td>
                    <td>{r.tempAffectedC ?? '—'}</td>
                    <td>{d == null ? '—' : `${d >= 0 ? '+' : ''}${d.toFixed(1)}`}</td>
                    <td>{r.bioimpedanceOhm == null ? '—' : Math.round(r.bioimpedanceOhm)}</td>
                    <td>{r.activityIndex == null ? '—' : `${Math.round(r.activityIndex * 100)}%`}</td>
                    <td>{r.batteryPct}%</td>
                    <td>{r.quality === 'invalid_contact' ? 'inválida' : 'ok'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Imágenes ({detail.photos?.length ?? 0})</h2>
        {detail.photos && detail.photos.length > 0 ? (
          <div className="photos">
            {detail.photos.map((ph) => (
              <figure key={ph.id} className="photo">
                <img src={`${API_BASE}${ph.url}`} alt={`Foto ${fmtDateTime(ph.capturedAt)}`} />
                <figcaption>
                  {fmtDateTime(ph.capturedAt)}
                  <br />
                  edema {ph.edema ?? '—'} · eritema {ph.erythema ?? '—'}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="muted">
            El paciente todavía no sincronizó fotos desde la app. Cuando lo haga, aparecen acá.
          </p>
        )}
      </section>
    </>
  );
}
