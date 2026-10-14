# ARTICUCARE AI

**Plan de desarrollo por fases**

Aplicación móvil iOS y Android para seguimiento postoperatorio articular mediante bioimpedancia simulada, fotografías y visualización anatómica 2.5D/3D.

Versión: 1.0 | Fecha: 14 de octubre de 2026 | Modalidad: MVP universitario con datos sintéticos

> **DECISIÓN DE ALCANCE: NO se construirá hardware en la primera versión. Todas las mediciones de bioimpedancia serán sintéticas y estarán claramente identificadas como DEMO. El sistema NO evaluará el estado real de una operación ni emitirá diagnósticos.**

![Bocetos de la app móvil](media/image1.png)

Bocetos ilustrativos de dos pantallas móviles: seguimiento con señal simulada y vista anatómica conceptual. No muestran resultados clínicos reales.

## Decisiones aprobadas

| **Dimensión**  | **Decisión para la primera versión**                                                            |
|----------------|-------------------------------------------------------------------------------------------------|
| Plataformas    | Una base de código móvil para iOS y Android (React Native + Expo + TypeScript).                 |
| Bioimpedancia  | Mock por escenarios, con contratos de datos compatibles con un futuro dispositivo.              |
| Fotografía     | Cámara o galería; captura guiada y comparación temporal.                                        |
| IA             | Servicio de resultados simulados al principio; validación experimental posterior con SurgWound. |
| 3D             | Visualización ilustrativa de una articulación; NO reconstrucción anatómica desde una foto.      |
| Almacenamiento | Local para el MVP; backend y cuentas reales son posteriores.                                    |

# 1. Objetivo, usuarios y límites

Objetivo del MVP: permitir que un paciente ficticio registre y consulte la evolución de una articulación operada en un entorno controlado de demostración, combinando mediciones sintéticas de bioimpedancia, fotografías, síntomas y una representación visual entendible.

## 1.1 Usuarios y caso de uso

- Usuario principal: persona adulta en recuperación domiciliaria después de cirugía articular; en el MVP se usa un paciente de demostración.
- Usuario secundario: profesional sanitario que revisaría un historial, inicialmente representado por una pantalla de exportación.
- Articulación piloto: rodilla para contar con referencias técnicas; estructura configurable para muñeca, tobillo o codo.
- Flujo diario: abrir app → ver demo → revisar medición → tomar/subir foto → registrar dolor e hinchazón percibida → consultar evolución y vista ilustrativa.

## 1.2 Requisitos funcionales del MVP

| **Código** | **Requisito**                                                          | **Prioridad** |
|------------|------------------------------------------------------------------------|---------------|
| RF-01      | Seleccionar paciente/caso demostrativo.                                | P0            |
| RF-02      | Mostrar histórico de bioimpedancia sintética, con unidad y frecuencia. | P0            |
| RF-03      | Capturar/subir fotografías y guardar fecha.                            | P0            |
| RF-04      | Pantalla de comparación de fotos con ayuda de encuadre.                | P0            |
| RF-05      | Registrar dolor, rigidez y percepción de hinchazón.                    | P0            |
| RF-06      | Mostrar análisis visual: primero simulado, luego experimental.         | P0            |
| RF-07      | Mostrar anatomía 2.5D/3D meramente ilustrativa.                        | P1            |
| RF-08      | Exportar resumen del caso demostrativo.                                | P1            |
| RF-09      | Sincronizar con sensor real por BLE.                                   | Fuera MVP     |

> **Regla del producto: la aplicación informará “cambio observado en la medición sintética”, no “edema confirmado”, “inflamación en X %”, “infección descartada” ni “recuperación normal”.**

## 1.3 No objetivos

No utilizar imágenes o datos reales de personas operadas en la demo sin permisos y revisión ética. No tomar decisiones médicas automáticamente. No estimar volumen 3D real a partir de una foto única.

# 2. Arquitectura técnica propuesta

