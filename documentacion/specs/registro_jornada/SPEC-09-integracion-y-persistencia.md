# SPEC-09 — Integración y persistencia

## Objetivo

Documentar la evidencia disponible de la integración para el registro administrativo de jornadas entre la página, el composable, el servicio y los RPC mencionados. Este documento no define contratos de backend ni completa comportamientos que no estén implementados o descritos explícitamente en las fuentes revisadas.

## Alcance y fuera de alcance

### Alcance

- La composición `RegistroJornadaPage.vue` → `useJornadaAdmin.ts` → `registroJornada.service.ts` → `supabase.rpc(...)`.
- El estado de pantalla, los catálogos y el flujo local de creación de implementos.
- Las acciones de guardar y finalizar según su implementación actual.
- Los RPC nombrados expresamente en las fuentes.

### Fuera de alcance

- Definir o modificar RPC, migraciones, tablas, columnas, políticas, permisos o transacciones de Supabase.
- Inferir parámetros, payloads, respuestas, errores, idempotencia, reintentos u orden de persistencia del backend.
- Implementar la secuencia administrativa de filas, la carga de catálogos, la recuperación de borradores o una UI de errores.

## Fuentes y clasificación de evidencia

| Fuente                                       | Clasificación de evidencia | Uso en esta SPEC                                                                                                                                             |
| -------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contrato real de Supabase                    | Pendiente                  | No se encontró un contrato real de Supabase dentro de las fuentes permitidas. Debe prevalecer cuando esté disponible.                                        |
| `registroJornada.types.ts`                   | Confirmado                 | Define los modelos locales de jornada, catálogos e implemento. No ejecuta RPC.                                                                               |
| `composables/useJornadaAdmin.ts`             | Confirmado                 | Implementa validación local, resolución de códigos, estado `guardando`/`error` y delegación de registro de implemento; la secuencia de filas está pendiente. |
| `services/registroJornada.service.ts`        | Confirmado                 | Contiene las invocaciones fuente a `supabase.rpc(...)`; salvo el registro de implemento, los payloads se mantienen sin tipar de dominio en la evidencia.     |
| `RegistroJornadaPage.vue` y componentes Vue  | Confirmado                 | Muestran composición, estado local, eventos y la ruta de creación de implemento.                                                                             |
| `registro_jornada_integracion_completa.html` | Ejemplo visual             | Es un prototipo/documento de arquitectura. Sus respuestas esperadas, reglas y secuencias no constituyen contrato backend confirmado.                         |

Las etiquetas de esta SPEC significan: **Confirmado** es comportamiento o estructura visible en el código fuente; **Decisión de UI** es una elección de interfaz local; **Ejemplo visual** procede únicamente del HTML; y **Pendiente** requiere una fuente real adicional.

## Arquitectura de integración

**Confirmado:** el README y el código separan las capas con el recorrido UI → página → composable → servicio → `supabase.rpc(...)`. Los componentes visuales no importan Supabase ni realizan llamadas RPC directas.

**Confirmado:** `registroJornadaService` es el único archivo fuente revisado que importa `supabase` y contiene llamadas a `supabase.rpc(...)`.

**Pendiente:** no hay evidencia de contrato real de Supabase ni de una llamada inicial efectiva desde la página para cargar operadores, equipos, catálogos o una jornada existente.

## Responsabilidades por capa

| Capa                 | Evidencia      | Responsabilidad observada                                                                                                                          |
| -------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Página               | Confirmado     | Mantiene `jornada`, operadores, equipos, catálogos, la fila activa y apertura del panel de implemento. Conecta eventos de hijos con el composable. |
| Composable           | Confirmado     | Valida continuidad, resuelve código contra catálogos, administra `guardando` y `error`, y delega el registro de implemento al servicio.            |
| Servicio             | Confirmado     | Encapsula nombres de RPC e invocaciones a `supabase.rpc(...)`.                                                                                     |
| Componentes visuales | Confirmado     | Editan/representan datos locales y emiten eventos; no llaman RPC directamente.                                                                     |
| HTML                 | Ejemplo visual | Propone responsabilidades y una secuencia; no la vuelve implementación ni contrato backend.                                                        |

## Estado y orquestación de la página

**Confirmado:** la página inicializa localmente fecha, operador, equipo, área, observaciones y filas. Mantiene listas inicialmente vacías para operadores, equipos y los cuatro grupos de catálogos.

