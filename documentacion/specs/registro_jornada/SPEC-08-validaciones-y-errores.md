# SPEC-08 — Validaciones y errores

## Objetivo

Documentar la evidencia disponible sobre validaciones, estados de acción, carga y error de la captura administrativa de jornadas. Esta SPEC no define contratos de Supabase ni reglas de negocio no implementadas.

## Alcance y fuera de alcance

**Alcance.** Estado y validaciones locales de la pantalla, sus filas, resolución de código, implementos, acciones y comportamiento responsive observable en los archivos fuente.

**Fuera de alcance.** Reglas de persistencia, contratos o respuestas de RPC, tablas, columnas, transacciones, idempotencia, reintentos, permisos, validaciones del backend y la secuencia efectiva de eventos administrativos.

## Fuentes y clasificación de evidencia

No hay un contrato real de Supabase disponible en esta carpeta. Por tanto, ningún comportamiento backend queda confirmado.

| Fuente                                       | Clasificación que aporta                            | Uso en esta SPEC                                                                                    |
| -------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `registroJornada.types.ts`                   | Confirmado                                          | Forma de los modelos y catálogos del frontend.                                                      |
| `composables/useJornadaAdmin.ts`             | Confirmado                                          | Validación local de continuidad, resolución de código, estado `guardando` y captura local de error. |
| `RegistroJornadaPage.vue`                    | Confirmado                                          | Orquestación de la validación y asignación local del implemento creado.                             |
| `components/*.vue`                           | Confirmado                                          | Campos, restricciones locales, acciones emitidas y responsive implementado.                         |
| `registroJornada.service.ts`                 | Confirmado como llamadas fuente; contrato pendiente | Nombres de RPC invocados por el servicio. No verifica sus contratos.                                |
| `registro_jornada_integracion_completa.html` | Ejemplo visual                                      | Prototipo y comentarios; no confirma reglas backend ni contratos.                                   |

Clasificación usada: **Confirmado** = implementado en los archivos Vue/TypeScript; **Decisión de UI** = comportamiento o presentación elegida por la interfaz; **Ejemplo visual** = sugerido o simulado únicamente en el HTML; **Pendiente** = requiere una fuente real de Supabase o una definición de negocio.

## Validaciones de datos generales

| Regla o comportamiento                                                                                 | Clasificación  | Evidencia                                                |
| ------------------------------------------------------------------------------------------------------ | -------------- | -------------------------------------------------------- |
| El modelo admite `fecha`, `operadorId`, `equipoNumero` y `area` nulos.                                 | Confirmado     | `JornadaDatosGeneralesModel`.                            |
| Fecha se presenta con `input type="date"`.                                                             | Decisión de UI | `JornadaDatosGenerales.vue`.                             |
| Operador y equipo muestran una opción inicial de selección nula.                                       | Decisión de UI | `JornadaDatosGenerales.vue`.                             |
| Área es de solo lectura.                                                                               | Confirmado     | `JornadaDatosGenerales.vue`.                             |
| No existe en el composable una validación que exija fecha, operador, equipo o área antes de finalizar. | Confirmado     | `validarContinuidad` valida solo `filas`.                |
| Que estos datos sean requeridos, su formato permitido y su validación servidor.                        | Pendiente      | Verificar contrato real de Supabase y reglas de negocio. |

La fecha inicial `2026-09-12` y el área inicial `Campo` son valores de estado de la página; no constituyen una regla de validación.

## Validaciones por fila

| Regla                                                                           | Clasificación  | Resultado observable                                                       |
| ------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------- |
| Debe existir al menos una fila.                                                 | Confirmado     | `validarContinuidad` retorna `ok: false` y «Agrega al menos un registro.». |
| Cada fila debe tener inicio, fin, código y `actividadId`.                       | Confirmado     | Retorna «Completa la fila N.».                                             |
| La hora fin debe ser posterior a la hora inicio.                                | Confirmado     | Retorna «La hora fin de la fila N debe ser posterior al inicio.».          |
| La duración muestra `--:--` si faltan horas o el cálculo resulta negativo.      | Confirmado     | `JornadaFila.vue`.                                                         |
| Implemento no es exigido por la validación local de continuidad.                | Confirmado     | `implementoId` no se valida.                                               |
| Los campos de hora y código no tienen atributo `required` en el componente Vue. | Confirmado     | `JornadaFila.vue`.                                                         |
| El HTML marca visualmente horas inválidas y muestra un mensaje general.         | Ejemplo visual | `refreshRows()` del prototipo.                                             |