![Diagrama de arquitectura](media/image2.png)

Separación de responsabilidades: cliente móvil, servicios simulados y módulo experimental de análisis de imágenes; el hardware real podrá incorporarse por adaptación de interfaz.

| **Capa**       | **Tecnología sugerida**                                  | **Responsabilidad**                                    |
|----------------|----------------------------------------------------------|--------------------------------------------------------|
| Aplicación     | React Native + Expo + TypeScript + Expo Router           | UI, navegación y compatibilidad iOS/Android.           |
| Estado y datos | Context / Zustand + repositorios tipados                 | Escenarios de demo, cache y estado de pantalla.        |
| Fotos          | expo-image-picker / cámara                               | Seleccionar y capturar imágenes, permisos y metadatos. |
| Persistencia   | JSON local y expo-sqlite (si hace falta)                 | Historial sintético y configuraciones.                 |
| IA             | Mock local; Python + PyTorch en fase de I+D              | Salida visual no clínica y evaluación offline.         |
| 3D             | Assets pre-renderizados 2.5D; más tarde expo-gl/Three.js | Visualización ilustrativa; verificar compatibilidad.   |
| Backend        | No requerido al inicio; FastAPI opcional después         | Conectividad y despliegue si se extiende el alcance.   |

Expo documenta cámara/galería mediante expo-image-picker y renderizado 2D/3D mediante expo-gl. La compatibilidad de Three.js requiere una prueba específica sobre dispositivos reales antes de fijarla como dependencia de producción [2–4].

# 3. Bioimpedancia totalmente simulada

Crearemos un proveedor de datos que emita lecturas sintéticas en el mismo formato que se espera de un futuro sensor de bioimpedancia. Así el desarrollo de la app no queda bloqueado por el hardware.

## 3.1 Modelo mínimo de medición

```typescript
type ImpedanceMeasurement = {
  id: string; timestamp: string;
  joint: "knee" | "wrist" | "ankle" | "elbow";
  side: "left" | "right";
  frequencyHz: number;
  impedanceMagnitudeOhm: number | null;
  phaseDegrees: number | null;
  skinTemperatureC?: number;
  quality: "simulated" | "invalid_contact";
  source: "mock" | "ble_device";
  isSynthetic: boolean;
};
```

Ejemplos de variables: magnitud de impedancia (ohmios), fase (grados) y frecuencia (Hz). No deben interpretarse clínicamente sin diseño y calibración del sistema de medición.

## 3.2 Escenarios de simulación

| **Escenario**          | **Comportamiento de UI**                   | **Prueba funcional**                                    |
|------------------------|--------------------------------------------|---------------------------------------------------------|
| Tendencia variable     | Serie sintética que cambia día a día.      | Gráfico y comparación con referencia; no inferir edema. |
| Sin cambios relevantes | Serie sintética aproximadamente estable.   | Pantalla de historial y vista anatómica neutral.        |
| Lectura inválida       | Registro nulo con quality=invalid_contact. | Mensaje “medición no disponible”; reintento.            |
| Foto no comparable     | Cambio importante de ángulo o luz.         | Solicitar nueva toma; no emitir comparación.            |
| Datos ausentes         | Día sin foto o sin medición.               | Mostrar ausencia explícita sin interpolar como hecho.   |

## 3.3 Contrato y adaptación futura

La app nunca importará directamente bibliotecas de sensor en sus pantallas. Usará un contrato IMeasurementRepository con implementaciones MockMeasurementRepository y, en una fase posterior, BleMeasurementRepository. Cada lectura incluirá origen y bandera isSynthetic.

```typescript
interface IMeasurementRepository {
  listForCase(caseId: string): Promise<ImpedanceMeasurement[]>;
  getLatest(caseId: string): Promise<ImpedanceMeasurement | null>;
}
// En la versión de demostración: MockMeasurementRepository
```

Entregable adicional: el archivo ArticuCare_datos_simulados.json acompaña este documento y contiene tres escenarios sintéticos, útiles para iniciar pantallas y pruebas. Sus valores son inventados deliberadamente.