**Confirmado:** `validacion` se calcula a partir de `validarContinuidad(jornada.filas)` y se entrega a `JornadaAcciones`.

**Confirmado:** al solicitar crear un implemento, se conserva el índice de la fila activa y se abre el panel. Tras una respuesta aceptada por la página, el elemento se agrega al catálogo local si no existe, se asigna su `id` a esa fila y se cierra el panel.

**Pendiente:** no se observa carga, hidratación, recuperación ni persistencia inicial de operadores, equipos, catálogos o borradores.

## Integración de catálogos

**Confirmado:** `CatalogosJornada` contiene labores, tipos de parada, implementos y tipos de implemento. La resolución local del código busca primero una labor activa con el mismo `orden`; si no la encuentra, busca un tipo de parada activo. Esta resolución solo transforma el estado de la fila.

**Confirmado:** el servicio contiene una invocación fuente a `rpc_obtener_catalogos_offline` y otra a `rpc_admin_listar_operadores`, pero la página no las llama en el código revisado.

**Pendiente:** verificar en Supabase el contrato, el contenido y la vigencia de ambos catálogos, así como la fuente real de equipos y la forma de derivar el área. No se debe inferir nada de los nombres de RPC.

## Integración de implementos

**Confirmado:** `ImplementoCrearPanel` valida localmente que número y tipo estén presentes, normaliza el número a mayúsculas y emite un payload local. La página llama al método `registrarImplemento` del composable, que delega al servicio.

**Confirmado:** el servicio invoca `rpc_admin_registrar_implemento` y construye tres argumentos con prefijo `p_` a partir del payload local. Esta es evidencia de la llamada fuente, no un contrato de Supabase confirmado.

**Decisión de UI:** el selector presenta “Sin implemento” y una opción temporal para abrir el panel de registro. La opción temporal no es un identificador de implemento del modelo local.

**Ejemplo visual:** el HTML ilustra una respuesta con un objeto `implemento` y un posible comportamiento para un número existente. No se toma como respuesta ni comportamiento backend confirmado.

**Pendiente:** verificar contrato real, validaciones, respuesta y manejo de duplicados de `rpc_admin_registrar_implemento`. La página presupone localmente que la respuesta contiene un implemento utilizable, pero el tipo de esa respuesta no está definido en las fuentes.

## Acciones de guardar y finalizar

**Confirmado:** `JornadaAcciones` solo emite `guardar` y `finalizar`. La página conecta `finalizar` con `finalizarDesdeFilas(jornada)`.

**Confirmado:** el evento `guardar` está conectado en la página a una función vacía. No hay llamada de persistencia de borrador implementada.

**Confirmado:** `finalizarDesdeFilas` ejecuta primero la validación local de continuidad. Si es válida, activa `guardando`, limpia `error`, y actualmente lanza un error indicando que falta conectar la secuencia de filas a los RPC administrativos. Siempre restablece `guardando` al terminar.

**Secuencia conceptual:** comentarios del composable y el HTML asocian transiciones de filas con varios RPC administrativos. Esta asociación no está implementada en `finalizarDesdeFilas` y no se documenta como regla backend ni como orden transaccional confirmado.

**Pendiente:** definir con fuentes de Supabase y negocio qué significa guardar, qué significa finalizar, qué datos se persisten y cómo se procesa cada transición.

## Estado de carga y errores

**Confirmado:** el composable expone `guardando` y `error`. Durante el intento de finalización, captura errores, guarda un mensaje en `error` y propaga el error; la validación que falla antes de activar el guardado también se propaga como excepción.

**Confirmado:** la página consume `guardando`, pero no consume ni renderiza `error`. El flujo de creación de implemento no tiene un estado de carga o captura de errores propio visible en la página.

**Pendiente:** acordar mensajes, clasificación de errores, recuperación, reintentos y presentación de errores a partir de contratos reales de Supabase y decisiones de negocio.

## RPC involucrados

La siguiente tabla contiene únicamente nombres que aparecen expresamente en los archivos fuente revisados. “Llamada fuente implementada” indica que el servicio contiene una llamada `supabase.rpc` con ese nombre; no confirma el contrato ni que la ruta esté conectada desde la página.

