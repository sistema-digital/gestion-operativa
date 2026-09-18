# SPEC-05 — Gestión de implementos

> Módulo: Registro administrativo de jornadas
> Estado: borrador basado en fuentes frontend; el contrato del RPC requiere verificación en Supabase.

## Objetivo

Definir la selección de un implemento por fila, la ausencia de implemento y el flujo para registrar uno no disponible en el catálogo, para dejarlo seleccionado en la fila que inició la solicitud.

## Alcance

- Seleccionar un implemento existente o dejar una fila sin implemento.
- Usar `__nuevo__` exclusivamente como valor temporal de UI para abrir la creación.
- Documentar el flujo entre selector, fila, detalle, página, panel, composable y servicio.
- Documentar los campos locales de alta, la actualización del catálogo local y la selección automática posterior.
- Registrar los límites conocidos de `rpc_admin_registrar_implemento`.
- Documentar el comportamiento responsive confirmado del panel.

## Fuera de alcance

- La firma real, permisos, validaciones de negocio, unicidad, respuesta e idempotencia de `rpc_admin_registrar_implemento`.
- Cargar o refrescar catálogos desde Supabase.
- Persistir una fila o traducir cambios de implemento a eventos administrativos; corresponde a SPEC-06.
- Borradores, recuperación, edición o eliminación de implementos.
- Implementar código, migraciones, RPC o componentes.

## Fuentes

| Fuente | Uso |
| --- | --- |
| `documentacion/formulario_captura_padas/INDEX_SPECS.md` | Alcance de SPEC-05, jerarquía de evidencia y regla de no inventar contratos. |
| `documentacion/formulario_captura_padas/registroJornada.types.ts` | Modelo de implementos, tipos y payload frontend. |
| `documentacion/formulario_captura_padas/components/ImplementoSelect.vue` | Selección, valor temporal y evento de creación. |
| `documentacion/formulario_captura_padas/components/ImplementoCrearPanel.vue` | Campos, normalización, validación local, evento y responsive. |
| `documentacion/formulario_captura_padas/components/JornadaFila.vue` | Enlace del implemento a una fila y propagación de evento. |
| `documentacion/formulario_captura_padas/components/JornadaDetalle.vue` | Propagación del índice de la fila solicitante. |
| `documentacion/formulario_captura_padas/RegistroJornadaPage.vue` | Estado, apertura, alta, catálogo local y selección posterior. |
| `documentacion/formulario_captura_padas/composables/useJornadaAdmin.ts` | Delegación al servicio y propagación del error RPC. |
| `documentacion/formulario_captura_padas/services/registroJornada.service.ts` | Nombre de RPC y mapeo de payload a parámetros mencionados. |

No se verificó una definición real de Supabase para `rpc_admin_registrar_implemento`; esta SPEC no convierte sus parámetros, respuesta, errores o permisos en un contrato confirmado.

## Clasificación de evidencia

- **Confirmado:** presente en tipos o archivos fuente Vue, composable o servicio.
- **Decisión de UI:** presentación o interacción de los componentes fuente; no amplía contratos backend.
- **Ejemplo visual:** contenido ilustrativo; no es regla funcional.
- **Pendiente:** información necesaria no confirmada por las fuentes.

## Modelo de datos relevante

**Confirmado.** `JornadaFilaModel.implementoId` es `string | null`; `null` representa ausencia de implemento.

**Confirmado.** El catálogo local usa `ImplementoOption`:

| Campo | Tipo |
| --- | --- |
| `id` | `string` |
| `numero` | `string` |
| `nombre` | `string | null` |
| `tipo_implemento_id` | `string` |
| `activo` | `boolean` |

**Confirmado.** Los tipos del panel usan `ImplementoTipoOption` con `id` y `nombre`. El payload frontend contiene `numero`, `tipoImplementoId` y `nombre?: string | null`.