# 4. Fotografías estandarizadas

## 4.1 Experiencia de captura

1.  Elegir articulación y lado; mostrar guía visual y pedir autorización para capturar imagen.
2.  Colocar una silueta/guía de encuadre, iluminación homogénea, posición consistente y distancia aproximada fija; utilizar una referencia de escala si el método lo requiere.
3.  Validar calidad básica: nitidez, exposición, ángulo, presencia de la articulación y oclusiones.
4.  Guardar imagen, fecha, región, posición y metadatos mínimos, evitando EXIF de ubicación por defecto.
5.  Mostrar comparación lado a lado entre dos fechas y permitir anotaciones del usuario.

## 4.2 Qué puede y qué no puede inferirse

| **Sí como prototipo exploratorio**                       | **No afirmar sin validación clínica**            |
|----------------------------------------------------------|--------------------------------------------------|
| Cambios de color / enrojecimiento visible.               | Infección descartada o confirmada.               |
| Contorno aparente y diferencias visuales estandarizadas. | Volumen real de edema a partir de una imagen 2D. |
| Presencia de edema visible según un modelo estudiado.    | Cantidad de líquido intraarticular.              |
| Detección de foto deficiente o no comparable.            | Resultado de cirugía “normal” o “anormal”.       |

# 5. IA para fotografías y dataset

Primero integraremos un resultado simulado para completar el flujo de producto. En paralelo desarrollaremos un experimento de IA fuera de la app, con protocolo de evaluación. Solamente se integrarán pesos del modelo cuando superen pruebas predefinidas y haya claridad sobre su alcance.

## 5.1 Recurso seleccionado: SurgWound

SurgWound-Bench contiene 686 fotografías quirúrgicas anotadas por especialistas, incluidas etiquetas edema (existent / non-existent / uncertain), eritema, tipo de exudado y estado de cicatrización; se informa una partición de 480 imágenes para entrenamiento, 69 para validación y 137 para prueba [5–6].

Los casos incluyen diversas localizaciones anatómicas y procedimientos: NO constituyen una cohorte longitudinal específica de articulaciones posoperatorias. Por tanto, sirven para estudiar reconocimiento de atributos visuales de heridas, no para validar nuestro seguimiento del edema profundo ni la bioimpedancia.

## 5.2 Pipeline experimental de IA

1. Revisar licencia y términos de uso; registrar procedencia de imágenes y etiquetas.
2. Extraer tareas binarias edema-visible y eritema, conservando uncertain como categoría separada o excluyéndola con criterio documentado.
3. Separar entrenamiento/validación/prueba por sujeto si existen identificadores; respetar particiones oficiales y detectar duplicados/filtraciones.
4. Crear baseline de clasificación visual con PyTorch (modelo preentrenado ligero); contrastar contra un baseline sin IA.
5. Medir sensibilidad, especificidad, AUROC, F1, matriz de confusión y calibración; reportar IC cuando sea posible.
6. Analizar fallos por articulación, color de piel, iluminación, vendajes, período posoperatorio y calidad de imagen cuando los metadatos lo permitan.
7. Integrar resultados en la app solamente como “clasificación visual experimental”; en ausencia de evidencia, conservar el mock.

## 5.3 Contrato de análisis visual

```typescript
type VisualAssessment = {
  photoId: string; origin: "mock" | "experimental_model";
  edemaVisible: "existent" | "non_existent" | "uncertain";
  erythemaVisible: "existent" | "non_existent" | "uncertain";
  imageQuality: "acceptable" | "retake_required";
  version: string;
  isClinicalDecision: false;
};
```

> **No habrá “probabilidad de infección” ni instrucciones médicas basadas en un modelo no validado. Ante señales importantes o síntomas de alarma, la app debe indicar que se contacte con el equipo médico según instrucciones de alta, independientemente de lo que diga el algoritmo.**

