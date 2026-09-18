# SPEC-07 — Borradores, recuperación y correcciones

## Objetivo

Documentar la evidencia disponible para guardar borradores, recuperar una jornada, corregir filas y deshacer o ajustar eventos administrativos, sin definir comportamiento de backend que no esté documentado.

## Alcance

- Acción visual de guardar borrador y su propagación entre componentes.
- Estado local de la jornada y de sus filas.
- Lectura y recuperación mencionada de una jornada.
- Correcciones locales de filas y la mención de deshacer eventos.
- Validaciones, errores, responsive e integración visible en las fuentes.

## Fuera de alcance

- Implementar persistencia, migraciones, RPC, componentes o flujos de recuperación.
- Definir qué constituye un borrador en Supabase, cómo se lista o su ciclo de vida.
- Definir contratos RPC, payloads, respuestas, errores backend, transacciones, idempotencia o reintentos.
- Inferir cómo se reconstruye, edita o reanuda una jornada recuperada.

## Fuentes

- **Tipos TypeScript:** `registroJornada.types.ts` define `JornadaState` y `JornadaFilaModel`.
- **Composable:** `composables/useJornadaAdmin.ts` contiene validación local, estado `guardando`/`error` y un punto de integración pendiente.
- **Servicio:** `services/registroJornada.service.ts` centraliza llamadas frontend a `supabase.rpc(...)`.
- **Página:** `RegistroJornadaPage.vue` posee el estado reactivo de la jornada y conecta las acciones.
- **Componentes:** `JornadaAcciones.vue`, `JornadaDetalle.vue` y `JornadaFila.vue` presentan y modifican la UI local.
- **HTML:** `registro_jornada_integracion_completa.html` aporta ejemplos visuales y comentarios conceptuales; no es contrato de Supabase.

No se identificó en las fuentes permitidas un contrato real de Supabase.

## Clasificación de evidencia

| Clasificación | Uso en esta SPEC |
| --- | --- |
| Confirmado | Código TypeScript/Vue actualmente presente en las fuentes permitidas. |
| Decisión de UI | Comportamiento expuesto por la interfaz o por eventos de componentes, sin persistencia confirmada. |
| Ejemplo visual | Referencia o comentario del HTML; no confirma contrato ni ejecución. |
| Pendiente | Información ausente que debe verificarse en una fuente real de Supabase o con negocio. |

## Estado actual de borradores

- **Decisión de UI:** `JornadaAcciones.vue` muestra el botón **Guardar borrador** y emite `guardar`.
- **Confirmado:** `RegistroJornadaPage.vue` recibe ese evento con `@guardar="() => {}"`; la acción no ejecuta lógica en el código disponible.
- **Confirmado:** la pantalla mantiene localmente `fecha`, `operadorId`, `equipoNumero`, `area`, `observaciones` y `filas` en `JornadaState`.
- **Ejemplo visual:** el HTML presenta la acción Guardar borrador y describe una API sugerida con `cargarBorrador` y `guardarDesdeFilas`.
- **Pendiente:** no existe evidencia de persistencia de borrador, identificación de borrador, listado, guardado automático, conservación al salir ni estado backend.

## Recuperación de jornada

- **Confirmado:** el servicio expone `obtenerJornada(p_jornada_id: string)` y llama a `rpc_admin_obtener_jornada` enviando un objeto con `p_jornada_id`.
- **Ejemplo visual:** el HTML indica que `rpc_admin_obtener_jornada` se usaría para reconstruir o recuperar borradores.
- **Pendiente:** verificar el contrato real de Supabase de `rpc_admin_obtener_jornada`, incluidos sus parámetros, respuesta, errores y si aplica a borradores.
- **Pendiente:** no hay código que invoque `obtenerJornada`, asigne una respuesta a `JornadaState`, habilite edición ni reanude una jornada.

## Corrección de filas

- **Confirmado:** `JornadaFila.vue` permite modificar localmente inicio, fin, código e implemento mediante el modelo de la fila; al cambiar el código, resuelve localmente labor o parada desde catálogos activos.
- **Confirmado:** `JornadaDetalle.vue` agrega una fila local con `idLocal` generado en cliente y elimina una fila local mediante `splice`.
- **Confirmado:** las correcciones locales actualizan el estado reactivo `jornada.filas` de la página.
- **Pendiente:** no hay evidencia de persistencia de modificaciones, de corrección de filas ya registradas ni de mapeo entre una fila local y un evento administrativo persistido.