| RPC                                     | Clasificación de evidencia | Evidencia observada                                                                          | Estado de contrato                               |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `rpc_admin_listar_operadores`           | Confirmado                 | Llamada fuente implementada en el servicio; mencionado en página, componente y HTML.         | RPC mencionado; contrato pendiente de verificar. |
| `rpc_obtener_catalogos_offline`         | Confirmado                 | Llamada fuente implementada en el servicio; mencionado en página, componentes y HTML.        | RPC mencionado; contrato pendiente de verificar. |
| `rpc_admin_obtener_jornada`             | Confirmado                 | Llamada fuente implementada en el servicio; mencionado en página y HTML.                     | RPC mencionado; contrato pendiente de verificar. |
| `rpc_admin_iniciar_jornada`             | Confirmado                 | Llamada fuente implementada en el servicio; mencionado en comentarios de secuencia.          | RPC mencionado; contrato pendiente de verificar. |
| `rpc_admin_cambiar_labor`               | Confirmado                 | Llamada fuente implementada en el servicio; mencionado en comentarios de secuencia.          | RPC mencionado; contrato pendiente de verificar. |
| `rpc_admin_registrar_parada`            | Confirmado                 | Llamada fuente implementada en el servicio; mencionado en comentarios de secuencia.          | RPC mencionado; contrato pendiente de verificar. |
| `rpc_admin_cambiar_tipo_parada`         | Confirmado                 | Llamada fuente implementada en el servicio; mencionado en comentarios de secuencia.          | RPC mencionado; contrato pendiente de verificar. |
| `rpc_admin_reanudar_trabajo`            | Confirmado                 | Llamada fuente implementada en el servicio; mencionado en comentarios de secuencia.          | RPC mencionado; contrato pendiente de verificar. |
| `rpc_admin_confirmar_cambio_implemento` | Confirmado                 | Llamada fuente implementada en el servicio; mencionado en comentarios de secuencia.          | RPC mencionado; contrato pendiente de verificar. |
| `rpc_admin_finalizar_jornada`           | Confirmado                 | Llamada fuente implementada en el servicio; mencionado en comentarios de secuencia.          | RPC mencionado; contrato pendiente de verificar. |
| `rpc_admin_deshacer_ultimo_evento`      | Confirmado                 | Llamada fuente implementada en el servicio; mencionado en el HTML.                           | RPC mencionado; contrato pendiente de verificar. |
| `rpc_admin_registrar_implemento`        | Confirmado                 | Llamada fuente implementada en el servicio y ruta de UI/composable observada.                | RPC mencionado; contrato pendiente de verificar. |
| `rpc_admin_confirmar_cambio_equipo`     | Ejemplo visual             | Mencionado únicamente en el HTML. No existe llamada correspondiente en el servicio revisado. | RPC mencionado; contrato pendiente de verificar. |

## Contratos pendientes de Supabase

- Verificar el contrato real de cada RPC listado: parámetros, tipos, obligatoriedad, respuesta y errores.
- Verificar qué RPC, si alguno, carga operadores, equipos, área, catálogos y una jornada ya existente para esta pantalla.
- Verificar el contrato de creación de implemento antes de depender de un objeto de respuesta en la página.
- Verificar el modelo de persistencia para guardar borrador, finalizar, deshacer y cualquier transición entre filas.
- Verificar autorizaciones, concurrencia, idempotencia, reintentos y garantías transaccionales. No existe evidencia suficiente para describirlos.

## Límites de la implementación actual

- No hay ejecución visible de la carga de operadores, equipos, catálogos o jornada existente.
- La ruta de guardar borrador no tiene implementación.
- La finalización no traduce filas ni llama los RPC administrativos: termina con un error explícito de pendiente.
- La respuesta de creación de implemento se trata de forma local sin un tipo de respuesta confirmado.
- No existe UI visible para el `error` expuesto por el composable.

## Responsive

**Confirmado:** la página usa espaciado compacto base y mayor desde `sm`. Los datos generales cambian de una columna a una cuadrícula desde `sm`; el detalle se muestra como tarjetas en base y como tabla desde `md`; las acciones son fijas abajo en base y pasan a disposición estática desde `md`.

**Confirmado:** el panel de implemento es una hoja inferior en tamaños base y un drawer lateral derecho desde `md`.

**Pendiente:** no hay evidencia de pruebas responsive, comportamiento de carga/error en móvil ni requisitos de interacción adicionales.

## Criterios de aceptación