**Pendiente.** La respuesta RPC no está tipada ni documentada. La página espera leer una propiedad `implemento` y tratarla como `ImplementoOption`, pero las fuentes no prueban que exista.

## Selección de implemento

**Confirmado.** `ImplementoSelect` recibe `implementos`, se enlaza a un modelo `string | null` y ofrece tres resultados:

| Opción | Efecto local |
| --- | --- |
| Sin implemento | Asigna `null` a la fila. |
| Implemento del catálogo | Asigna su `id` a la fila. |
| `__nuevo__` | Restaura visualmente el valor previo y emite `crear`. |

**Confirmado.** `__nuevo__` no se persiste en el modelo. `JornadaFila` enlaza el selector a `model.implementoId` y propaga `crear` como `crear-implemento`.

**Pendiente.** No hay filtro confirmado que excluya implementos inactivos: el selector muestra todas las opciones recibidas.

## Creación de implemento inexistente

**Confirmado.** `JornadaDetalle` propaga el evento con el índice de la fila. La página guarda ese índice en `filaImplementoActiva` y abre `ImplementoCrearPanel`.

| Campo del panel | Requerido localmente | Tratamiento confirmado |
| --- | ---: | --- |
| Número | Sí | Elimina espacios externos y convierte a mayúsculas. |
| Tipo | Sí | Emite su identificador en `tipoImplementoId`. |
| Nombre / descripción | No | Elimina espacios externos; vacío se emite como `null`. |

**Confirmado.** Si falta número o tipo, `submit()` no emite `crear`. El panel no llama Supabase: emite el payload a la página, que lo entrega a `useJornadaAdmin.registrarImplemento`.

## Flujo

```text
Persona elige “Registrar nuevo implemento” en una fila
        ↓
Selector restaura el valor anterior y emite crear
        ↓
Fila y detalle propagan el índice de esa fila
        ↓
Página guarda el índice y abre el panel
        ↓
Panel valida y emite el payload local
        ↓
Página → composable → servicio → RPC mencionado
        ↓
Si la página recibe un `implemento` y conserva una fila activa:
  agrega el implemento al catálogo si no existe por id
  asigna su id a la fila activa
  cierra el panel y limpia la fila activa
```

**Pendiente.** No se define qué hacer si falla el RPC, falta `implemento` en la respuesta, el valor no cumple `ImplementoOption` o la fila activa fue eliminada durante la solicitud.

## Contrato entre componentes

| Origen | Destino | Contrato confirmado |
| --- | --- | --- |
| `ImplementoSelect` | `JornadaFila` | `v-model` de `string | null`; evento `crear`. |
| `JornadaFila` | `JornadaDetalle` | Evento `crear-implemento`, sin payload. |
| `JornadaDetalle` | `RegistroJornadaPage` | Evento `crear-implemento` con índice `number`. |
| `RegistroJornadaPage` | `ImplementoCrearPanel` | `v-model:open`, `filaNumero` y `tiposImplemento`. |
| `ImplementoCrearPanel` | `RegistroJornadaPage` | Evento `crear` con número, tipo y nombre opcional. |
| Página | Composable | `registrarImplemento(payload)`. |
| Composable | Servicio | `registroJornadaService.registrarImplemento(payload)`. |

## RPC involucrados

### `rpc_admin_registrar_implemento`

**Confirmado.** El servicio llama `supabase.rpc('rpc_admin_registrar_implemento', ...)` y mapea el payload a `p_numero`, `p_tipo_implemento_id` y `p_nombre`.

**Confirmado.** Si la llamada devuelve error, el composable lo relanza; si no, retorna `data`.

**Pendiente.** Verificar en Supabase la firma, tipos, respuesta, errores, permisos/RLS, unicidad, validación de tipo e idempotencia. Los nombres de claves usados en el servicio no sustituyen la definición real del RPC.

## Validaciones

**Confirmado.** El panel exige localmente `numero.trim()` y `tipoImplementoId`. `nombre` vacío se normaliza a `null` antes de llamar al servicio.

