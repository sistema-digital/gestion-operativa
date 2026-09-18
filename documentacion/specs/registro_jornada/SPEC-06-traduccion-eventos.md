# SPEC-06 — Traducción de filas a eventos administrativos

## Objetivo

Documentar la traducción prevista de las filas válidas de una jornada administrativa a eventos administrativos, manteniendo esa decisión centralizada en `useJornadaAdmin.ts`.

**Confirmado:** el composable declara esa responsabilidad y `finalizarDesdeFilas` es el punto de integración invocado al finalizar la jornada.

## Alcance

- Validación de continuidad previa a finalizar.
- Resolución de cada código de fila como labor o parada mediante catálogos del frontend.
- Máquina de transición prevista entre filas consecutivas.
- Referencias a los RPC administrativos mencionados por las fuentes.
- Separación de responsabilidades entre componentes, página, composable y servicio.

## Fuera de alcance

- Implementar código, migraciones, RPC o componentes.
- Definir firmas, parámetros, payloads, respuestas, tablas, columnas o errores de backend.
- Definir el contrato de Supabase, el orden transaccional, idempotencia o reintentos.
- Registro de implementos nuevos; las fuentes lo separan en `rpc_admin_registrar_implemento`.
- Persistencia de borradores, recuperación, correcciones o deshacer eventos.

## Fuentes

Solo se usaron los siguientes archivos de `documentacion/formulario_captura_padas/`:

- `INDEX_SPECS.md`
- `README.md`
- `registroJornada.types.ts`
- `RegistroJornadaPage.vue`
- `composables/useJornadaAdmin.ts`
- `services/registroJornada.service.ts`
- `components/JornadaFila.vue`
- `components/JornadaDetalle.vue`
- `components/JornadaAcciones.vue`

No se usó ninguna SPEC existente como fuente.

## Clasificación de evidencia

- **Confirmado:** comportamiento, tipo o relación expresamente presentes en los archivos fuente permitidos.
- **Decisión de UI:** comportamiento de interacción o presentación expresamente definido por los componentes; no constituye contrato de backend.
- **Ejemplo visual:** referencia de presentación o estructura visual; no se usa para inferir persistencia.
- **Pendiente:** información necesaria que no aparece en las fuentes permitidas y debe verificarse en una fuente real.

No se proporcionó un contrato real de Supabase entre las fuentes autorizadas. Por prioridad de evidencia, todos los RPC de esta SPEC son **RPC mencionado; contrato pendiente de verificar**.

## Precondiciones para persistir

**Confirmado:** `finalizarDesdeFilas` ejecuta `validarContinuidad` antes de iniciar su flujo y lanza un error si la validación no es correcta.

**Confirmado:** la validación exige al menos una fila; para cada fila exige `inicio`, `fin`, `codigo` y `actividadId`; exige que `fin` sea posterior a `inicio`; y exige que el fin de una fila coincida exactamente con el inicio de la siguiente.

**Confirmado:** `actividadId` se resuelve por código: se busca primero una labor activa cuyo `orden` coincida; si no existe, una parada activa cuyo `orden` coincida. Un código no reconocido deja la actividad sin resolver.

**Pendiente:** verificar en el contrato real de Supabase qué datos generales de la jornada, datos de fila y contexto de sesión requiere cada RPC antes de persistir.

## Máquina de transición

**Confirmado:** el comentario de `useJornadaAdmin.ts` enumera la traducción prevista: primera fila a inicio de jornada; labor a labor; labor a parada; parada a labor; parada a parada; cambio de implemento; y fin de jornada.

**Confirmado:** esa traducción no está implementada: el método deja una excepción explícita indicando que falta conectar la secuencia de filas a los RPC administrativos.

**Pendiente:** verificar con el contrato real de Supabase y la regla de negocio si la primera fila siempre debe ser labor, cómo se determina el estado previo inicial y qué campos de cada fila intervienen en cada transición.

## Matriz de transiciones y RPC

