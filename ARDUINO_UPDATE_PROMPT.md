# Prompt para ACTUALIZAR el firmware del ESP32 (KneoSense)

Usá este prompt cuando YA tenés un sketch funcionando (hecho con el prompt
anterior) y querés adaptarlo a los cambios del backend: endpoint nuevo con
pairing, enviar solo temperatura, e imprimir el código de vinculación.

Pegá el bloque en el Claude de tu proyecto de firmware (con tu `.ino` actual abierto).

---

```
Tengo un sketch de ESP32 (framework Arduino) que ya postea lecturas al backend
de KneoSense. ACTUALIZALO según estos cambios del backend (no reescribas de cero;
modificá lo mínimo necesario y mostrame el diff / las partes que cambian):

1) ENDPOINT NUEVO (con pairing):
   Antes posteaba a .../api/patients/<ID>/readings.
   Ahora tiene que postear a:
     POST https://kneosense-backoffice.onrender.com/api/devices/<DEVICE_ID>/readings
   - <DEVICE_ID> es un id fijo del parche (constante arriba, ej. "esp32-7" o el MAC).
   - Sigue sin auth, HTTPS, Content-Type: application/json.

2) MANDAR SOLO TEMPERATURA:
   Este parche solo mide temperatura. El backend inventa bioimpedancia, actividad y
   batería, así que el firmware NO los manda más. Sacá del body (y de la lectura de
   sensores) todo lo que no sea temperatura. El body queda:
     {
       "tempReferenceC": 33.1,   // °C zona sana (referencia), rango válido 20–45
       "tempAffectedC": 34.8,    // °C zona operada, rango 20–45
       "quality": "measured"
     }
   - Si una temp no es válida, mandá null (o "quality":"invalid_contact").
   - Ojo con la escala: ~100 °C es un bug de conversión y el server lo descarta.

3) IMPRIMIR EL CÓDIGO DE VINCULACIÓN:
   La respuesta del POST ahora es JSON, ej.:
     { "ok": true, "deviceId": "...", "paired": false, "patientId": null,
       "pairingCode": "Q7YH8J", "readings": 1 }
   - Si "paired" es false, imprimí bien visible por Serial el "pairingCode"
     (el paciente lo ingresa una vez en la app para vincular el parche).
   - Cuando "paired" sea true, dejá de imprimir el código.
   - Si todavía no parseás la respuesta, agregá ArduinoJson para leer estos campos.

4) MANTENÉ lo que ya funciona: conexión WiFi + reconexión, HTTPS (setInsecure en
   demo), intervalo configurable, logging por Serial y el reintento con backoff.

Mostrame el .ino actualizado completo y resumí qué cambiaste.
```

---

## Qué cambió respecto del prompt original
- Endpoint: `/api/patients/<id>/readings` → **`/api/devices/<DEVICE_ID>/readings`**.
- Body: antes mandaba temp + bioz + actividad + batería → **ahora solo temperaturas**
  (el backend mockea el resto).
- Nuevo: **parsear la respuesta** e **imprimir el `pairingCode`** por Serial para
  vincular el parche a un paciente desde la app.
