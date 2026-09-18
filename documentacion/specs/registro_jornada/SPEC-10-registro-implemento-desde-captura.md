# SPEC-10 — Registro de implemento desde la captura de jornada

## Objetivo

Documentar el flujo de interfaz para registrar un implemento desde una fila de
captura de jornada y usarlo en esa misma fila. Este documento no define el
contrato de persistencia ni la secuencia de eventos de una jornada.

## Alcance de la evidencia

La evidencia revisada corresponde únicamente a los archivos del paquete de
formulario de captura. No contiene una definición real de Supabase, migraciones
ni contratos RPC verificables.

## Confirmado

### Modelo que usa la interfaz

- Un implemento disponible en la interfaz tiene `id`, `numero`, `nombre`,
  `tipo_implemento_id` y `activo`.
- El formulario de creación emite `numero`, `tipoImplementoId` y `nombre`
  opcional. Antes de emitir, la implementación fuente recorta el número, lo
  convierte a mayúsculas y convierte el nombre vacío en `null`.
- El formulario no emite la creación si el número queda vacío o no se ha
  seleccionado un tipo de implemento.
- Una fila de jornada conserva el implemento seleccionado en `implementoId`,
  que puede ser `null`.

### Flujo de UI implementado

1. El selector de implemento permite elegir “Sin implemento”, un implemento de
   la lista o la opción temporal `__nuevo__`.
2. Al elegir `__nuevo__`, el selector restaura el valor previo y emite
   `crear`; ese valor temporal no se asigna al modelo de la fila.
3. La página conserva el índice de la fila activa y abre el panel de creación.
4. El panel emite los datos del formulario; la página llama a
   `registrarImplemento` del composable.
5. Si la respuesta fuente expone `implemento` y existe una fila activa, la
   página agrega el implemento al catálogo local solo si no encuentra el mismo
   `id`, asigna dicho `id` a `implementoId` de la fila activa y cierra el
   panel.

### Llamada fuente implementada

El servicio implementa una llamada a
`supabase.rpc('rpc_admin_registrar_implemento', …)` con un objeto formado por
`p_numero`, `p_tipo_implemento_id` y `p_nombre`. El composable espera la
respuesta de esa llamada y propaga el error recibido por la capa de Supabase.

Esto confirma la llamada presente en el código fuente, no el contrato del RPC.

## Decisiones de UI

- El panel se presenta como drawer lateral en escritorio y como bottom sheet
  en tamaños móviles.
- El panel muestra el número de fila activa cuando existe.
- El selector expone una acción para abrir el panel de alta de implemento.
- La intención declarada en la interfaz es usar el alta cuando el implemento
  existe físicamente, pero no aparece en el catálogo mostrado.

## Ejemplo visual y simulación HTML

- El HTML autónomo muestra números, tipos e identificadores fijos para fines
  visuales; no prueba que sean datos disponibles en producción.
- El script del HTML agrega una opción al selector y la selecciona localmente
  después de enviar el formulario. Esa operación es una simulación del
  prototipo, no una persistencia confirmada.
- Los comentarios del HTML describen una respuesta con `ok`, `creado`,
  `ya_existia` e `implemento`, y afirman un comportamiento para números ya
  existentes. Se consideran ejemplo visual/documental: no hay contrato real de
  Supabase en la evidencia revisada que los confirme.

## Pendiente

- Verificar en la definición real de Supabase el contrato de
  `rpc_admin_registrar_implemento`: parámetros aceptados, tipos, respuesta y
  errores.
- Verificar en esa misma fuente si existen reglas para números repetidos y, de
  existir, su resultado observable por la interfaz.
- Verificar cómo se carga y actualiza el catálogo de implementos fuera del
  alta local. El servicio menciona `rpc_obtener_catalogos_offline`, pero su
  contrato y su uso de carga no están implementados en la página revisada.
- Verificar si el resultado que consume la página incluye exactamente una
  propiedad `implemento` con un `id` asignable a la fila.
- Los demás RPC administrativos mencionados para iniciar, cambiar o finalizar
  una jornada son contratos pendientes de verificar. La traducción de filas a
  esa secuencia permanece sin implementar en el composable y no forma parte de
  esta SPEC.