## Deshacer eventos

- **Confirmado:** el servicio expone `deshacerUltimoEvento(payload)` y menciona `rpc_admin_deshacer_ultimo_evento`.
- **Ejemplo visual:** el HTML dice que ese RPC puede usarse para correcciones secuenciales.
- **Pendiente:** RPC mencionado; contrato pendiente de verificar. Deben verificarse en Supabase sus parámetros, respuesta, errores, alcance y efecto sobre eventos.
- **Pendiente:** no hay control de UI, llamada desde página o composable, ni sincronización local posterior a deshacer.

## Contrato entre componentes, composable y servicio

- **Confirmado:** `JornadaAcciones` emite `guardar` y `finalizar`; la página conecta `guardar` a una función vacía y `finalizar` a `finalizarDesdeFilas(jornada)`.
- **Confirmado:** `JornadaDetalle` edita `filas` mediante `v-model:filas`, y cada `JornadaFila` modifica su `JornadaFilaModel` mediante `v-model`.
- **Confirmado:** el composable expone `validarContinuidad`, `resolverCodigo`, `registrarImplemento`, `finalizarDesdeFilas`, `guardando` y `error`.
- **Confirmado:** el servicio es el único archivo disponible que llama `supabase.rpc(...)`.
- **Pendiente:** definir el contrato de un flujo de guardado y recuperación de borradores entre página, composable y servicio, una vez exista fuente real de Supabase y decisión de negocio.

## RPC involucrados

No hay contrato real de Supabase disponible. Todos los RPC siguientes aparecen expresamente en archivos fuente y su clasificación es **RPC mencionado; contrato pendiente de verificar**.

| RPC | Evidencia de fuente |
| --- | --- |
| `rpc_admin_listar_operadores` | Servicio, página, componentes y HTML. |
| `rpc_obtener_catalogos_offline` | Servicio y HTML. |
| `rpc_admin_obtener_jornada` | Servicio, página y HTML. |
| `rpc_admin_iniciar_jornada` | Servicio, composable, página, componente y HTML. |
| `rpc_admin_cambiar_labor` | Servicio, composable, página, componente y HTML. |
| `rpc_admin_registrar_parada` | Servicio, composable, página, componente y HTML. |
| `rpc_admin_cambiar_tipo_parada` | Servicio, composable, página, componente y HTML. |
| `rpc_admin_reanudar_trabajo` | Servicio, composable, página, componente y HTML. |
| `rpc_admin_confirmar_cambio_implemento` | Servicio, composable, página, componente y HTML. |
| `rpc_admin_finalizar_jornada` | Servicio, composable, página, componente y HTML. |
| `rpc_admin_deshacer_ultimo_evento` | Servicio y HTML. |
| `rpc_admin_registrar_implemento` | Servicio, página, componente y HTML. |
| `rpc_admin_confirmar_cambio_equipo` | HTML solamente. |

## Validaciones

- **Confirmado:** `validarContinuidad` exige al menos una fila, inicio, fin, código y `actividadId` en cada fila.
- **Confirmado:** la hora de fin debe ser posterior a la de inicio y cada fila posterior debe iniciar exactamente al terminar la anterior.
- **Confirmado:** al editar el código, un código no reconocido deja `tipoActividad` y `actividadId` en `null`.
- **Decisión de UI:** el botón Finalizar y registrar se deshabilita si la secuencia no es válida o si `guardando` es verdadero; Guardar borrador se deshabilita mientras `guardando` sea verdadero.
- **Pendiente:** no hay validaciones específicas para guardar, recuperar, corregir una fila persistida o deshacer.

## Estados de error

- **Confirmado:** el composable mantiene `error` como texto nullable y restablece su valor antes de finalizar.
- **Confirmado:** `finalizarDesdeFilas` lanza un error de validación local si la continuidad no es válida y, actualmente, lanza un error indicando que falta conectar la secuencia administrativa.
- **Confirmado:** `registrarImplemento` relanza `rpcError` cuando el servicio lo devuelve.
- **Pendiente:** no hay estados ni mensajes definidos para borradores, recuperación, corrección persistida o deshacer; deben verificarse con el contrato real de Supabase y negocio.

