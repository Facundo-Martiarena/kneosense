# Prompt para integrar el Arduino/ESP32 con el backend KneoSense

Pegá el bloque de abajo en el otro Claude (el de tu proyecto de firmware). Es
autocontenido: trae todo el contexto del backend ya desplegado, incluido el
flujo de **vinculación (pairing)** device → paciente.

---

```
Estoy programando el firmware de un parche de sensores para la rodilla (proyecto
"KneoSense"). El micro es un ESP32 con WiFi. Lee sensores y los envía por HTTP a un
backend que YA EXISTE y está online. NO modifiques el backend: solo escribí el
firmware del ESP32 que le pega a su endpoint.

== Backend (ya desplegado) ==
- Endpoint:  POST https://kneosense-backoffice.onrender.com/api/devices/<DEVICE_ID>/readings
- <DEVICE_ID> es un id fijo del parche (ej. "esp32-7" o el MAC del ESP32).
- Sin autenticación. HTTPS obligatorio. Content-Type: application/json.
- El firmware manda SOLO los valores del sensor (el server genera id/timestamp si no van).
- Body JSON (los numéricos son opcionales; mandá null o no los incluyas si no tenés el sensor):
  {
    "tempReferenceC": 33.1,     // °C, temperatura zona sana (referencia). RANGO VÁLIDO 20–45; fuera de eso el server lo descarta.
    "tempAffectedC": 34.8,      // °C, temperatura zona operada. Mismo rango 20–45.
    "bioimpedanceOhm": 452.0,   // Ω, bioimpedancia (tendencia de edema)
    "activityIndex": 0.12,      // 0..1, actividad/movimiento (IMU)
    "batteryPct": 87,           // 0..100, batería
    "quality": "measured"       // "measured" = dato real; "invalid_contact" si el electrodo no hace contacto
  }
- Respuesta OK (HTTP 200):
  { "ok": true, "deviceId": "...", "paired": false, "patientId": null,
    "pairingCode": "Q7YH8J", "readings": 1 }
  * Si "paired" es false, viene "pairingCode": un código de 6 caracteres. El paciente
    lo ingresa UNA vez en la app de KneoSense para vincular este parche a su perfil.
  * Una vez vinculado, "paired" pasa a true y ya no viene pairingCode.

== Qué necesito que hagas ==
1. Firmware COMPLETO para ESP32 (framework Arduino) que:
   - Conecte a WiFi (constantes arriba: WIFI_SSID, WIFI_PASS, DEVICE_ID, API_BASE, INTERVAL_MS=60000).
   - Cada INTERVAL_MS lea los sensores y haga el POST del JSON de arriba.
   - Use HTTPS con WiFiClientSecure + HTTPClient. Para el demo usá client.setInsecure(),
     y dejá comentado cómo cargar el certificado CA real para producción.
   - Parsee la respuesta JSON (ej. con ArduinoJson). Si "paired" es false, IMPRIMÍ bien
     visible por Serial el "pairingCode" para que el paciente lo cargue en la app.
     Una vez pareado, dejá de imprimirlo.
   - Loguee por Serial el HTTP code y el body.
   - Maneje errores: reconexión de WiFi y reintento con backoff si el POST falla.
2. Sensores asumidos (si no sabés el modelo exacto, dejá funciones placeholder bien
   marcadas con // TODO devolviendo valores de ejemplo DENTRO del rango válido, y
   explicá el cableado/pines):
   - 2x temperatura (ej. DS18B20 o NTC) → tempReferenceC y tempAffectedC (20–45 °C).
   - bioimpedancia → bioimpedanceOhm.
   - IMU (ej. MPU6050) → activityIndex normalizado 0..1.
   - batería por divisor de tensión en un pin ADC → batteryPct.
   IMPORTANTE: cuidá la escala de la conversión de temperatura; un valor de ~100 °C
   es un bug típico de cableado/escala y el server lo va a descartar.
3. Decime qué librerías instalar (Arduino IDE o PlatformIO) y cómo compilar y flashear.
4. Explicá el flujo completo: flashear → ver el pairingCode por Serial → el paciente lo
   ingresa en la app de KneoSense → el médico ve al paciente con sus lecturas en vivo en
   https://kneosense-doctor.onrender.com (login medico@kneosense.demo / kneosense).

Dame el .ino completo listo para compilar, con las constantes de config bien arriba.
```

---

## Notas

- El endpoint, el JSON, el rango de validación y el flujo de pairing son exactamente
  los que están desplegados hoy, así que el firmware generado funciona sin ajustes.
- El server **descarta valores físicamente imposibles** (temp fuera de 20–45 °C, etc.)
  para que un sensor mal calibrado no dispare una falsa alerta.
- La data entra al backend y se ve en la web del médico. La vinculación en la **app
  del paciente** (ingresar el pairingCode) queda pendiente de implementar en la app.