- La página mantiene el estado local de jornada y transmite eventos de componentes sin llamadas RPC directas desde los componentes visuales.
- La creación de implemento sigue la ruta página → composable → servicio y actualiza la fila activa solo si la página recibe un implemento localmente utilizable.
- Guardar no afirma persistencia mientras su manejador permanezca vacío.
- Finalizar bloquea localmente filas inválidas y refleja que la secuencia de persistencia aún está pendiente.
- Todo contrato, error o garantía backend se mantiene marcado como pendiente hasta verificarse con una fuente real de Supabase.
- La presentación conserva las adaptaciones responsive observadas para datos generales, detalle, acciones y panel de implemento.

## Casos límite

| Caso                                                            | Evidencia / tratamiento actual                                                                                         | Clasificación |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------- |
| Sin filas                                                       | La validación local devuelve que debe agregarse al menos un registro.                                                  | Confirmado    |
| Campos incompletos en una fila                                  | La validación local devuelve un mensaje para completar la fila.                                                        | Confirmado    |
| Fin no posterior al inicio                                      | La validación local devuelve un mensaje por fila.                                                                      | Confirmado    |
| Espacio o solapamiento entre filas consecutivas                 | La validación local requiere igualdad exacta entre fin previo e inicio actual.                                         | Confirmado    |
| Código sin coincidencia activa                                  | La fila queda sin tipo ni id y muestra “Código no reconocido”; después no supera la validación por falta de actividad. | Confirmado    |
| Registro de implemento sin número o tipo                        | El panel no emite el evento de creación.                                                                               | Confirmado    |
| Respuesta de implemento sin objeto utilizable o sin fila activa | La página no actualiza el catálogo ni la fila.                                                                         | Confirmado    |
| Fallo de RPC o duplicado de implemento                          | No hay contrato ni manejo de UI confirmado.                                                                            | Pendiente     |
| Primera fila de tipo parada, cambios de equipo o correcciones   | Solo existen propuestas en comentarios/HTML; falta comportamiento implementado y contrato backend.                     | Pendiente     |

## Pendientes / preguntas abiertas

1. ¿Cuál es el contrato real de cada RPC y cuáles de ellos están vigentes para este flujo?
2. ¿De dónde se cargan equipos y área, y cuál es su relación con operador y fecha?
3. ¿Qué operación de backend corresponde a guardar borrador?
4. ¿Cuál es la traducción de filas aceptada por negocio, incluidas primera fila, paradas, cambios de labor, implemento y equipo?
5. ¿Qué respuesta debe devolver el registro de implemento y cómo se reportan los casos ya existentes o inválidos?
6. ¿Cómo deben presentarse y recuperarse errores de red, autorización o negocio?
7. ¿Qué garantías de concurrencia, reintento, idempotencia y transacción requiere la operación? Deben definirse con Supabase y negocio, no inferirse de esta UI.

## Tabla de trazabilidad

| Tema                      | Fuente                                | Clasificación                         | Resultado documentado                                                                                 |
| ------------------------- | ------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Capas de integración      | README, página, composable y servicio | Confirmado                            | UI → página → composable → servicio → RPC.                                                            |
| Estado de jornada         | Tipos y página                        | Confirmado                            | Datos generales, observaciones y filas se mantienen localmente.                                       |
| Validación de continuidad | Composable                            | Confirmado                            | Requiere filas completas, fin posterior y continuidad exacta.                                         |
| Resolución de códigos     | Tipos, composable y fila              | Confirmado                            | Busca labor activa antes que parada activa por `orden`.                                               |
| Catálogos y operadores    | Servicio y página                     | Confirmado / Pendiente                | Los RPC están encapsulados, pero no se invocan desde la página revisada y no hay contrato confirmado. |
| Crear implemento          | Panel, página, composable y servicio  | Confirmado / Pendiente                | La ruta de UI llega al servicio; la respuesta y contrato requieren verificación.                      |
| Guardar borrador          | Página y acciones                     | Confirmado                            | El evento existe, pero su manejador está vacío.                                                       |
| Finalizar                 | Composable, página y acciones         | Confirmado / Pendiente                | Valida y expone estado; la secuencia RPC no está implementada.                                        |
| Secuencia de eventos      | Comentarios del composable y HTML     | Secuencia conceptual / Ejemplo visual | No es una regla backend ni un orden de persistencia confirmado.                                       |
| Cambio de equipo          | HTML                                  | Ejemplo visual                        | El RPC solo está mencionado en el HTML; falta servicio, contrato y flujo implementado.                |