# 6. Visualización 2.5D / 3D dentro de la app

La propuesta de imágenes que simulan 3D es adecuada para explicar el seguimiento al usuario. Distinguiremos tres niveles de implementación:

| **Nivel**                  | **Qué se muestra**                                                                                                     | **Tecnología / esfuerzo**                                                 |
|----------------------------|------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| MVP: 2.5D                  | Imágenes pre-renderizadas de una anatomía genérica desde 2 o 3 ángulos, con regiones coloreadas según escenarios demo. | PNG/WebP/SVG y animación ligera. Bajo esfuerzo.                           |
| Intermedio: 3D interactivo | Modelo anatómico genérico giratorio, zoom y capas visuales que reaccionan a datos simulados.                           | GLB/Three.js con expo-gl o motor embebido, tras prueba de compatibilidad. |
| Avanzado: 3D paciente      | Reconstrucción basada en múltiples fotos o profundidad y medidas calibradas.                                           | FUERA de alcance del MVP; requiere método y validación específicos.       |

## 6.1 Reglas de interpretación

- Etiqueta persistente “Representación ilustrativa: no reconstruida a partir de la fotografía”.
- Las áreas coloreadas representan una variable demo o una anotación interpretativa; nunca presentan un mapa anatómico real del líquido tisular.
- Una foto del paciente aparece en pestaña separada y no se transforma automáticamente en un modelo volumétrico.
- Cambios de geometría y zonas resaltadas en la demo son ilustrativos, no pruebas de edema.

Si se adopta 3D real, primero realizar una prueba de rendimiento y compatibilidad en iOS y Android; la documentación Expo publica GLView para estas plataformas, pero no garantiza todos los integradores de escenas 3D [3–4].

# 7. Hoja de ruta por fases (8 semanas)

Plan orientativo para un equipo pequeño (2–4 integrantes). Las semanas pueden solaparse. Cada fase tiene condición de salida verificable.

| Fase / plazo | Trabajo principal | Entregable y criterio de aceptación |
| --- | --- | --- |
| F0 · Semana 1 — Alcance y UX | Historias de usuario, navegación y wireframes. Definir lenguaje de seguridad y escenarios de prueba. | Mapa de 6 pantallas; flujo completo aprobado por el equipo. |
| F1 · Semanas 1–2 — Base mobile | Crear repo Expo/TypeScript, navegación, tema, componentes, ejecución en iOS y Android. | Home + casos demo funcionan en simulador y equipo físico cuando se disponga. |
| F2 · Semanas 2–3 — Mock BIA | Fixtures JSON, interfaz repositorio, series y estados inválidos. | Gráficos, filtrado temporal y etiqueta DEMO 100 % visible. |
| F3 · Semanas 3–4 — Fotografías | Cámara/galería, guía de captura, historial y comparación. | Carga y comparación de dos fotos; caso sin imagen manejado. |
| F4 · Semanas 4–6 — IA visual | Simular clasificación; explorar SurgWound y construir baseline offline. | Reporte de métricas reproducible; mock integrado aunque el modelo falle. |
| F5 · Semanas 5–6 — 2.5D / 3D | Insertar imágenes anatómicas 2.5D, capa ilustrativa y selector de articulación. | Vista usable en iOS y Android; advertencia interpretativa permanente. |
| F6 · Semanas 6–7 — Seguimiento integral | Cruzar serie, fotografías, registro de dolor e incertidumbre; exportar. | Journey completo de paciente demo con histórico y reporte. |
| F7 · Semanas 7–8 — Validar y presentar | QA, usabilidad, privacidad, rendimiento, pruebas de accesibilidad. | Demo repetible en ambos SO; informe de límites y backlog post-MVP. |

## 7.1 Hitos de demostración

