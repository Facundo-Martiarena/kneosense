# Prompt para integrar el Arduino/ESP32 con el backend KneoSense

Pegá el bloque de abajo en el otro Claude (el de tu proyecto de firmware). Es
autocontenido: trae todo el contexto del backend ya desplegado, así no tiene que
adivinar nada. Apunta al **firmware del ESP32** — la data entra al backend y se ve
en la web del médico (https://kneosense-doctor.fly.dev).

---

```
Estoy programando el firmware de un parche de sensores para la rodilla (proyecto
"KneoSense"). El micro es un ESP32 con WiFi. Tiene que leer sensores y enviar las
lecturas por HTTP a un backend que YA EXISTE y está online. NO modifiques el
backend: solo escribí el firmware del ESP32 que le pega a su endpoint.

== Backend (ya desplegado) ==
- Endpoint:  POST https://kneosense-backoffice.fly.dev/api/patients/<DEVICE_ID>/readings
- Sin autenticación. HTTPS obligatorio. Content-Type: application/json.
- El server crea el paciente solo si no existe y genera id/timestamp si no los mando,
  así que el firmware manda SOLO los valores del sensor.
- Body JSON (los numéricos son opcionales; podés mandar null si no tenés el sensor):
  {
    "tempReferenceC": 33.1,     // °C, temperatura zona sana (referencia)
    "tempAffectedC": 34.8,      // °C, temperatura zona operada
    "bioimpedanceOhm": 452.0,   // Ω, bioimpedancia (tendencia de edema)
    "activityIndex": 0.12,      // 0..1, actividad/movimiento (IMU)
    "batteryPct": 87,           // 0..100, batería
    "quality": "measured"       // "measured" = dato real; "invalid_contact" si el electrodo no hace contacto
  }
- Respuesta OK: HTTP 200  {"ok":true,"patientId":"...","readings":1}

== Qué necesito que hagas ==
1. Firmware COMPLETO para ESP32 (framework Arduino) que:
   - Conecte a WiFi (constantes arriba: WIFI_SSID, WIFI_PASS, DEVICE_ID, API_BASE, INTERVAL_MS=60000).
   - Cada INTERVAL_MS lea los sensores y haga el POST del JSON de arriba.
   - Use HTTPS con WiFiClientSecure + HTTPClient. Para el demo usá client.setInsecure(),
     y dejá comentado cómo cargar el certificado CA real para producción.
   - Loguee por Serial el HTTP code y el body de respuesta.
   - Maneje errores: reconexión de WiFi y reintento con backoff si el POST falla.
2. Sensores asumidos (si no sabés el modelo exacto, dejá funciones placeholder bien
   marcadas con // TODO devolviendo valores de ejemplo, y explicá el cableado/pines):
   - 2x temperatura (ej. DS18B20 o NTC) → tempReferenceC y tempAffectedC.
   - bioimpedancia → bioimpedanceOhm.
   - IMU (ej. MPU6050) → activityIndex normalizado 0..1.
   - batería por divisor de tensión en un pin ADC → batteryPct.
3. Decime qué librerías instalar (Arduino IDE o PlatformIO) y cómo compilar y flashear.
4. Explicá cómo verifico que llegó: entrar a https://kneosense-doctor.fly.dev
   (login medico@kneosense.demo / kneosense) y ver el dispositivo <DEVICE_ID>
   aparecer con sus lecturas en vivo.

Dame el .ino completo listo para compilar, con las constantes de config bien arriba.
```

---

## Notas

- El endpoint, el JSON y los campos son exactamente los que están desplegados hoy,
  así que el firmware generado funciona contra el backend real sin ajustes.
- La data del Arduino entra al **backend** y se ve en la **web del médico**. NO aparece
  todavía en la **app del paciente** (esa lee de su SQLite local). Si se quiere mostrar
  dentro de la app, hay que agregarle un "traer lecturas del backend" — es otro cambio.