**Pendiente.** Formato, longitud, caracteres permitidos, duplicidad del número, existencia del tipo, estado activo y mensajes accesibles de validación.

## Estados de error

**Confirmado.** El composable relanza el error RPC. La página no lo captura para mostrar un mensaje ni restaura o limpia el panel.

**Confirmado.** Si no hay `implemento` interpretable o no hay fila activa, la página no actualiza catálogo, no selecciona, no cierra el panel ni limpia el índice.

**Pendiente.** UI de error, reintentos, prevención de doble envío, estado de carga y recuperación por pérdida de conexión.

## Responsive

**Decisión de UI.** El panel es un drawer derecho de `408px` desde `md`; en `sm/xs` es un bottom sheet con altura máxima `86dvh` y contenido desplazable.

**Decisión de UI.** En móvil, los controles tienen `h-10`; desde `md` se muestran más compactos. El selector mantiene la selección previa mientras se abre el panel.

## Criterios de aceptación

1. Una fila admite `implementoId = null` al seleccionar “Sin implemento”.
2. Una opción existente asigna su `id` a la fila.
3. `__nuevo__` nunca queda asignado como `implementoId` y abre el flujo de creación para la fila correspondiente.
4. El panel no emite creación sin número y tipo.
5. El payload emitido normaliza número y nombre conforme al comportamiento fuente.
6. El panel no ejecuta RPC directamente; el flujo atraviesa página, composable y servicio.
7. Con un implemento válido recibido y una fila activa, se agrega una sola vez por `id`, se selecciona en esa fila y se cierra el panel.
8. La SPEC no fija contrato backend sin verificar la función real de Supabase.

## Casos límite

- **Confirmado:** `__nuevo__` solo es un valor temporal de UI.
- **Confirmado:** una descripción compuesta solo por espacios se emite como `null`.
- **Pendiente:** número duplicado, tipo inactivo, catálogo vacío, fallo RPC, doble envío, cierre durante envío y eliminación de la fila activa.
- **Pendiente:** qué hacer si ya existe el mismo número con otro `id`; la página solo evita duplicidad por `id`.

## Pendientes / preguntas abiertas

1. Verificar la firma y respuesta de `rpc_admin_registrar_implemento`, incluida la existencia y forma de `implemento`.
2. Confirmar reglas de número único, tipos permitidos, implementos activos y duplicados.
3. Definir carga, error, reintento e idempotencia del alta.
4. Definir qué ocurre si la fila activa cambia o se elimina durante la solicitud.
5. Confirmar cómo se cargan y actualizan `implementos` e `implementoTipos`.
6. Definir la traducción del cambio de implemento a evento administrativo en SPEC-06.

## Tabla de trazabilidad

| Regla o dato | Clasificación | Fuente exacta |
| --- | --- | --- |
| `implementoId` nullable | Confirmado | `registroJornada.types.ts` |
| Sin implemento, existente y `__nuevo__` | Confirmado | `components/ImplementoSelect.vue` |
| Valor temporal restaura selección y emite creación | Confirmado | `components/ImplementoSelect.vue` |
| Campos, normalización y validación local | Confirmado | `components/ImplementoCrearPanel.vue` |
| Índice de fila activa | Confirmado | `components/JornadaDetalle.vue`, `RegistroJornadaPage.vue` |
| Flujo por composable y servicio | Confirmado | `RegistroJornadaPage.vue`, `composables/useJornadaAdmin.ts`, `services/registroJornada.service.ts` |
| Nombre de RPC y claves de envío | Confirmado en servicio; contrato pendiente | `services/registroJornada.service.ts` |
| Drawer desktop y bottom sheet móvil | Decisión de UI | `components/ImplementoCrearPanel.vue` |
| Respuesta, permisos, duplicidad e idempotencia | Pendiente | Requiere definición real de Supabase |