| **Hito**          | **Demostración de 2 minutos**                                         |
|-------------------|-----------------------------------------------------------------------|
| H1 · fin semana 2 | App instalada y navegación funcional con paciente ficticio.           |
| H2 · fin semana 4 | Serie BIA sintética, foto y comparación visual con guía de encuadre.  |
| H3 · fin semana 6 | Clasificador mock y representación anatómica 2.5D ilustrativa.        |
| H4 · fin semana 8 | Flujo integral, exportación de resumen y defensa del alcance clínico. |

# 8. Pantallas y navegación del MVP

| **Pantalla**         | **Contenido clave**                                                                    |
|----------------------|----------------------------------------------------------------------------------------|
| Bienvenida / demo    | Aviso “prototipo académico con datos simulados”, acceso a escenarios.                  |
| Panel principal      | Articulación, días desde intervención ficticia, último dato sintético y acceso rápido. |
| Mediciones           | Gráfico BIA, frecuencia, señal válida/inválida, fuente mock, serie temporal.           |
| Fotos                | Captura guiada, comparación, fechas y calidad de toma.                                 |
| Vista anatómica      | Modelo 2.5D/3D genérico, selector de ángulo, leyenda ilustrativa.                      |
| Registro de síntomas | Dolor 0–10, percepción de hinchazón, rigidez y comentario.                             |
| Historial / resumen  | Línea de tiempo, descarga de reporte de demostración y límites de uso.                 |

# 9. Historias de usuario y criterios de aceptación

| **Historia**                                         | **Criterio verificable**                                                    |
|------------------------------------------------------|-----------------------------------------------------------------------------|
| Como usuario quiero seguir la evolución día a día.   | La gráfica muestra fecha y valor, y distingue un día sin lectura.           |
| Quiero ver si mi foto cambió respecto a otra.        | Dos fotos aparecen con fechas; la app informa si no son comparables.        |
| Quiero entender la representación anatómica.         | El rótulo “ilustrativa” no puede ocultarse; la imagen real va separada.     |
| Como desarrollador quiero conectar un sensor futuro. | Las pantallas consumen IMeasurementRepository sin depender de BLE.          |
| Quiero probar fallos de medición.                    | Se puede activar escenario de sensor inválido y la app no inventa lecturas. |
| Quiero saber si la IA es real.                       | Se muestra origin=mock o experimental_model de manera inequívoca.           |

# 10. Pruebas, privacidad y seguridad

## 10.1 QA móvil

- Pruebas de componentes, pantallas y flujo completo en iOS y Android; tamaños de pantalla y modo oscuro.
- Pruebas de permisos de cámara, falta de espacio, imágenes corruptas, app offline y cierre inesperado.
- Accesibilidad: contraste, tamaño de texto, VoiceOver/TalkBack, no depender solo de colores.
- Pruebas contra mezcla accidental de pacientes y contra la eliminación de la marca “datos sintéticos”.

## 10.2 Salud y tratamiento de datos

El primer MVP deberá usar pacientes ficticios, imágenes demostrativas con derechos de uso y almacenamiento local. Para pasar a datos personales reales se necesita determinar base jurídica RGPD y excepción aplicable a datos de salud, minimizar datos, definir conservación, cifrado y controles de acceso; la aceptación de una pantalla de consentimiento no resuelve por sí sola estas obligaciones [7].

La clasificación regulatoria futura dependerá de la finalidad médica prevista; el documento europeo MDCG 2019-11 rev.1 (2025) proporciona orientaciones para la cualificación y clasificación de software médico bajo el MDR [8].

> **Seguridad clínica: no utilizar este MVP como dispositivo sanitario real. No presenta porcentajes de inflamación, diagnósticos ni alertas de infección basadas en lecturas sintéticas. El profesional de salud sigue siendo quien interpreta la evolución postoperatoria.**

## 10.3 Matriz de riesgos principales