| actividad anterior | actividad actual | condición | efecto esperado | RPC mencionado en fuentes | evidencia | datos pendientes por confirmar |
| --- | --- | --- | --- | --- | --- | --- |
| Sin fila previa | labor o parada | Primera fila válida de la jornada | Iniciar la jornada antes de procesar las demás transiciones. | `rpc_admin_iniciar_jornada` — RPC mencionado; contrato pendiente de verificar. | Confirmado: comentario de `useJornadaAdmin.ts`. | Actividad inicial admitida; payload; respuesta; identificador de jornada; estado generado. |
| labor | labor | Dos filas consecutivas resueltas como labor | Traducir la transición como cambio de labor. | `rpc_admin_cambiar_labor` — RPC mencionado; contrato pendiente de verificar. | Confirmado: comentario de `useJornadaAdmin.ts`. | Cómo distinguir misma labor de labor distinta; payload; efecto si no hay cambio material. |
| labor | parada | Dos filas consecutivas resueltas respectivamente como labor y parada | Registrar una parada. | `rpc_admin_registrar_parada` — RPC mencionado; contrato pendiente de verificar. | Confirmado: comentario de `useJornadaAdmin.ts`. | Cierre o continuidad de la labor; payload; hora efectiva; respuesta. |
| parada | labor | Dos filas consecutivas resueltas respectivamente como parada y labor | Reanudar trabajo. | `rpc_admin_reanudar_trabajo` — RPC mencionado; contrato pendiente de verificar. | Confirmado: comentario de `useJornadaAdmin.ts`. | Relación con la parada previa; labor que se reanuda; payload; respuesta. |
| parada | parada | Dos filas consecutivas resueltas como parada | Cambiar el tipo de parada. | `rpc_admin_cambiar_tipo_parada` — RPC mencionado; contrato pendiente de verificar. | Confirmado: comentario de `useJornadaAdmin.ts`. | Tratamiento de la misma causa; efecto de `libera_labor_actual`; payload; respuesta. |
| Cualquier actividad | Cualquier actividad | Cambio de implemento que deba confirmarse durante la secuencia | Confirmar el cambio de implemento. | `rpc_admin_confirmar_cambio_implemento` — RPC mencionado; contrato pendiente de verificar. | Confirmado: comentario de `useJornadaAdmin.ts`; cada fila contiene `implementoId`. | Regla exacta que define el cambio, comparación con la fila previa, momento de aplicación y payload. |
| Última actividad | Sin actividad siguiente | Fin de una jornada válida | Finalizar la jornada. | `rpc_admin_finalizar_jornada` — RPC mencionado; contrato pendiente de verificar. | Confirmado: comentario de `useJornadaAdmin.ts` y emisión de `finalizar` desde `JornadaAcciones.vue`. | Payload; cierre de eventos activos; observaciones; respuesta y estado final. |

## Cambio de implemento

**Confirmado:** `JornadaFilaModel` contiene `implementoId`; al agregar una fila, `JornadaDetalle.vue` hereda el implemento de la última fila cuando existe. La fila permite cambiar ese valor mediante `ImplementoSelect`.

**Confirmado:** las fuentes nombran `rpc_admin_confirmar_cambio_implemento` como parte de la traducción de filas a eventos.

**Pendiente:** no hay lógica implementada que compare implementos consecutivos ni contrato que establezca cuándo, con qué hora o con qué datos debe invocarse el RPC. Debe verificarse en el contrato real de Supabase y con negocio.

## Secuencia y orden de persistencia

**Confirmado:** la arquitectura prevista es componentes visuales → `RegistroJornadaPage.vue` → `useJornadaAdmin.ts` → `registroJornada.service.ts` → RPC de Supabase. Los componentes visuales no llaman Supabase directamente.

**Confirmado:** el orden listado como intención en el composable inicia la jornada, procesa las transiciones aplicables entre filas, confirma cambios de implemento cuando corresponda y finaliza la jornada.

**Pendiente:** no hay implementación de esa secuencia ni evidencia de orden transaccional, atomicidad o comportamiento ante ejecución parcial. Debe verificarse en el contrato real de Supabase y en las reglas de negocio.

## Contrato entre componentes, composable y servicio

**Confirmado:** `JornadaAcciones.vue` solo emite `guardar` y `finalizar`; la página conecta `finalizar` con `finalizarDesdeFilas(jornada)`.

**Confirmado:** `JornadaDetalle.vue` gestiona agregar, eliminar y enlazar las filas; `JornadaFila.vue` resuelve el código y muestra la actividad resultante. Ninguno declara RPC directo.

**Confirmado:** `useJornadaAdmin.ts` expone `validarContinuidad`, `resolverCodigo`, `registrarImplemento` y `finalizarDesdeFilas`; el servicio es el único lugar que declara llamadas a `supabase.rpc(...)`.

**Pendiente:** el servicio acepta `Record<string, unknown>` para los payloads de los RPC de jornada. Esto no constituye una firma de RPC; deben verificarse y tiparse contra el contrato real de Supabase.

## RPC involucrados

Los siguientes aparecen solo como referencias en las fuentes y se clasifican como **RPC mencionado; contrato pendiente de verificar**:

- `rpc_admin_iniciar_jornada`
- `rpc_admin_cambiar_labor`
- `rpc_admin_registrar_parada`
- `rpc_admin_cambiar_tipo_parada`
- `rpc_admin_reanudar_trabajo`
- `rpc_admin_confirmar_cambio_implemento`
- `rpc_admin_finalizar_jornada`

## Validaciones

**Confirmado:** el botón de finalizar se deshabilita si la validación de continuidad no es correcta o si `guardando` es verdadero.

**Confirmado:** la validación frontend no exige explícitamente `tipoActividad` ni `implementoId`; sí exige que exista `actividadId`.

**Pendiente:** validaciones de backend, reglas de fecha, operador, equipo, área, implemento y observaciones. Verificar en el contrato real de Supabase y reglas de negocio.

## Estados de error

**Confirmado:** el composable expone `error`, lo reinicia antes del intento y almacena el mensaje de un `Error`; cuando el valor capturado no es `Error`, usa el texto `Error desconocido`.