## Idempotencia y reintentos

- **Pendiente:** las fuentes permitidas no documentan idempotencia, claves de deduplicación, reintentos, manejo de doble clic ni recuperación tras fallo de red para borradores, recuperación, correcciones o deshacer.
- **Pendiente:** verificar estos aspectos en los contratos reales de Supabase y con negocio antes de definir el comportamiento de cliente.

## Responsive

- **Confirmado:** el detalle se muestra como tarjetas en tamaños pequeños y como tabla desde `md`; el contenedor permite desplazamiento horizontal en escritorio.
- **Confirmado:** las acciones son columna en tamaños pequeños y fila desde `md`; permanecen fijas en la parte inferior en móvil.
- **Decisión de UI:** Guardar borrador y Finalizar y registrar se muestran juntos en la barra de acciones en ambos formatos.
- **Pendiente:** no hay vistas de recuperación o deshacer cuya adaptación responsive pueda documentarse.

## Criterios de aceptación

- La acción Guardar borrador debe permanecer identificada como decisión de UI hasta contar con persistencia confirmada.
- La recuperación solo puede especificarse a partir de un contrato real de `rpc_admin_obtener_jornada` o de otra fuente real aprobada.
- Las correcciones locales de filas deben diferenciarse de cualquier cambio persistido.
- El deshacer debe conservar la clasificación «RPC mencionado; contrato pendiente de verificar» hasta disponer del contrato de Supabase.
- No deben añadirse supuestos sobre RPC, persistencia, errores, orden transaccional, idempotencia ni reintentos.

## Casos límite

- **Confirmado:** no hay filas, una fila incompleta, fin anterior o igual al inicio, y huecos o solapamientos entre filas producen invalidación local.
- **Confirmado:** un código no reconocido no resuelve actividad localmente.
- **Confirmado:** eliminar una fila modifica solo la colección local.
- **Pendiente:** definir el comportamiento ante salida sin guardar, borrador inexistente, jornada no recuperable, edición concurrente, fallo de red y deshacer sin evento aplicable.

## Pendientes / preguntas abiertas

- Verificar en Supabase el contrato de `rpc_admin_obtener_jornada` y si soporta recuperación de borradores.
- Determinar con negocio qué condición convierte una jornada en borrador y cómo se identifica, lista, conserva o descarta.
- Verificar en Supabase el contrato de `rpc_admin_deshacer_ultimo_evento` y acordar con negocio cuándo puede invocarse.
- Definir con negocio y Supabase cómo se persisten correcciones de filas y qué relación existe entre filas locales y eventos administrativos.
- Verificar contratos, errores y efectos de los demás RPC mencionados antes de asociarlos a guardado o corrección.
- Definir idempotencia, reintentos y manejo de concurrencia con fuentes reales.

## Tabla de trazabilidad

| Tema | Clasificación | Evidencia | Limitación / verificación requerida |
| --- | --- | --- | --- |
| Guardar borrador | Decisión de UI | Botón y emit `guardar` en `JornadaAcciones.vue`. | La página lo conecta a una función vacía; no hay persistencia. |
| Estado editable | Confirmado | `JornadaState` y `jornada` reactivo en tipos y página. | No prueba almacenamiento ni recuperación. |
| Recuperación | Confirmado / Ejemplo visual | Método `obtenerJornada` en servicio; HTML lo asocia a recuperar borradores. | Verificar contrato real y flujo de carga. |
| Corrección local | Confirmado | `v-model` de fila, adición y `splice` en componentes. | No hay cambio persistido. |
| Deshacer | Confirmado / Ejemplo visual | Método de servicio y comentario del HTML. | RPC mencionado; contrato pendiente de verificar. |
| Validación de continuidad | Confirmado | `validarContinuidad` en composable. | Solo cubre estado local. |
| Idempotencia y reintentos | Pendiente | No hay evidencia en las fuentes permitidas. | Verificar Supabase y decisión de negocio. |