## Continuidad de filas

**Confirmado:** para cada fila posterior a la primera, `fin` de la fila previa debe coincidir exactamente con `inicio` de la fila actual. Si no coinciden, el resultado es inválido con el mensaje «Existe un espacio o solapamiento entre las filas N y N+1.».

**Confirmado:** al agregar una fila, su `inicio` toma el `fin` de la última fila; si no hay filas, toma `06:00`. También hereda el implemento de la última fila cuando exista. Esta inicialización no impide que el usuario cambie los valores después.

**Ejemplo visual:** el HTML agrupa espacio, solapamiento y hora inválida en un único aviso visual.

**Pendiente:** límites de jornada, zona horaria, cruces de medianoche, precisión admitida y si la continuidad debe evaluarse en backend.

## Resolución de código

**Confirmado:** al cambiar el código, primero se busca una labor activa cuyo `orden` sea igual al código; si no se encuentra, se busca un tipo de parada activo con el mismo `orden`.

**Confirmado:** una coincidencia establece `tipoActividad`, `actividadId` y `actividadNombre`; una no coincidencia limpia los dos primeros valores y presenta «Código no reconocido». El campo de labor/causa es de solo lectura.

**Confirmado:** la validación de continuidad exige `actividadId`, por lo que un código vacío o no reconocido deja la fila inválida.

**Ejemplo visual:** el HTML rellena a tres dígitos y aplica `setCustomValidity` para un código no reconocido. Esa normalización y esa validación nativa no están implementadas en `JornadaFila.vue`.

**Pendiente:** unicidad de `orden` entre labores y paradas, precedencia autorizada por negocio, formato/rango de código y validación de catálogo en backend.

## Validaciones de implementos

| Regla o comportamiento                                                                                                                      | Clasificación  |
| ------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| El selector permite ausencia de implemento (`null`), un implemento existente o la opción temporal `__nuevo__`.                              | Confirmado     |
| Seleccionar `__nuevo__` restaura el valor del selector y emite la solicitud de crear implemento.                                            | Confirmado     |
| El formulario local exige número no vacío tras `trim()` y tipo de implemento; también usa `required` en ambos controles.                    | Confirmado     |
| Al emitir, el número se normaliza localmente con `trim().toUpperCase()` y el nombre vacío se convierte en `null`.                           | Confirmado     |
| Tras una respuesta con `implemento`, la página evita duplicar localmente el mismo `id`, lo agrega al catálogo y lo asigna a la fila activa. | Confirmado     |
| El tipo `ImplementoOption` contiene `activo`, pero el selector Vue no filtra las opciones por ese campo.                                    | Confirmado     |
| Mostrar una previsualización, restaurar la selección al cancelar y tratar el registro existente como respuesta del RPC.                     | Ejemplo visual |
| Unicidad de número, formato, permiso para crear, catálogo válido de tipos y respuesta del registro.                                         | Pendiente      |

## Estados de carga y acciones

| Acción/estado                                                                                                                        | Clasificación | Comportamiento observable                       |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ----------------------------------------------- |
| `guardando` inicia en `false`.                                                                                                       | Confirmado    | `useJornadaAdmin`.                              |
| `finalizarDesdeFilas` no activa carga si falla la validación previa.                                                                 | Confirmado    | Lanza antes de asignar `guardando = true`.      |
| Tras superar la validación, activa `guardando`, limpia `error` y lo restablece en `finally`.                                         | Confirmado    | Composable.                                     |
| Finalizar está deshabilitado si la continuidad es inválida o si `guardando` es verdadero.                                            | Confirmado    | `JornadaAcciones.vue`.                          |
| Guardar borrador solo está deshabilitado mientras `guardando` es verdadero.                                                          | Confirmado    | `JornadaAcciones.vue`.                          |
| La acción guardar emite un evento, pero la página le asigna una función vacía.                                                       | Confirmado    | `RegistroJornadaPage.vue`.                      |
| La finalización actualmente lanza el error «Pendiente conectar la secuencia de filas a los RPC administrativos en este composable.». | Confirmado    | Implementación actual de `finalizarDesdeFilas`. |
| Indicador visual de carga, guardado de borrador y ejecución efectiva de la secuencia de RPC.                                         | Pendiente     | Requieren implementación/contrato real.         |