| **Riesgo**                                       | **Mitigación durante el MVP**                                         |
|--------------------------------------------------|-----------------------------------------------------------------------|
| El usuario cree que los datos son reales.        | Sello DEMO + isSynthetic=true + pantalla inicial de uso académico.    |
| La vista 3D parece una medición clínica.         | Etiqueta “visualización ilustrativa” y sin inferencia de volumen.     |
| Fotos de baja calidad sesgan análisis.           | Guía de captura, control básico y estado “retomar foto”.              |
| Modelo entrenado con casos heterogéneos.         | Validación estratificada y declaración de ámbito de datos.            |
| Datos de salud o fotos identificables expuestos. | Durante MVP no usar datos clínicos reales; política de acceso mínimo. |

# 11. Estructura inicial del repositorio

```text
articucare/
  app/ # pantallas Expo Router
  src/components/ # gráficos, etiquetas DEMO, tarjetas
  src/features/measurements/ # modelos + repositorio de bioimpedancia
  src/features/photos/ # captura y comparación
  src/features/visuals/ # 2.5D y vista anatómica
  src/features/assessment/ # resultados visuales mock/experimentales
  src/data/mocks/ # fixtures sintéticos
  src/types/ # contratos TypeScript
  assets/anatomy/ # recursos anatómicos licenciados
  tests/ # unitarias y flujos
  research/ai/ # notebooks/scripts de evaluación externos
```

## 11.1 Primeras tareas de programación (orden sugerido)

1. Crear repositorio y proyecto TypeScript: npx create-expo-app@latest articucare.
2. Definir tipos de Case, ImpedanceMeasurement, PhotoRecord y VisualAssessment.
3. Importar el JSON sintético adjunto y montar MockMeasurementRepository.
4. Implementar navegación y pantalla “Mediciones”; mostrar primero un gráfico con 7 valores ficticios.
5. Agregar expo-image-picker, guía de foto y comparación temporal.
6. Construir estado de IA ficticio: etiquetas de edema visible y calidad, claramente marcadas como simuladas.
7. Incorporar PNGs 2.5D y preparar un spike posterior de expo-gl/Three.js.
8. Escribir pruebas básicas y mostrar funcionamiento en iOS y Android.

## 11.2 Backlog después del MVP

- Integración de un verdadero módulo clínico de bioimpedancia certificado/validado mediante un adaptador de datos y comunicación BLE.
- Backend autenticado y consentimientos, acceso profesional, roles y trazabilidad de versiones.
- Protocolo longitudinal: fotos y bioimpedancia contra evaluación profesional y mediciones de edema de referencia.
- Reconstrucción volumétrica calibrada solamente si se incorpora información 3D real y se valida el método.

# 12. Fuentes técnicas y científicas

[1] Pichonnaz C. et al. (2015). Bioimpedance spectroscopy for swelling evaluation following total knee arthroplasty. BMC Musculoskeletal Disorders.

https://doi.org/10.1186/s12891-015-0559-5

[2] Expo — ImagePicker SDK, captura y galería para Android/iOS.

https://docs.expo.dev/versions/latest/sdk/imagepicker/

[3] Expo — GLView para gráficos 2D/3D.

https://docs.expo.dev/versions/latest/sdk/gl-view/

[4] Expo Three — integración experimental de Three.js.

https://github.com/expo/expo-three

[5] Xu J. et al. (2026). SurgWound-Bench: a benchmark for surgical wound diagnosis. npj Digital Medicine.

https://doi.org/10.1038/s41746-026-02791-3

[6] SurgWound — ficha de dataset, particiones y etiquetas.

https://huggingface.co/datasets/xuxuxuxuxu/SurgWound

[7] Comisión Europea — bases legales y datos de salud bajo RGPD.

https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en

[8] Comisión Europea, MDCG 2019-11 rev.1 (2025). Clasificación de software sanitario.

https://health.ec.europa.eu/latest-updates/update-mdcg-2019-11-rev1-qualification-and-classification-software-regulation-eu-2017745-and-2025-06-17_en

Fuentes consultadas el 14/10/2026. El documento es un plan de ingeniería y validación experimental; las funcionalidades clínicas y el hardware quedan fuera del MVP.