**Confirmado:** mientras la traducción no esté implementada, `finalizarDesdeFilas` produce un error indicando que la conexión de filas a RPC está pendiente.

**Pendiente:** códigos, mensajes y clasificación de errores del backend; recuperación ante fallo parcial; y presentación de `error` en la página. Verificar en el contrato real de Supabase y la decisión de UX.

## Idempotencia y reintentos

**Pendiente:** las fuentes no definen idempotencia, claves de deduplicación, reintentos automáticos o manuales, ni tratamiento de solicitudes repetidas. Verificar el contrato real de Supabase y las reglas de negocio antes de diseñarlos.

## Responsive

**Decisión de UI:** `JornadaFila.vue` presenta filas en cuadrícula de tarjetas en tamaños pequeños y en formato tabular desde `md`; `JornadaDetalle.vue` oculta el encabezado tabular en móvil y permite desbordamiento horizontal en escritorio.

**Decisión de UI:** `JornadaAcciones.vue` usa un pie fijo inferior en móvil y un diseño estático horizontal desde `md`.

**Pendiente:** no hay comportamiento responsive específico para el proceso de persistencia ni para estados de error en las fuentes permitidas.

## Criterios de aceptación

- **Confirmado:** una jornada no puede pasar a `finalizarDesdeFilas` con cero filas, filas incompletas, intervalos inválidos, huecos o solapamientos según `validarContinuidad`.
- **Confirmado:** un código válido resuelve primero una labor activa y, solo si no existe, una parada activa; un código no reconocido no aporta `actividadId` válido.
- **Confirmado:** la decisión de RPC para las transiciones se concentra en `useJornadaAdmin.ts`, no en componentes visuales.
- **Confirmado:** las siete referencias de transición de la matriz permanecen documentadas como RPC mencionados con contrato pendiente de verificar.
- **Pendiente:** la aceptación de persistencia real debe completarse después de verificar los contratos de Supabase y aprobar la secuencia de negocio.

## Casos límite

- **Confirmado:** no hay filas.
- **Confirmado:** falta inicio, fin, código o actividad resuelta en una fila.
- **Confirmado:** la hora final no es posterior a la inicial.
- **Confirmado:** hay hueco o solapamiento entre dos filas.
- **Confirmado:** el código no coincide con una labor o parada activa.
- **Pendiente:** primera fila de parada; filas consecutivas con la misma labor, la misma parada o el mismo implemento; cambio de implemento sin cambio de actividad; cambio de actividad sin implemento; y efecto de `libera_labor_actual`. Requieren verificación de negocio y contrato real de Supabase.

## Pendientes / preguntas abiertas

1. Verificar los contratos reales de Supabase de los siete RPC: firma, parámetros, payload, respuesta, errores y efectos.
2. Confirmar el estado administrativo inicial y si una primera fila de parada es válida.
3. Confirmar cuándo una diferencia entre `implementoId` consecutivos obliga a ejecutar el RPC de cambio de implemento.
4. Definir el tratamiento de transiciones sin cambio material, como labor a la misma labor o parada al mismo tipo de parada.
5. Confirmar el efecto de `TipoParadaCatalogo.libera_labor_actual` en la máquina de transición.
6. Definir atomicidad, orden transaccional, ejecución parcial, idempotencia y reintentos.
7. Confirmar los datos generales y las observaciones que deben acompañar el inicio y la finalización.

## Tabla de trazabilidad

| Elemento | Clasificación | Fuente permitida | Trazabilidad |
| --- | --- | --- | --- |
| Flujo UI → página → composable → servicio → Supabase RPC | Confirmado | `INDEX_SPECS.md`, `README.md` | Principio de integración declarado. |
| Modelo de fila y `tipoActividad` | Confirmado | `registroJornada.types.ts` | `JornadaFilaModel` define inicio, fin, código, actividad e implemento. |
| Resolución labor antes que parada | Confirmado | `composables/useJornadaAdmin.ts`, `components/JornadaFila.vue` | Búsqueda por `orden` y estado activo. |
| Validación de continuidad | Confirmado | `composables/useJornadaAdmin.ts` | Reglas de existencia, orden y contigüidad. |
| Inicio, cuatro transiciones, cambio de implemento y finalización | Confirmado | `composables/useJornadaAdmin.ts`, `components/JornadaAcciones.vue` | Lista de traducción prevista; implementación pendiente. |
| RPC y sus contratos | Pendiente | `services/registroJornada.service.ts` | Solo se observan nombres de RPC y payloads genéricos para jornada. |
| Cambio de implemento por filas | Confirmado / Pendiente | `registroJornada.types.ts`, `components/JornadaDetalle.vue`, `composables/useJornadaAdmin.ts` | Existe `implementoId` y un RPC mencionado; falta regla de comparación y contrato. |
| Adaptación móvil | Decisión de UI | `components/JornadaFila.vue`, `components/JornadaDetalle.vue`, `components/JornadaAcciones.vue` | Cuadrícula/tarjetas y pie de acciones responsivos. |