## Estados de error

**Confirmado:** el composable conserva `error: string | null`. En `finalizarDesdeFilas`, cualquier error capturado se convierte a mensaje si es una instancia de `Error`; de otro modo usa «Error desconocido», lo vuelve a lanzar y finalmente desactiva `guardando`.

**Confirmado:** `RegistroJornadaPage.vue` no extrae ni presenta `error`; por tanto, no hay estado visual implementado para ese error en la pantalla.

**Confirmado:** el flujo de creación de implemento espera `registrarImplemento` sin un `try/catch` local. No hay mensaje ni estado de carga visual implementado para un rechazo.

**Ejemplo visual:** el HTML usa estados visuales de éxito, advertencia y código no reconocido. No demuestra errores de Supabase.

**Pendiente:** tipología, textos, mapeo, recuperabilidad y presentación de errores de backend, red o catálogo.

## Validaciones de backend pendientes

No se confirma ninguna validación backend desde los archivos permitidos. Deben verificarse contra el contrato real de Supabase y las reglas de negocio, como mínimo:

- datos generales obligatorios y valores permitidos;
- existencia, actividad y autorización de operador, equipo, área, actividades, implementos y tipos;
- continuidad, solapamientos, duración, fecha operativa y manejo de medianoche;
- correspondencia entre código, actividad y catálogo;
- creación o reutilización de implementos;
- estados permitidos de jornada y validaciones previas a cada operación;
- comportamiento ante duplicados, concurrencia, fallos parciales, reintentos e idempotencia.

## RPC involucrados

Todos los siguientes nombres aparecen expresamente en archivos fuente. **Cada uno es un RPC mencionado; contrato pendiente de verificar.** No se deducen parámetros, payloads, respuestas ni comportamiento a partir de su nombre.

| RPC                                     | Clasificación de evidencia                         | Aparición expresa              |
| --------------------------------------- | -------------------------------------------------- | ------------------------------ |
| `rpc_admin_listar_operadores`           | Confirmado como llamada fuente; contrato pendiente | Servicio y componentes/página. |
| `rpc_obtener_catalogos_offline`         | Confirmado como llamada fuente; contrato pendiente | Servicio.                      |
| `rpc_admin_obtener_jornada`             | Confirmado como llamada fuente; contrato pendiente | Servicio.                      |
| `rpc_admin_iniciar_jornada`             | Confirmado como llamada fuente; contrato pendiente | Servicio, página y composable. |
| `rpc_admin_cambiar_labor`               | Confirmado como llamada fuente; contrato pendiente | Servicio, página y composable. |
| `rpc_admin_registrar_parada`            | Confirmado como llamada fuente; contrato pendiente | Servicio, página y composable. |
| `rpc_admin_cambiar_tipo_parada`         | Confirmado como llamada fuente; contrato pendiente | Servicio, página y composable. |
| `rpc_admin_reanudar_trabajo`            | Confirmado como llamada fuente; contrato pendiente | Servicio, página y composable. |
| `rpc_admin_confirmar_cambio_implemento` | Confirmado como llamada fuente; contrato pendiente | Servicio, página y composable. |
| `rpc_admin_finalizar_jornada`           | Confirmado como llamada fuente; contrato pendiente | Servicio, página y composable. |
| `rpc_admin_deshacer_ultimo_evento`      | Confirmado como llamada fuente; contrato pendiente | Servicio.                      |
| `rpc_admin_registrar_implemento`        | Confirmado como llamada fuente; contrato pendiente | Servicio, página y panel.      |
| `rpc_admin_confirmar_cambio_equipo`     | Ejemplo visual; contrato pendiente                 | Solo HTML.                     |

El servicio pasa argumentos locales a algunos RPC, incluido el de registrar implemento, pero sin un contrato real de Supabase no se confirma que esos argumentos sean el contrato vigente ni cuál sea la respuesta.

## Responsive

**Confirmado:** en tamaños base se muestran datos generales en una o dos columnas y las filas como tarjetas; desde `md` la tabla se muestra con una grilla de columnas y desplazamiento horizontal cuando corresponde.

