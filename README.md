# KneoSense — Monitoreo postoperatorio articular (prototipo académico)

Prototipo **100% con datos sintéticos** de un sistema de seguimiento postoperatorio
basado en un **parche de sensores de bioimpedancia** (placa XIAO) que mide, sobre
la articulación operada:

- **2 temperaturas** (referencia + zona afectada → diferencial térmico),
- **bioimpedancia** (tendencia de edema),
- **IMU** (posición de la pierna / movilización),
- **estado de batería**.

A partir de esas señales + las **fotos**, un **motor de decisión por reglas con
umbrales clínicos citados** evalúa los cuatro signos de la **tétrada de Celso**
(calor, tumor, rubor, dolor) y da una orientación **no diagnóstica**.

> ⚠️ Prototipo académico. Datos sintéticos. No es un dispositivo sanitario, no
> reemplaza la valoración de un profesional y no emite diagnósticos.

## Componentes

| Carpeta | Qué es | Stack |
|---|---|---|
| `articucare/` | App del paciente | React Native + Expo (SQLite local) |
| `backoffice/server/` | API del médico | Node + TypeScript (Express, `node:sqlite`) |
| `backoffice/web/` | Panel del médico | React + Vite |

Arquitectura: la **app** guarda localmente (SQLite) y **sincroniza** hacia la
**API**; el **panel del médico** lee de la API (con login) y muestra valores,
tendencias, la evaluación de Celso y las **imágenes** subidas.

## Requisitos

- **Node ≥ 20** (probado en Node 22; la app Expo SDK 57 **no** funciona con Node 18).
  Con nvm: `nvm use 22`.

## Cómo correr

**1) API del médico**
```bash
cd backoffice/server && npm install && npm start      # http://localhost:3001
```

**2) Panel del médico**
```bash
cd backoffice/web && npm install && npm run dev        # http://localhost:5173
```
Login demo: `medico@kneosense.demo` / `kneosense`
(configurable con `DOCTOR_EMAIL` / `DOCTOR_PASSWORD`).

**3) App del paciente (Expo Go)**
```bash
cd articucare && npm install && npx expo start --go
```
Escaneá el QR con Expo Go. Para que la app sincronice con la API desde un
teléfono real, apuntá `EXPO_PUBLIC_BACKOFFICE_URL` a la **IP LAN** de la máquina
(no `localhost`) y usá una WiFi sin aislamiento de clientes:
```bash
EXPO_PUBLIC_BACKOFFICE_URL=http://TU_IP_LAN:3001 npx expo start --go
```

## Guión de demostración (3 minutos)

1. **Panel del médico** (`:5173`) → login → se ve el **triage** de pacientes con
   su nivel (Normal / Vigilar / **Alerta**). Entrá a uno: valores, tendencias,
   evaluación de la tétrada de Celso e imágenes.
2. **App del paciente**: tocá el **ícono de perfil** → **Crear paciente nuevo**
   (nombre + articulación).
3. Cargá datos de ese paciente:
   - **Síntomas** → subí el dolor (ej. 8/10).
   - **Fotos** → sacá/elegí una foto de la rodilla.
   - **Mediciones** → "+ Nueva medición" un par de veces (el gráfico se actualiza;
     tocá el gráfico para ver valor + fecha/hora; "⤢ Ampliar" lo pone horizontal).
4. En el **Home** → **"Sincronizar con el médico"**.
5. Volvé al **panel del médico**, refrescá: aparece el paciente creado con sus
   lecturas, su evaluación de Celso y la **foto**.

## Limitaciones honestas (prototipo)

- Todos los datos son **sintéticos**; las lecturas del parche se generan/siembran.
- El backend **no está hosteado** ni es offline: requiere los dos procesos vivos.
- La sincronización teléfono→servidor depende de la red (IP LAN + WiFi sin
  aislamiento). El backoffice (API + web) corre 100% local.
- El **login** del médico es de nivel demo (una credencial, token en memoria).
- El "modelo de IA" es un **motor de reglas transparente** con umbrales citados,
  no un modelo entrenado (no existe dataset validado para este caso multimodal).

## Documentación de features

Ver `odd/tasks/` (documentos por feature: rediseño UI, motor de decisión,
persistencia SQLite, backoffice, etc.).