**Confirmado:** las acciones son apiladas y fijas al borde inferior en móvil; desde `md` pasan a disposición horizontal y estática.

**Confirmado:** el panel de implemento es un bottom sheet en pantallas base y un drawer lateral desde `md`.

**Pendiente:** validación de accesibilidad, foco, mensajes de error y estados deshabilitados en cada breakpoint mediante pruebas reales.

## Criterios de aceptación

- La UI impide finalizar cuando no hay filas, una fila está incompleta, su fin no es posterior a su inicio, o dos filas consecutivas no son continuas.
- Una fila con código no reconocido no obtiene `actividadId` y no supera la validación local.
- La resolución local busca primero labor activa y luego parada activa.
- Crear implemento exige localmente número y tipo, normaliza el número y asigna el implemento devuelto solo si hay fila activa y objeto `implemento` disponible.
- Mientras `guardando` es verdadero, las dos acciones están deshabilitadas; finalizar además requiere validación válida.
- Los errores conocidos del composable se guardan en `error`, sin afirmar que estén visibles en la UI.
- Cualquier regla de backend queda marcada como pendiente hasta contrastarla con Supabase o negocio.

## Casos límite

| Caso                                     | Estado documentado                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| Cero filas                               | Inválido localmente.                                                       |
| Primera fila nueva                       | Inicia en `06:00`; no confirma una hora obligatoria de negocio.            |
| Fila con fin igual al inicio             | Inválida, pues el fin debe ser posterior.                                  |
| Fila con fin anterior al inicio          | Inválida; la duración visual es `--:--`.                                   |
| Espacio o solapamiento entre filas       | Inválido si los valores no coinciden exactamente.                          |
| Código vacío o no reconocido             | Sin actividad resuelta; fila incompleta para la validación local.          |
| Catálogo con código repetido             | La búsqueda prioriza labor, pero la validez de esa situación es pendiente. |
| Implemento vacío                         | Permitido por la validación local de filas.                                |
| Registro de implemento sin número o tipo | No emite creación desde el panel.                                          |
| Error al finalizar o crear implemento    | Sin presentación de error implementada en la página para ambos flujos.     |

## Pendientes / preguntas abiertas

1. Verificar en Supabase los contratos vigentes de todos los RPC listados, especialmente parámetros, respuestas y errores.
2. Confirmar qué datos generales son obligatorios y cómo se determina el área.
3. Definir reglas de negocio para jornadas que crucen medianoche, precisión de hora y duración máxima.
4. Confirmar si una parada puede iniciar una jornada y qué transiciones son válidas; el HTML solo las plantea conceptualmente.
5. Determinar la validación backend de códigos y el tratamiento de catálogos inactivos o con órdenes duplicados.
6. Definir el comportamiento de guardado de borrador, actualmente sin implementación conectada.
7. Acordar presentación, recuperación y accesibilidad de errores de red/backend.
8. Verificar política de duplicados y creación de implementos con una fuente real de negocio/Supabase.

## Tabla de trazabilidad

| Tema                                  | Evidencia                                             | Clasificación                                       | Sección                                    |
| ------------------------------------- | ----------------------------------------------------- | --------------------------------------------------- | ------------------------------------------ |
| Estado de datos generales y filas     | `registroJornada.types.ts`                            | Confirmado                                          | Validaciones de datos generales / por fila |
| Continuidad y error local             | `composables/useJornadaAdmin.ts`                      | Confirmado                                          | Continuidad / estados de error             |
| Resolución labor antes que parada     | `useJornadaAdmin.ts`, `JornadaFila.vue`               | Confirmado                                          | Resolución de código                       |
| Alta y asignación local de implemento | `ImplementoCrearPanel.vue`, `RegistroJornadaPage.vue` | Confirmado                                          | Validaciones de implementos                |
| Acciones y bloqueo por carga          | `JornadaAcciones.vue`, `RegistroJornadaPage.vue`      | Confirmado                                          | Estados de carga y acciones                |
| Nombres de RPC                        | `registroJornada.service.ts`                          | Confirmado como llamadas fuente; contrato pendiente | RPC involucrados                           |
| Avisos, normalización y simulaciones  | `registro_jornada_integracion_completa.html`          | Ejemplo visual                                      | Resolución, errores y casos límite         |
