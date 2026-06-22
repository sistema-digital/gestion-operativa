# Contexto de BD agrupado por submódulos — Solicitudes de compra

Generado a partir del contexto JSON de Supabase el `2026-06-09T17:51:24.48966+00:00`.

Actualizado manualmente el `2026-06-15` para incluir `fecha_entrega_sistema`, validar `disponible_desde` contra el estado actual y ciclo actual de la solicitud, y documentar el cambio de `folio_sistema_compra` a `folio_oc`.

## Índice

- [Usuarios, roles y áreas](#usuarios-roles-y-reas)
- [Catálogos base y estados](#cat-logos-base-y-estados)
- [Solicitudes núcleo](#solicitudes-n-cleo)
- [Productos, detalles y precios](#productos-detalles-y-precios)
- [Servicios](#servicios)
- [Tracking, flujo e historial](#tracking-flujo-e-historial)
- [Bloqueos de edición](#bloqueos-de-edici-n)
- [Adjuntos y Storage](#adjuntos-y-storage)
- [Órdenes de compra e importación](#rdenes-de-compra-e-importaci-n)
- [Vistas para frontend, listas y badges](#vistas-para-frontend-listas-y-badges)
- [Funciones y RPC por submódulo](#funciones-y-rpc-por-submódulo)
- [Storage](#storage)
- [Relaciones globales principales](#relaciones-globales-principales)
- [Notas para IA](#notas-para-ia)

## Resumen general

- Schemas incluidos: `public, storage`
- Tablas public: `26`
- Vistas public: `8`
- Funciones/RPC public detectadas: `82`
- RLS detectado en tablas public: `25`

## Usuarios, roles y áreas

| Objeto | Tipo | Propósito |
|---|---|---|
| `public.app_area` | `BASE TABLE` | Catálogo de áreas usadas para segmentar usuarios y solicitudes. |
| `public.app_role` | `BASE TABLE` | Catálogo de roles usados para controlar acciones en el flujo. |
| `public.app_usuario` | `BASE TABLE` | Usuarios internos del módulo con email, área y rol. |

### `public.app_area`

**Propósito:** Catálogo de áreas usadas para segmentar usuarios y solicitudes.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `bigint` | NO | `` |
| `codigo` | `text` | NO | `` |
| `nombre` | `text` | NO | `` |
| `activo` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Primary key:**
- `app_area_pkey`: `id`

**Relaciones:**
**FK entrantes:**
- `public.app_usuario.area_id` → `id` (`app_usuario_area_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_adjunto.subido_por_area_id` → `id` (`solicitud_adjunto_subido_por_area_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_compra.area_solicitante_id` → `id` (`solicitud_compra_area_solicitante_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_compra_lock.locked_by_area_id` → `id` (`solicitud_compra_lock_locked_by_area_id_fkey`, on delete `NO ACTION`)

**Restricciones UNIQUE/CHECK:**
- `app_area_codigo_key` (UNIQUE): `UNIQUE (codigo)`
- `app_area_codigo_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM codigo)) > 0))`
- `app_area_nombre_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM nombre)) > 0))`

**Índices:**
- `app_area_codigo_key`: `CREATE UNIQUE INDEX app_area_codigo_key ON public.app_area USING btree (codigo)`
- `app_area_pkey`: `CREATE UNIQUE INDEX app_area_pkey ON public.app_area USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_app_area_auth` [SELECT] roles: `authenticated`

### `public.app_role`

**Propósito:** Catálogo de roles usados para controlar acciones en el flujo.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `bigint` | NO | `` |
| `codigo` | `text` | NO | `` |
| `nombre` | `text` | NO | `` |
| `activo` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Primary key:**
- `app_role_pkey`: `id`

**Relaciones:**
**FK entrantes:**
- `public.app_usuario.role_id` → `id` (`app_usuario_role_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_adjunto.subido_por_role_id` → `id` (`solicitud_adjunto_subido_por_role_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_compra.role_solicitante_id` → `id` (`solicitud_compra_role_solicitante_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_compra_lock.locked_by_role_id` → `id` (`solicitud_compra_lock_locked_by_role_id_fkey`, on delete `NO ACTION`)

**Restricciones UNIQUE/CHECK:**
- `app_role_codigo_key` (UNIQUE): `UNIQUE (codigo)`
- `app_role_codigo_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM codigo)) > 0))`
- `app_role_nombre_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM nombre)) > 0))`

**Índices:**
- `app_role_codigo_key`: `CREATE UNIQUE INDEX app_role_codigo_key ON public.app_role USING btree (codigo)`
- `app_role_pkey`: `CREATE UNIQUE INDEX app_role_pkey ON public.app_role USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_app_role_auth` [SELECT] roles: `authenticated`

### `public.app_usuario`

**Propósito:** Usuarios internos del módulo con email, área y rol.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `bigint` | NO | `` |
| `email` | `text` | NO | `` |
| `nombre` | `text` | YES | `` |
| `area_id` | `bigint` | NO | `` |
| `role_id` | `bigint` | NO | `` |
| `activo` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | YES | `` |

**Primary key:**
- `app_usuario_pkey`: `id`

**Relaciones:**
**FK salientes:**
- `area_id` → `public.app_area.id` (`app_usuario_area_id_fkey`, on delete `NO ACTION`)
- `role_id` → `public.app_role.id` (`app_usuario_role_id_fkey`, on delete `NO ACTION`)

**Restricciones UNIQUE/CHECK:**
- `app_usuario_email_key` (UNIQUE): `UNIQUE (email)`
- `app_usuario_email_lower_chk` (CHECK): `CHECK ((email = lower(email)))`
- `app_usuario_email_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM email)) > 0))`

**Índices:**
- `app_usuario_email_key`: `CREATE UNIQUE INDEX app_usuario_email_key ON public.app_usuario USING btree (email)`
- `app_usuario_pkey`: `CREATE UNIQUE INDEX app_usuario_pkey ON public.app_usuario USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_app_usuario_auth` [SELECT] roles: `authenticated`


## Catálogos base y estados

| Objeto | Tipo | Propósito |
|---|---|---|
| `public.estado` | `BASE TABLE` | Catálogo maestro de estados. El código debe usarse en lógica, no el ID numérico. |
| `public.estado_contexto` | `BASE TABLE` | Define en qué contexto se puede usar cada estado: solicitud, detalle, importación, etc. |
| `public.prioridad` | `BASE TABLE` | Catálogo de prioridades asignables a solicitudes. |
| `public.unidad_medida` | `BASE TABLE` | Catálogo de unidades de medida para productos y servicios. |
| `public.tipo_solicitud` | `BASE TABLE` | Catálogo de tipos de solicitud: zafra, cultivo, otros o servicio. |
| `public.tipo_adjunto` | `BASE TABLE` | Catálogo de tipos de adjuntos de solicitud. |

### `public.estado`

**Propósito:** Catálogo maestro de estados. El código debe usarse en lógica, no el ID numérico.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `bigint` | NO | `` |
| `codigo` | `text` | NO | `` |
| `nombre` | `text` | NO | `` |
| `descripcion` | `text` | YES | `` |
| `activo` | `boolean` | NO | `true` |
| `orden` | `integer` | NO | `1` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Primary key:**
- `estado_pkey`: `id`

**Relaciones:**
**FK entrantes:**
- `public.estado_contexto.estado_id` → `id` (`estado_contexto_estado_id_fkey`, on delete `CASCADE`)
- `public.solicitud_compra.estado_id` → `id` (`solicitud_compra_estado_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_estado_historial.estado_id` → `id` (`solicitud_estado_historial_estado_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_estado_transicion.estado_destino_id` → `id` (`solicitud_estado_transicion_estado_destino_id_fkey`, on delete `CASCADE`)
- `public.solicitud_estado_transicion.estado_origen_id` → `id` (`solicitud_estado_transicion_estado_origen_id_fkey`, on delete `CASCADE`)
- `public.solicitud_evento.estado_anterior_id` → `id` (`solicitud_evento_estado_anterior_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_evento.estado_nuevo_id` → `id` (`solicitud_evento_estado_nuevo_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_producto_detalle.estado_detalle_id` → `id` (`solicitud_producto_detalle_estado_detalle_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_servicio_detalle.estado_detalle_id` → `id` (`solicitud_servicio_detalle_estado_detalle_id_fkey`, on delete `NO ACTION`)

**Restricciones UNIQUE/CHECK:**
- `estado_codigo_key` (UNIQUE): `UNIQUE (codigo)`
- `estado_codigo_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM codigo)) > 0))`
- `estado_nombre_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM nombre)) > 0))`

**Índices:**
- `estado_codigo_key`: `CREATE UNIQUE INDEX estado_codigo_key ON public.estado USING btree (codigo)`
- `estado_pkey`: `CREATE UNIQUE INDEX estado_pkey ON public.estado USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_estado_auth` [SELECT] roles: `authenticated`

### `public.estado_contexto`

**Propósito:** Define en qué contexto se puede usar cada estado: solicitud, detalle, importación, etc.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `bigint` | NO | `` |
| `estado_id` | `bigint` | NO | `` |
| `contexto` | `text` | NO | `` |
| `activo` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Primary key:**
- `estado_contexto_pkey`: `id`

**Relaciones:**
**FK salientes:**
- `estado_id` → `public.estado.id` (`estado_contexto_estado_id_fkey`, on delete `CASCADE`)

**Restricciones UNIQUE/CHECK:**
- `estado_contexto_contexto_chk` (CHECK): `CHECK ((contexto = ANY (ARRAY['solicitud'::text, 'detalle_producto'::text, 'detalle_servicio'::text, 'orden_compra'::text, 'importacion_oc'::text])))`
- `estado_contexto_unique` (UNIQUE): `UNIQUE (estado_id, contexto)`

**Índices:**
- `estado_contexto_pkey`: `CREATE UNIQUE INDEX estado_contexto_pkey ON public.estado_contexto USING btree (id)`
- `estado_contexto_unique`: `CREATE UNIQUE INDEX estado_contexto_unique ON public.estado_contexto USING btree (estado_id, contexto)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_estado_contexto_auth` [SELECT] roles: `authenticated`

### `public.prioridad`

**Propósito:** Catálogo de prioridades asignables a solicitudes.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `bigint` | NO | `` |
| `codigo` | `text` | NO | `` |
| `nombre` | `text` | NO | `` |
| `orden` | `integer` | NO | `1` |
| `activo` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Primary key:**
- `prioridad_pkey`: `id`

**Relaciones:**
**FK entrantes:**
- `public.solicitud_compra.prioridad_id` → `id` (`solicitud_compra_prioridad_id_fkey`, on delete `NO ACTION`)

**Restricciones UNIQUE/CHECK:**
- `prioridad_codigo_key` (UNIQUE): `UNIQUE (codigo)`
- `prioridad_codigo_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM codigo)) > 0))`
- `prioridad_nombre_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM nombre)) > 0))`

**Índices:**
- `prioridad_codigo_key`: `CREATE UNIQUE INDEX prioridad_codigo_key ON public.prioridad USING btree (codigo)`
- `prioridad_pkey`: `CREATE UNIQUE INDEX prioridad_pkey ON public.prioridad USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_prioridad_auth` [SELECT] roles: `authenticated`

### `public.unidad_medida`

**Propósito:** Catálogo de unidades de medida para productos y servicios.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `bigint` | NO | `` |
| `codigo` | `text` | NO | `` |
| `abreviatura` | `text` | NO | `` |
| `descripcion` | `text` | YES | `` |
| `activo` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Primary key:**
- `unidad_medida_pkey`: `id`

**Relaciones:**
**FK entrantes:**
- `public.producto.unidad_medida_id` → `id` (`producto_unidad_medida_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_producto_detalle.unidad_medida_id` → `id` (`solicitud_producto_detalle_unidad_medida_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_servicio_detalle.unidad_medida_id` → `id` (`solicitud_servicio_detalle_unidad_medida_id_fkey`, on delete `NO ACTION`)

**Restricciones UNIQUE/CHECK:**
- `unidad_medida_abreviatura_key` (UNIQUE): `UNIQUE (abreviatura)`
- `unidad_medida_abreviatura_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM abreviatura)) > 0))`
- `unidad_medida_codigo_key` (UNIQUE): `UNIQUE (codigo)`
- `unidad_medida_codigo_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM codigo)) > 0))`

**Índices:**
- `unidad_medida_abreviatura_key`: `CREATE UNIQUE INDEX unidad_medida_abreviatura_key ON public.unidad_medida USING btree (abreviatura)`
- `unidad_medida_codigo_key`: `CREATE UNIQUE INDEX unidad_medida_codigo_key ON public.unidad_medida USING btree (codigo)`
- `unidad_medida_pkey`: `CREATE UNIQUE INDEX unidad_medida_pkey ON public.unidad_medida USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_unidad_medida_auth` [SELECT] roles: `authenticated`

### `public.tipo_solicitud`

**Propósito:** Catálogo de tipos de solicitud: zafra, cultivo, otros o servicio.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `bigint` | NO | `` |
| `codigo` | `text` | NO | `` |
| `nombre` | `text` | NO | `` |
| `requiere_almacen` | `boolean` | NO | `true` |
| `permite_productos` | `boolean` | NO | `true` |
| `permite_servicios` | `boolean` | NO | `false` |
| `activo` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Primary key:**
- `tipo_solicitud_pkey`: `id`

**Relaciones:**
**FK entrantes:**
- `public.solicitud_compra.tipo_solicitud_id` → `id` (`solicitud_compra_tipo_solicitud_id_fkey`, on delete `NO ACTION`)

**Restricciones UNIQUE/CHECK:**
- `tipo_solicitud_codigo_key` (UNIQUE): `UNIQUE (codigo)`
- `tipo_solicitud_codigo_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM codigo)) > 0))`
- `tipo_solicitud_no_mezcla` (CHECK): `CHECK ((NOT ((permite_productos = true) AND (permite_servicios = true))))`
- `tipo_solicitud_nombre_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM nombre)) > 0))`

**Índices:**
- `tipo_solicitud_codigo_key`: `CREATE UNIQUE INDEX tipo_solicitud_codigo_key ON public.tipo_solicitud USING btree (codigo)`
- `tipo_solicitud_pkey`: `CREATE UNIQUE INDEX tipo_solicitud_pkey ON public.tipo_solicitud USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_tipo_solicitud_auth` [SELECT] roles: `authenticated`

### `public.tipo_adjunto`

**Propósito:** Catálogo de tipos de adjuntos de solicitud.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `bigint` | NO | `` |
| `codigo` | `text` | NO | `` |
| `nombre` | `text` | NO | `` |
| `activo` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Primary key:**
- `tipo_adjunto_pkey`: `id`

**Relaciones:**
**FK entrantes:**
- `public.solicitud_adjunto.tipo_adjunto_id` → `id` (`solicitud_adjunto_tipo_adjunto_id_fkey`, on delete `NO ACTION`)

**Restricciones UNIQUE/CHECK:**
- `tipo_adjunto_codigo_key` (UNIQUE): `UNIQUE (codigo)`
- `tipo_adjunto_codigo_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM codigo)) > 0))`
- `tipo_adjunto_nombre_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM nombre)) > 0))`

**Índices:**
- `tipo_adjunto_codigo_key`: `CREATE UNIQUE INDEX tipo_adjunto_codigo_key ON public.tipo_adjunto USING btree (codigo)`
- `tipo_adjunto_pkey`: `CREATE UNIQUE INDEX tipo_adjunto_pkey ON public.tipo_adjunto USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_tipo_adjunto_auth` [SELECT] roles: `authenticated`
  - `tipo_adjunto_select_auth` [SELECT] roles: `authenticated`


## Solicitudes núcleo

| Objeto | Tipo | Propósito |
|---|---|---|
| `public.solicitud_compra` | `BASE TABLE` | Tabla principal de la solicitud: estado actual, tipo, prioridad, solicitante, fecha y observación. |
| `public.solicitud_equipo` | `BASE TABLE` | Equipos asociados a la solicitud. No tiene FK externa a equipos para no depender de otra BD. |

### `public.solicitud_compra`

**Propósito:** Tabla principal de la solicitud: estado actual, tipo, prioridad, solicitante real, fechas, folio interno y observación.

**Tipo:** `BASE TABLE`

**Columnas corregidas según el contexto vigente:**

| Columna | Tipo | Nullable | Default | Regla vigente |
|---|---|---:|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Identificador interno. |
| `folio_sol` | `text` | YES |  | Folio interno/requisición visible de la solicitud. |
| `tipo_solicitud_id` | `bigint` | NO |  | FK a `tipo_solicitud`. |
| `estado_id` | `bigint` | NO |  | FK a `estado`; usar `estado.codigo` en lógica. |
| `prioridad_id` | `bigint` | NO |  | FK a `prioridad`. |
| `area_solicitante_id` | `bigint` | YES |  | Área del solicitante real. |
| `role_solicitante_id` | `bigint` | YES |  | Rol del solicitante real. |
| `solicitante_email` | `text` | NO |  | Email del dueño formal de la solicitud. |
| `fecha_entrega` | `date` | NO |  | Fecha original solicitada. |
| `fecha_entrega_sistema` | `date` | YES |  | Fecha registrada por Secretaría/sistema externo. |
| `observacion` | `text` | NO | `''::text` | Observación visible de la solicitud. |
| `ciclo_estado` | `integer` | NO | `1` | Ciclo vigente del flujo. |
| `fecha_subida_sistema` | `date` | YES |  | Fecha en que se marcó/subió al sistema de compras. |
| `estado_importado_codigo` | `text` | YES |  | Último estado normalizado importado desde compras. |
| `estado_importado_raw` | `text` | YES |  | Texto original del estado externo. |
| `estado_importado_at` | `timestamptz` | YES |  | Fecha/hora fuente usada para actualizar estado importado. |
| `estado_importado_batch_id` | `uuid` | YES |  | Batch que actualizó el estado importado. |
| `created_at` | `timestamptz` | NO | `now()` | Creación. |
| `updated_at` | `timestamptz` | YES |  | Actualización. |

**Cambio aplicado por conflicto:**

- Se elimina del contexto la columna `solicitud_compra.folio_oc`.
- Motivo: una solicitud puede tener varias órdenes de compra. Los folios OC viven en `orden_compra` y `orden_compra_detalle`, y las vistas deben agregarlos desde esas tablas.
- Secretaría no escribe `folio_oc` al marcar subida al sistema; `rpc_marcar_subido_sistema` solo debe trabajar con `folio_sol`, `fecha_subida_sistema` y `fecha_entrega_sistema`.

**Fecha mostrada operativa:**

```sql
COALESCE(fecha_entrega_proveedor, fecha_entrega_sistema, fecha_entrega)
```

Donde `fecha_entrega_proveedor` se obtiene desde OC importada.

**Relaciones:**

**FK salientes:**
- `area_solicitante_id` → `public.app_area.id`
- `estado_id` → `public.estado.id`
- `prioridad_id` → `public.prioridad.id`
- `role_solicitante_id` → `public.app_role.id`
- `tipo_solicitud_id` → `public.tipo_solicitud.id`

**FK entrantes principales:**
- `orden_compra.solicitud_id` → `solicitud_compra.id` (`ON DELETE SET NULL`)
- `orden_compra_detalle.solicitud_id` → `solicitud_compra.id` (`ON DELETE SET NULL`)
- `solicitud_producto_detalle.solicitud_id` → `solicitud_compra.id` (`ON DELETE CASCADE`)
- `solicitud_servicio_detalle.solicitud_id` → `solicitud_compra.id` (`ON DELETE CASCADE`)
- `solicitud_creacion_delegada.solicitud_id` → `solicitud_compra.id` (`ON DELETE CASCADE`)

**Restricciones esperadas:**
- `ciclo_estado >= 1`
- `folio_sol` único cuando exista.
- `solicitante_email` no vacío.

**RLS / escritura:**
- Lectura por vistas/RLS.
- Escritura crítica mediante RPC.
### `public.solicitud_equipo`

**Propósito:** Equipos asociados a la solicitud. No tiene FK externa a equipos para no depender de otra BD.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `bigint` | NO | `` |
| `solicitud_id` | `uuid` | NO | `` |
| `cod_equipo` | `text` | NO | `` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Primary key:**
- `solicitud_equipo_pkey`: `id`

**Relaciones:**
**FK salientes:**
- `solicitud_id` → `public.solicitud_compra.id` (`solicitud_equipo_solicitud_id_fkey`, on delete `CASCADE`)

**Restricciones UNIQUE/CHECK:**
- `solicitud_equipo_unique` (UNIQUE): `UNIQUE (solicitud_id, cod_equipo)`

**Índices:**
- `solicitud_equipo_pkey`: `CREATE UNIQUE INDEX solicitud_equipo_pkey ON public.solicitud_equipo USING btree (id)`
- `solicitud_equipo_unique`: `CREATE UNIQUE INDEX solicitud_equipo_unique ON public.solicitud_equipo USING btree (solicitud_id, cod_equipo)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_solicitud_equipo_auth` [SELECT] roles: `authenticated`

### `public.solicitud_creacion_delegada`

**Propósito:** Tabla única de auditoría para solicitudes creadas por Secretaría en representación de otra persona o por corrección administrativa.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Propósito |
|---|---|---:|---|
| `id` | `uuid` | NO | Identificador. |
| `solicitud_id` | `uuid` | NO | Solicitud nueva creada. |
| `solicitud_origen_id` | `uuid` | YES | Solicitud original si la nueva solicitud corrige un error de una solicitud previa. |
| `creada_por_email` | `text` | NO | Secretaría que ejecutó la acción. |
| `creada_por_area_id` | `bigint` | YES | Área de la secretaria. |
| `creada_por_role_id` | `bigint` | YES | Rol de la secretaria. |
| `creada_para_email` | `text` | NO | Usuario/área representada como solicitante real. |
| `creada_para_area_id` | `bigint` | YES | Área del representado. |
| `creada_para_role_id` | `bigint` | YES | Rol del representado. |
| `tipo_delegacion` | `text` | NO | `correccion_sistema_compras` o `solicitud_gerencia_normal`. |
| `motivo` | `text` | YES | Motivo legible. |
| `payload` | `jsonb` | NO | Detalles de corrección, líneas originales/nuevas, cantidades y contexto adicional. |
| `created_at` | `timestamptz` | NO | Fecha de creación. |
| `updated_at` | `timestamptz` | YES | Fecha de actualización. |

**Tipos de delegación permitidos:**

| Código | Uso |
|---|---|
| `correccion_sistema_compras` | Secretaría corrige un error propio al registrar/subir al sistema externo. Puede ser para área operativa o gerencia. La solicitud nueva nace aprobada y solo contiene lo que se corrige. |
| `solicitud_gerencia_normal` | Secretaría captura una solicitud normal a nombre de gerencia. Sigue el flujo normal; si es servicio va directo a gerencia. |

**Reglas:**

- No se agregan columnas de auditoría a `solicitud_compra`; la auditoría vive aquí.
- La solicitud original no se modifica cuando se crea una corrección.
- Los detalles corregidos se guardan en `payload`, no en una tabla adicional.
- Las líneas de la nueva solicitud no copian el número de línea original.
- Cada `solicitud_id` debe tener como máximo un registro de delegación/corrección.

**RPC relacionadas:**

- `rpc_secretaria_crear_correccion_sistema_compras(...)`
- `rpc_secretaria_crear_solicitud_gerencia_normal(...)`
## Productos, detalles y precios

| Objeto | Tipo | Propósito |
|---|---|---|
| `public.producto` | `BASE TABLE` | Catálogo de productos confirmados y temporales. |
| `public.precio_producto` | `BASE TABLE` | Histórico/simple catálogo de precios por producto y proveedor. |
| `public.solicitud_producto_detalle` | `BASE TABLE` | Detalle de productos solicitados, inventario, aprobación de gerencia y subida al sistema. |
| `public.producto_codigo_resolucion` | `BASE TABLE` | Trazabilidad cuando almacén resuelve un producto temporal contra un producto real. |
| `public.vw_productos_temporales_pendientes` | `VIEW` | Vista de productos temporales pendientes de resolver por almacén. |

### `public.producto`

**Propósito:** Catálogo de productos confirmados y temporales.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `cod_producto` | `text` | NO | `` |
| `descripcion` | `text` | NO | `` |
| `unidad_medida_id` | `bigint` | NO | `` |
| `activo` | `boolean` | NO | `true` |
| `es_temporal` | `boolean` | NO | `false` |
| `estado_catalogo` | `text` | NO | `'confirmado'::text` |
| `creado_por_email` | `text` | YES | `` |
| `validado_por_almacen_email` | `text` | YES | `` |
| `fecha_validacion_almacen` | `timestamp with time zone` | YES | `` |
| `descripcion_original_supervisor` | `text` | YES | `` |
| `codigo_temporal_original` | `text` | YES | `` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | YES | `` |

**Primary key:**
- `producto_pkey`: `id`

**Relaciones:**
**FK salientes:**
- `unidad_medida_id` → `public.unidad_medida.id` (`producto_unidad_medida_id_fkey`, on delete `NO ACTION`)
**FK entrantes:**
- `public.precio_producto.producto_id` → `id` (`precio_producto_producto_id_fkey`, on delete `CASCADE`)
- `public.producto_codigo_resolucion.producto_real_id` → `id` (`producto_codigo_resolucion_producto_real_id_fkey`, on delete `NO ACTION`)
- `public.producto_codigo_resolucion.producto_temporal_id` → `id` (`producto_codigo_resolucion_producto_temporal_id_fkey`, on delete `NO ACTION`)
- `public.solicitud_producto_detalle.producto_id` → `id` (`solicitud_producto_detalle_producto_id_fkey`, on delete `NO ACTION`)

**Restricciones UNIQUE/CHECK:**
- `producto_cod_producto_key` (UNIQUE): `UNIQUE (cod_producto)`
- `producto_cod_producto_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM cod_producto)) > 0))`
- `producto_descripcion_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM descripcion)) > 0))`
- `producto_estado_catalogo_chk` (CHECK): `CHECK ((estado_catalogo = ANY (ARRAY['temporal'::text, 'confirmado'::text, 'resuelto'::text, 'inactivo'::text])))`

**Índices:**
- `idx_producto_cod`: `CREATE INDEX idx_producto_cod ON public.producto USING btree (cod_producto)`
- `idx_producto_cod_producto_trgm`: `CREATE INDEX idx_producto_cod_producto_trgm ON public.producto USING gin (cod_producto gin_trgm_ops)`
- `idx_producto_descripcion_trgm`: `CREATE INDEX idx_producto_descripcion_trgm ON public.producto USING gin (descripcion gin_trgm_ops)`
- `idx_producto_temporal`: `CREATE INDEX idx_producto_temporal ON public.producto USING btree (es_temporal, estado_catalogo)`
- `producto_cod_producto_key`: `CREATE UNIQUE INDEX producto_cod_producto_key ON public.producto USING btree (cod_producto)`
- `producto_pkey`: `CREATE UNIQUE INDEX producto_pkey ON public.producto USING btree (id)`

**Triggers:**
- `trg_producto_updated_at` BEFORE UPDATE: `EXECUTE FUNCTION fn_set_updated_at()`

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_producto_auth` [SELECT] roles: `authenticated`

### `public.precio_producto`

**Propósito:** Histórico/simple catálogo de precios por producto y proveedor.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `producto_id` | `uuid` | YES | `` |
| `cod_producto` | `text` | YES | `` |
| `proveedor` | `text` | NO | `` |
| `precio` | `numeric` | NO | `` |
| `created_at` | `date` | NO | `CURRENT_DATE` |

**Primary key:**
- `precio_producto_pkey`: `id`

**Relaciones:**
**FK salientes:**
- `producto_id` → `public.producto.id` (`precio_producto_producto_id_fkey`, on delete `CASCADE`)

**Restricciones UNIQUE/CHECK:**
- `precio_producto_precio_check` (CHECK): `CHECK ((precio >= (0)::numeric))`

**Índices:**
- `precio_producto_pkey`: `CREATE UNIQUE INDEX precio_producto_pkey ON public.precio_producto USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_precio_producto_auth` [SELECT] roles: `authenticated`

### `public.solicitud_producto_detalle`

**Propósito:** Detalle de productos solicitados, inventario, aprobación de gerencia, cantidad solicitada al sistema externo y línea interna de solicitud.

**Tipo:** `BASE TABLE`

**Columnas corregidas según contexto vigente:**

| Columna | Tipo | Nullable | Default | Regla vigente |
|---|---|---:|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Identificador. |
| `solicitud_id` | `uuid` | NO |  | FK a solicitud. |
| `producto_id` | `uuid` | NO |  | FK a producto. |
| `descripcion_original_supervisor` | `text` | YES |  | Texto original si aplica. |
| `unidad_medida_id` | `bigint` | NO |  | Unidad del producto. |
| `cantidad` | `numeric` | NO |  | Cantidad solicitada originalmente por usuario/supervisor. |
| `cantidad_inventario` | `numeric` | YES |  | Cantidad validada por almacén. |
| `cantidad_gerencia` | `numeric` | YES |  | Cantidad aprobada por gerencia. |
| `cantidad_solicitada_sistema` | `numeric` | YES |  | Cantidad registrada/solicitada en sistema externo de compras. |
| `estado_detalle_id` | `bigint` | NO | `fn_estado_id('pendiente')` | Estado del detalle. |
| `activo` | `boolean` | NO | `true` | Si sigue vigente en la solicitud. |
| `requiere_revision_almacen` | `boolean` | NO | `true` | Si almacén debe revisar. |
| `revisado_almacen` | `boolean` | NO | `false` | Si almacén ya revisó. |
| `ciclo` | `integer` | NO | `1` | Ciclo del detalle. |
| `descartado_por_email` | `text` | YES |  | Usuario que descartó. |
| `requiere_revision_sistema` | `boolean` | NO | `false` | Diferencias con sistema/OC. |
| `revision_sistema_codigo` | `text` | YES |  | Código de revisión. |
| `revision_sistema_label` | `text` | YES |  | Texto de revisión. |
| `linea_solicitud` | `integer` | YES |  | Línea interna; NULL hasta aprobación de gerencia. |
| `created_at` | `timestamptz` | NO | `now()` | Creación. |
| `updated_at` | `timestamptz` | YES |  | Actualización. |

**Cambios aplicados por conflicto:**

- Se reemplaza `cantidad_subida_sistema_compra` por `cantidad_solicitada_sistema`.
- Se elimina la regla antigua `linea_solicitud NOT NULL asignada al insertar`.
- `linea_solicitud` debe permitir `NULL` antes de aprobación de gerencia.

**Lógica de líneas vigente:**

- `linea_solicitud` se genera cuando la solicitud llega al estado configurado por `fn_estado_generar_linea_solicitud()`, actualmente `aprobado_gerencia`.
- Solo se numeran productos activos del ciclo actual.
- No se numeran productos descartados/inactivos.
- No se renumeran líneas existentes.
- La numeración es por `solicitud_id + ciclo`.
- Si gerencia devuelve, `ciclo_estado` aumenta; cuando supervisor reenvía a gerencia, los productos activos se mueven al ciclo actual sin crear registros nuevos.

**Restricciones esperadas:**

```sql
CHECK (linea_solicitud IS NULL OR linea_solicitud >= 1)
UNIQUE (solicitud_id, ciclo, linea_solicitud) -- con NULL permitido
UNIQUE (solicitud_id, producto_id, ciclo)
```

**Funciones relacionadas:**

- `fn_estado_generar_linea_solicitud()`
- `fn_solicitud_debe_generar_lineas(uuid)`
- `fn_next_linea_solicitud_producto(uuid, integer)`
- `fn_generar_lineas_solicitud_detalles(uuid, integer)`
- `fn_sincronizar_detalles_activos_ciclo_actual(uuid)`
- `trg_set_linea_solicitud_producto()`
- `trg_generar_lineas_al_aprobar_gerencia()`
### `public.producto_codigo_resolucion`

**Propósito:** Trazabilidad cuando almacén resuelve un producto temporal contra un producto real.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `solicitud_producto_detalle_id` | `uuid` | NO | `` |
| `producto_temporal_id` | `uuid` | NO | `` |
| `producto_real_id` | `uuid` | NO | `` |
| `codigo_temporal` | `text` | NO | `` |
| `codigo_real` | `text` | NO | `` |
| `descripcion_original_supervisor` | `text` | YES | `` |
| `resuelto_por_email` | `text` | NO | `` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Primary key:**
- `producto_codigo_resolucion_pkey`: `id`

**Relaciones:**
**FK salientes:**
- `producto_real_id` → `public.producto.id` (`producto_codigo_resolucion_producto_real_id_fkey`, on delete `NO ACTION`)
- `producto_temporal_id` → `public.producto.id` (`producto_codigo_resolucion_producto_temporal_id_fkey`, on delete `NO ACTION`)
- `solicitud_producto_detalle_id` → `public.solicitud_producto_detalle.id` (`producto_codigo_resolucion_solicitud_producto_detalle_id_fkey`, on delete `CASCADE`)

**Restricciones UNIQUE/CHECK:**
_Sin UNIQUE/CHECK detectados._

**Índices:**
- `producto_codigo_resolucion_pkey`: `CREATE UNIQUE INDEX producto_codigo_resolucion_pkey ON public.producto_codigo_resolucion USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_producto_codigo_resolucion_auth` [SELECT] roles: `authenticated`

### `public.vw_productos_temporales_pendientes`

**Propósito:** Vista de productos temporales pendientes de resolver por almacén.

**Tipo:** `VIEW`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `detalle_id` | `uuid` | YES | `` |
| `solicitud_id` | `uuid` | YES | `` |
| `folio_sol` | `text` | YES | `` |
| `producto_temporal_id` | `uuid` | YES | `` |
| `codigo_temporal` | `text` | YES | `` |
| `descripcion` | `text` | YES | `` |
| `descripcion_original_supervisor` | `text` | YES | `` |
| `unidad_codigo` | `text` | YES | `` |
| `cantidad` | `numeric` | YES | `` |
| `created_at` | `timestamp with time zone` | YES | `` |


**Definición de vista:**

```sql
SELECT d.id AS detalle_id,
    sc.id AS solicitud_id,
    sc.folio_sol,
    p.id AS producto_temporal_id,
    p.cod_producto AS codigo_temporal,
    p.descripcion,
    p.descripcion_original_supervisor,
    um.codigo AS unidad_codigo,
    d.cantidad,
    d.created_at
   FROM (((solicitud_producto_detalle d
     JOIN solicitud_compra sc ON ((sc.id = d.solicitud_id)))
     JOIN producto p ON ((p.id = d.producto_id)))
     JOIN unidad_medida um ON ((um.id = d.unidad_medida_id)))
  WHERE ((p.es_temporal = true) AND (p.estado_catalogo = 'temporal'::text) AND (d.activo = true));
```

**RLS / Policies:**
- RLS: no detectado.


## Servicios

| Objeto | Tipo | Propósito |
|---|---|---|
| `public.solicitud_servicio_detalle` | `BASE TABLE` | Detalle de servicios solicitados. No pasa por almacén. |

### `public.solicitud_servicio_detalle`

**Propósito:** Detalle de servicios solicitados. No pasa por almacén, pero sí participa en ciclo actual y línea interna cuando la solicitud se aprueba por gerencia.

**Tipo:** `BASE TABLE`

**Columnas corregidas según contexto vigente:**

| Columna | Tipo | Nullable | Default | Regla vigente |
|---|---|---:|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Identificador. |
| `solicitud_id` | `uuid` | NO |  | FK a solicitud. |
| `descripcion` | `text` | NO |  | Descripción del servicio. |
| `cantidad` | `numeric` | NO | `1` | Cantidad solicitada. |
| `unidad_medida_id` | `bigint` | NO | `fn_unidad_id('servicio')` | Unidad. |
| `cantidad_gerencia` | `numeric` | YES |  | Cantidad aprobada por gerencia. |
| `estado_detalle_id` | `bigint` | NO | `fn_estado_id('pendiente')` | Estado del detalle. |
| `activo` | `boolean` | NO | `true` | Vigencia. |
| `ciclo` | `integer` | NO | `1` | Ciclo del detalle. |
| `descartado_por_email` | `text` | YES |  | Usuario que descartó. |
| `linea_solicitud` | `integer` | YES |  | Línea interna; NULL hasta aprobación de gerencia. |
| `created_at` | `timestamptz` | NO | `now()` | Creación. |
| `updated_at` | `timestamptz` | YES |  | Actualización. |

**Cambio aplicado por conflicto:**

- Se elimina del contexto la regla vieja “no se requiere `linea_solicitud` para servicios”.
- Regla vigente: productos y servicios activos se numeran al aprobar gerencia, cada uno dentro de su tabla y ciclo.

**Reglas:**

- Servicio no pasa por almacén.
- Servicio normal creado por Secretaría a nombre de gerencia va directo a `para_revision_gerencia`.
- Corrección de Secretaría para servicio puede nacer como `aprobado_gerencia` si es corrección de sistema de compras.
- Servicios importados desde OC no se comparan contra descripción ni generan diferencias automáticas.
## Tracking, flujo e historial

| Objeto | Tipo | Propósito |
|---|---|---|
| `public.solicitud_estado_historial` | `BASE TABLE` | Historial de estados para tracking y cálculo de disponible_desde. |
| `public.solicitud_estado_transicion` | `BASE TABLE` | Matriz de transiciones válidas entre estados por acción, rol y tipo de solicitud. |
| `public.solicitud_evento` | `BASE TABLE` | Bitácora de eventos de negocio y auditoría. |
| `public.vw_solicitudes_abandonables` | `VIEW` | Vista de solicitudes candidatas a descarte automático por supervisor. |

### `public.solicitud_estado_historial`

**Propósito:** Historial de estados para tracking y cálculo de `disponible_desde`. Para mostrar `disponible_desde` del estado actual, el registro abierto debe coincidir con `solicitud_compra.estado_id` y `solicitud_compra.ciclo_estado`.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `solicitud_id` | `uuid` | NO | `` |
| `estado_id` | `bigint` | NO | `` |
| `fecha_inicio` | `timestamp with time zone` | NO | `now()` |
| `fecha_fin` | `timestamp with time zone` | YES | `` |
| `creado_por` | `text` | YES | `` |
| `observacion` | `text` | YES | `` |
| `ciclo` | `integer` | NO | `1` |
| `invalidado` | `boolean` | NO | `false` |

**Primary key:**
- `solicitud_estado_historial_pkey`: `id`

**Relaciones:**
**FK salientes:**
- `estado_id` → `public.estado.id` (`solicitud_estado_historial_estado_id_fkey`, on delete `NO ACTION`)
- `solicitud_id` → `public.solicitud_compra.id` (`solicitud_estado_historial_solicitud_id_fkey`, on delete `CASCADE`)

**Restricciones UNIQUE/CHECK:**
- `solicitud_estado_historial_ciclo_check` (CHECK): `CHECK ((ciclo >= 1))`

**Índices:**
- `idx_solicitud_historial_actual`: `CREATE INDEX idx_solicitud_historial_actual ON public.solicitud_estado_historial USING btree (solicitud_id) WHERE ((fecha_fin IS NULL) AND (invalidado = false))`
- `idx_solicitud_historial_solicitud`: `CREATE INDEX idx_solicitud_historial_solicitud ON public.solicitud_estado_historial USING btree (solicitud_id, fecha_inicio DESC)`
- `solicitud_estado_historial_pkey`: `CREATE UNIQUE INDEX solicitud_estado_historial_pkey ON public.solicitud_estado_historial USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_solicitud_estado_historial_auth` [SELECT] roles: `authenticated`

### `public.solicitud_estado_transicion`

**Propósito:** Matriz de transiciones válidas entre estados por acción, rol y tipo de solicitud.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `bigint` | NO | `` |
| `estado_origen_id` | `bigint` | NO | `` |
| `estado_destino_id` | `bigint` | NO | `` |
| `action_key` | `text` | NO | `` |
| `actor_role_codigo` | `text` | NO | `` |
| `tipo_solicitud_codigo` | `text` | YES | `` |
| `activo` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Primary key:**
- `solicitud_estado_transicion_pkey`: `id`

**Relaciones:**
**FK salientes:**
- `estado_destino_id` → `public.estado.id` (`solicitud_estado_transicion_estado_destino_id_fkey`, on delete `CASCADE`)
- `estado_origen_id` → `public.estado.id` (`solicitud_estado_transicion_estado_origen_id_fkey`, on delete `CASCADE`)

**Restricciones UNIQUE/CHECK:**
- `solicitud_transicion_unique` (UNIQUE): `UNIQUE (estado_origen_id, estado_destino_id, action_key, actor_role_codigo, tipo_solicitud_codigo)`

**Índices:**
- `solicitud_estado_transicion_pkey`: `CREATE UNIQUE INDEX solicitud_estado_transicion_pkey ON public.solicitud_estado_transicion USING btree (id)`
- `solicitud_transicion_unique`: `CREATE UNIQUE INDEX solicitud_transicion_unique ON public.solicitud_estado_transicion USING btree (estado_origen_id, estado_destino_id, action_key, actor_role_codigo, tipo_solicitud_codigo)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_solicitud_estado_transicion_auth` [SELECT] roles: `authenticated`

### `public.solicitud_evento`

**Propósito:** Bitácora de eventos de negocio y auditoría.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `solicitud_id` | `uuid` | NO | `` |
| `ciclo` | `integer` | NO | `1` |
| `action_key` | `text` | NO | `` |
| `estado_anterior_id` | `bigint` | YES | `` |
| `estado_nuevo_id` | `bigint` | YES | `` |
| `creado_por_email` | `text` | YES | `` |
| `area_codigo` | `text` | YES | `` |
| `role_codigo` | `text` | YES | `` |
| `observacion` | `text` | YES | `` |
| `payload_anterior` | `jsonb` | YES | `` |
| `payload_nuevo` | `jsonb` | YES | `` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Primary key:**
- `solicitud_evento_pkey`: `id`

**Relaciones:**
**FK salientes:**
- `estado_anterior_id` → `public.estado.id` (`solicitud_evento_estado_anterior_id_fkey`, on delete `NO ACTION`)
- `estado_nuevo_id` → `public.estado.id` (`solicitud_evento_estado_nuevo_id_fkey`, on delete `NO ACTION`)
- `solicitud_id` → `public.solicitud_compra.id` (`solicitud_evento_solicitud_id_fkey`, on delete `CASCADE`)

**Restricciones UNIQUE/CHECK:**
_Sin UNIQUE/CHECK detectados._

**Índices:**
- `idx_solicitud_evento_solicitud`: `CREATE INDEX idx_solicitud_evento_solicitud ON public.solicitud_evento USING btree (solicitud_id, created_at DESC)`
- `solicitud_evento_pkey`: `CREATE UNIQUE INDEX solicitud_evento_pkey ON public.solicitud_evento USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_solicitud_evento_auth` [SELECT] roles: `authenticated`

### `public.vw_solicitudes_abandonables`

**Propósito:** Vista de solicitudes candidatas a descarte automático por supervisor. Usa el historial abierto que coincide con el estado actual y el ciclo actual para calcular `disponible_desde`.

**Tipo:** `VIEW`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | YES | `` |
| `folio_sol` | `text` | YES | `` |
| `disponible_desde` | `timestamp with time zone` | YES | `` |


**Definición de vista:**

```sql
SELECT sc.id,
    sc.folio_sol,
    h.fecha_inicio AS disponible_desde
   FROM ((solicitud_compra sc
     JOIN estado e ON ((e.id = sc.estado_id)))
     JOIN solicitud_estado_historial h ON (((h.solicitud_id = sc.id)
        AND (h.estado_id = sc.estado_id)
        AND (h.ciclo = sc.ciclo_estado)
        AND (h.fecha_fin IS NULL)
        AND (h.invalidado = false))))
  WHERE ((e.codigo = 'para_revision_supervisor'::text) AND (h.fecha_inicio <= (now() - '30 days'::interval)) AND (EXISTS ( SELECT 1
           FROM solicitud_producto_detalle d
          WHERE (d.solicitud_id = sc.id))) AND (NOT (EXISTS ( SELECT 1
           FROM solicitud_producto_detalle d
          WHERE ((d.solicitud_id = sc.id) AND (d.activo = true))))));
```

**RLS / Policies:**
- RLS: no detectado.

## Bloqueos de edición

| Objeto | Tipo | Propósito |
|---|---|---|
| `public.solicitud_compra_lock` | `BASE TABLE` | Bloqueo de edición de una solicitud completa. |
| `public.vw_solicitudes_bloqueadas` | `VIEW` | Vista de solicitudes con lock activo. |

### `public.solicitud_compra_lock`

**Propósito:** Bloqueo de edición de una solicitud completa.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `solicitud_id` | `uuid` | NO | `` |
| `locked_by_email` | `text` | NO | `` |
| `locked_by_area_id` | `bigint` | YES | `` |
| `locked_by_role_id` | `bigint` | YES | `` |
| `locked_at` | `timestamp with time zone` | NO | `now()` |
| `released_at` | `timestamp with time zone` | YES | `` |
| `activo` | `boolean` | NO | `true` |

**Primary key:**
- `solicitud_compra_lock_pkey`: `id`

**Relaciones:**
**FK salientes:**
- `locked_by_area_id` → `public.app_area.id` (`solicitud_compra_lock_locked_by_area_id_fkey`, on delete `NO ACTION`)
- `locked_by_role_id` → `public.app_role.id` (`solicitud_compra_lock_locked_by_role_id_fkey`, on delete `NO ACTION`)
- `solicitud_id` → `public.solicitud_compra.id` (`solicitud_compra_lock_solicitud_id_fkey`, on delete `CASCADE`)

**Restricciones UNIQUE/CHECK:**
- `solicitud_lock_email_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM locked_by_email)) > 0))`

**Índices:**
- `solicitud_compra_lock_one_active`: `CREATE UNIQUE INDEX solicitud_compra_lock_one_active ON public.solicitud_compra_lock USING btree (solicitud_id) WHERE (activo = true)`
- `solicitud_compra_lock_pkey`: `CREATE UNIQUE INDEX solicitud_compra_lock_pkey ON public.solicitud_compra_lock USING btree (id)`

**Triggers:**
_Sin triggers detectados._

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_solicitud_compra_lock_auth` [SELECT] roles: `authenticated`

### `public.vw_solicitudes_bloqueadas`

**Propósito:** Vista de solicitudes con lock activo.

**Tipo:** `VIEW`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `solicitud_id` | `uuid` | YES | `` |
| `folio_sol` | `text` | YES | `` |
| `estado_codigo` | `text` | YES | `` |
| `estado_nombre` | `text` | YES | `` |
| `locked_by_email` | `text` | YES | `` |
| `locked_by_area_codigo` | `text` | YES | `` |
| `locked_by_role_codigo` | `text` | YES | `` |
| `locked_at` | `timestamp with time zone` | YES | `` |
| `tiempo_bloqueada` | `interval` | YES | `` |
| `alerta_mas_2_dias` | `boolean` | YES | `` |


**Definición de vista:**

```sql
SELECT sc.id AS solicitud_id,
    sc.folio_sol,
    e.codigo AS estado_codigo,
    e.nombre AS estado_nombre,
    l.locked_by_email,
    ar.codigo AS locked_by_area_codigo,
    rr.codigo AS locked_by_role_codigo,
    l.locked_at,
    (now() - l.locked_at) AS tiempo_bloqueada,
    (l.locked_at <= (now() - '2 days'::interval)) AS alerta_mas_2_dias
   FROM ((((solicitud_compra_lock l
     JOIN solicitud_compra sc ON ((sc.id = l.solicitud_id)))
     JOIN estado e ON ((e.id = sc.estado_id)))
     LEFT JOIN app_area ar ON ((ar.id = l.locked_by_area_id)))
     LEFT JOIN app_role rr ON ((rr.id = l.locked_by_role_id)))
  WHERE ((l.activo = true) AND (l.released_at IS NULL));
```

**RLS / Policies:**
- RLS: no detectado.


## Adjuntos y Storage

| Objeto | Tipo | Propósito |
|---|---|---|
| `public.solicitud_adjunto` | `BASE TABLE` | Metadata de archivos subidos a Storage a nivel de solicitud. |
| `public.vw_solicitud_adjuntos` | `VIEW` | Vista de adjuntos activos por solicitud. |
| `storage.buckets` | `BASE TABLE` | Tabla interna de Supabase Storage para buckets. |
| `storage.objects` | `BASE TABLE` | Tabla interna de Supabase Storage para objetos/archivos. |

### `public.solicitud_adjunto`

**Propósito:** Metadata de archivos subidos a Storage a nivel de solicitud.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `solicitud_id` | `uuid` | NO | `` |
| `tipo_adjunto_id` | `bigint` | NO | `fn_tipo_adjunto_id('general'::text)` |
| `bucket_id` | `text` | NO | `'solicitudes-compras'::text` |
| `storage_path` | `text` | NO | `` |
| `nombre_original` | `text` | NO | `` |
| `mime_type` | `text` | NO | `` |
| `extension` | `text` | YES | `` |
| `size_bytes` | `bigint` | YES | `` |
| `descripcion` | `text` | YES | `` |
| `subido_por_email` | `text` | NO | `` |
| `subido_por_area_id` | `bigint` | YES | `` |
| `subido_por_role_id` | `bigint` | YES | `` |
| `eliminado` | `boolean` | NO | `false` |
| `eliminado_por_email` | `text` | YES | `` |
| `eliminado_at` | `timestamp with time zone` | YES | `` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | YES | `` |

**Primary key:**
- `solicitud_adjunto_pkey`: `id`

**Relaciones:**
**FK salientes:**
- `solicitud_id` → `public.solicitud_compra.id` (`solicitud_adjunto_solicitud_id_fkey`, on delete `CASCADE`)
- `subido_por_area_id` → `public.app_area.id` (`solicitud_adjunto_subido_por_area_id_fkey`, on delete `NO ACTION`)
- `subido_por_role_id` → `public.app_role.id` (`solicitud_adjunto_subido_por_role_id_fkey`, on delete `NO ACTION`)
- `tipo_adjunto_id` → `public.tipo_adjunto.id` (`solicitud_adjunto_tipo_adjunto_id_fkey`, on delete `NO ACTION`)

**Restricciones UNIQUE/CHECK:**
- `solicitud_adjunto_deleted_consistency` (CHECK): `CHECK ((((eliminado = false) AND (eliminado_at IS NULL)) OR ((eliminado = true) AND (eliminado_at IS NOT NULL))))`
- `solicitud_adjunto_email_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM subido_por_email)) > 0))`
- `solicitud_adjunto_mime_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM mime_type)) > 0))`
- `solicitud_adjunto_nombre_not_blank` (CHECK): `CHECK ((length(TRIM(BOTH FROM nombre_original)) > 0))`
- `solicitud_adjunto_size_bytes_check` (CHECK): `CHECK (((size_bytes IS NULL) OR (size_bytes >= 0)))`
- `solicitud_adjunto_storage_path_key` (UNIQUE): `UNIQUE (storage_path)`

**Índices:**
- `idx_solicitud_adjunto_solicitud`: `CREATE INDEX idx_solicitud_adjunto_solicitud ON public.solicitud_adjunto USING btree (solicitud_id, created_at DESC) WHERE (eliminado = false)`
- `idx_solicitud_adjunto_subido_por`: `CREATE INDEX idx_solicitud_adjunto_subido_por ON public.solicitud_adjunto USING btree (subido_por_email, created_at DESC)`
- `idx_solicitud_adjunto_tipo`: `CREATE INDEX idx_solicitud_adjunto_tipo ON public.solicitud_adjunto USING btree (tipo_adjunto_id) WHERE (eliminado = false)`
- `solicitud_adjunto_pkey`: `CREATE UNIQUE INDEX solicitud_adjunto_pkey ON public.solicitud_adjunto USING btree (id)`
- `solicitud_adjunto_storage_path_key`: `CREATE UNIQUE INDEX solicitud_adjunto_storage_path_key ON public.solicitud_adjunto USING btree (storage_path)`

**Triggers:**
- `trg_solicitud_adjunto_updated_at` BEFORE UPDATE: `EXECUTE FUNCTION fn_set_updated_at()`

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `select_solicitud_adjunto_auth` [SELECT] roles: `authenticated`
  - `solicitud_adjunto_no_direct_insert` [INSERT] roles: `authenticated`
  - `solicitud_adjunto_no_direct_update` [UPDATE] roles: `authenticated`
  - `solicitud_adjunto_select_auth` [SELECT] roles: `authenticated`

### `public.vw_solicitud_adjuntos`

**Propósito:** Vista de adjuntos activos por solicitud.

**Tipo:** `VIEW`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | YES | `` |
| `solicitud_id` | `uuid` | YES | `` |
| `folio_sol` | `text` | YES | `` |
| `tipo_adjunto_codigo` | `text` | YES | `` |
| `tipo_adjunto_nombre` | `text` | YES | `` |
| `bucket_id` | `text` | YES | `` |
| `storage_path` | `text` | YES | `` |
| `nombre_original` | `text` | YES | `` |
| `mime_type` | `text` | YES | `` |
| `extension` | `text` | YES | `` |
| `size_bytes` | `bigint` | YES | `` |
| `descripcion` | `text` | YES | `` |
| `subido_por_email` | `text` | YES | `` |
| `subido_por_area_codigo` | `text` | YES | `` |
| `subido_por_area_nombre` | `text` | YES | `` |
| `subido_por_role_codigo` | `text` | YES | `` |
| `subido_por_role_nombre` | `text` | YES | `` |
| `created_at` | `timestamp with time zone` | YES | `` |


**Definición de vista:**

```sql
SELECT a.id,
    a.solicitud_id,
    sc.folio_sol,
    ta.codigo AS tipo_adjunto_codigo,
    ta.nombre AS tipo_adjunto_nombre,
    a.bucket_id,
    a.storage_path,
    a.nombre_original,
    a.mime_type,
    a.extension,
    a.size_bytes,
    a.descripcion,
    a.subido_por_email,
    ar.codigo AS subido_por_area_codigo,
    ar.nombre AS subido_por_area_nombre,
    rr.codigo AS subido_por_role_codigo,
    rr.nombre AS subido_por_role_nombre,
    a.created_at
   FROM ((((solicitud_adjunto a
     JOIN solicitud_compra sc ON ((sc.id = a.solicitud_id)))
     JOIN tipo_adjunto ta ON ((ta.id = a.tipo_adjunto_id)))
     LEFT JOIN app_area ar ON ((ar.id = a.subido_por_area_id)))
     LEFT JOIN app_role rr ON ((rr.id = a.subido_por_role_id)))
  WHERE (a.eliminado = false);
```

**RLS / Policies:**
- RLS: no detectado.

### `storage.buckets`

**Propósito:** Tabla interna de Supabase Storage para buckets.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `text` | NO | `` |
| `name` | `text` | NO | `` |
| `owner` | `uuid` | YES | `` |
| `created_at` | `timestamp with time zone` | YES | `now()` |
| `updated_at` | `timestamp with time zone` | YES | `now()` |
| `public` | `boolean` | YES | `false` |
| `avif_autodetection` | `boolean` | YES | `false` |
| `file_size_limit` | `bigint` | YES | `` |
| `allowed_mime_types` | `ARRAY (_text)` | YES | `` |
| `owner_id` | `text` | YES | `` |
| `type` | `buckettype` | NO | `'STANDARD'::storage.buckettype` |

**Primary key:**
- `buckets_pkey`: `id`

**Relaciones:**
_Sin relaciones FK detectadas._

**Restricciones UNIQUE/CHECK:**
_Sin UNIQUE/CHECK detectados._

**Índices:**
- `bname`: `CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name)`
- `buckets_pkey`: `CREATE UNIQUE INDEX buckets_pkey ON storage.buckets USING btree (id)`

**Triggers:**
- `enforce_bucket_name_length_trigger` BEFORE UPDATE: `EXECUTE FUNCTION storage.enforce_bucket_name_length()`
- `enforce_bucket_name_length_trigger` BEFORE INSERT: `EXECUTE FUNCTION storage.enforce_bucket_name_length()`
- `protect_buckets_delete` BEFORE DELETE: `EXECUTE FUNCTION storage.protect_delete()`

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`

### `storage.objects`

**Propósito:** Tabla interna de Supabase Storage para objetos/archivos.

**Tipo:** `BASE TABLE`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `bucket_id` | `text` | YES | `` |
| `name` | `text` | YES | `` |
| `owner` | `uuid` | YES | `` |
| `created_at` | `timestamp with time zone` | YES | `now()` |
| `updated_at` | `timestamp with time zone` | YES | `now()` |
| `last_accessed_at` | `timestamp with time zone` | YES | `now()` |
| `metadata` | `jsonb` | YES | `` |
| `path_tokens` | `ARRAY (_text)` | YES | `` |
| `version` | `text` | YES | `` |
| `owner_id` | `text` | YES | `` |
| `user_metadata` | `jsonb` | YES | `` |

**Primary key:**
- `objects_pkey`: `id`

**Relaciones:**
_Sin relaciones FK detectadas._

**Restricciones UNIQUE/CHECK:**
_Sin UNIQUE/CHECK detectados._

**Índices:**
- `bucketid_objname`: `CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name)`
- `idx_objects_bucket_id_name`: `CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C")`
- `idx_objects_bucket_id_name_lower`: `CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C")`
- `name_prefix_search`: `CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops)`
- `objects_pkey`: `CREATE UNIQUE INDEX objects_pkey ON storage.objects USING btree (id)`

**Triggers:**
- `protect_objects_delete` BEFORE DELETE: `EXECUTE FUNCTION storage.protect_delete()`
- `update_objects_updated_at` BEFORE UPDATE: `EXECUTE FUNCTION storage.update_updated_at_column()`

**RLS / Policies:**
- RLS habilitado: `True`; forzado: `False`
- Políticas:
  - `solicitudes_compras_storage_insert` [INSERT] roles: `authenticated`
  - `solicitudes_compras_storage_select` [SELECT] roles: `authenticated`


## Órdenes de compra e importación

| Objeto | Tipo | Propósito |
|---|---|---|
| `public.oc_import_batch` | `BASE TABLE` | Lote de importación de órdenes de compra desde fuente externa. |
| `public.orden_compra` | `BASE TABLE` | Cabecera de orden de compra importada o sincronizada. |
| `public.orden_compra_detalle` | `BASE TABLE` | Detalle importado de orden de compra por producto/cantidad. |
| `public.orden_compra_import_staging` | `BASE TABLE` | Tabla staging para procesar filas crudas de importación OC. |
| `public.vw_solicitudes_con_diferencias_oc` | `VIEW` | Vista de diferencias entre cantidad aprobada/subida a sistema. |

### `public.oc_import_batch`

**Propósito:** Lote de importación de órdenes de compra desde fuente externa, con modo configurable de sincronización.

**Tipo:** `BASE TABLE`

**Columnas vigentes:**

| Columna | Tipo | Propósito |
|---|---|---|
| `id` | `uuid` | Identificador del batch. |
| `source_name` | `text` | Fuente externa, por ejemplo `powerbi_excel`. |
| `imported_by_email` | `text` | Usuario que importó. |
| `status` | `text` | `pendiente`, `procesando`, `procesado`, `error`. |
| `total_rows` | `integer` | Total filas recibidas. |
| `processed_rows` | `integer` | Filas procesadas. |
| `error_rows` | `integer` | Filas con error. |
| `import_mode` | `text` | `full_snapshot`, `window_snapshot` o `delta`. |
| `scope_from` | `date` | Inicio del rango para `window_snapshot`. |
| `scope_to` | `date` | Fin del rango para `window_snapshot`. |
| `scope_field` | `text` | Campo usado para evaluar el rango. |
| `is_complete_scope` | `boolean` | Permite marcar no vigente lo que no vino. |
| `source_file_at` | `timestamptz` | Fecha/hora de referencia del archivo. |
| `import_notes` | `text` | Notas de importación. |
| `unchanged_rows` | `integer` | Filas sin cambios. |
| `changed_rows` | `integer` | Filas actualizadas. |
| `inserted_rows` | `integer` | Filas insertadas. |
| `service_rows` | `integer` | Filas de servicio reemplazadas/cargadas. |
| `omitted_rows` | `integer` | Filas omitidas. |
| `created_at` | `timestamptz` | Creación. |
| `processed_at` | `timestamptz` | Cierre del procesamiento. |

**Modos:**

| Modo | Regla |
|---|---|
| `delta` | Actualiza solo lo recibido; no toca lo que no vino. |
| `window_snapshot` | Si `is_complete_scope = true`, marca no vigente lo que no vino dentro del rango. |
| `full_snapshot` | Si `is_complete_scope = true`, marca no vigente lo que no vino para esa fuente. |

**Restricciones esperadas:**

```sql
import_mode IN ('full_snapshot', 'window_snapshot', 'delta')
scope_field IN ('fecha_oc', 'fecha_entrega', 'fecha_compromiso', 'source_updated_at', 'created_at')
```
### `public.orden_compra`

**Propósito:** Cabecera de orden de compra importada/sincronizada.

**Reglas vigentes:**

- `folio_oc` identifica la OC.
- `folio_sol` relaciona la OC con `solicitud_compra.folio_sol`.
- Una solicitud puede tener varias OC.
- No se borra físicamente una OC que deja de aparecer; se usa `activo_fuente = false`.
- La fecha de proveedor/OC tiene prioridad visual sobre `fecha_entrega_sistema` y `fecha_entrega`.

**Columnas agregadas por importación sincronizada:**

| Columna | Propósito |
|---|---|
| `estado_codigo` | Estado OC normalizado. |
| `evaluacion`, `evaluacion_codigo` | Evaluación importada y normalizada. |
| `recepcion`, `recepcion_codigo` | Recepción importada y normalizada. |
| `comprador`, `responsable`, `area` | Datos informativos importados. |
| `monto_oc`, `fecha_oc` | Monto y fecha de emisión. |
| `source_name` | Fuente externa. |
| `last_seen_batch_id` | Último batch donde apareció. |
| `activo_fuente` | Vigencia según fuente. |
| `source_deleted_at`, `source_deleted_batch_id` | Marca de no vigencia. |
| `change_detected_at` | Último cambio real detectado. |
### `public.orden_compra_detalle`

**Propósito:** Detalle importado de OC por producto o servicio, con identidad estable de línea.

**Cambios aplicados por conflicto:**

- Se elimina del contexto `descripcion_producto` como dato oficial del detalle OC.
- La descripción oficial se obtiene desde `producto`; si no existe código, la vista muestra `Producto no registrado en sistema interno`.
- Se elimina la identidad vieja basada en `row_hash`.

**Columnas vigentes relevantes:**

| Columna | Propósito |
|---|---|
| `linea_fuente` | Línea externa si la fuente la trae; no es `linea_solicitud`. |
| `source_identity_key` | Identidad estable de la línea importada. |
| `source_name` | Fuente externa. |
| `last_seen_batch_id` | Último batch donde apareció. |
| `activo_fuente` | Vigencia. |
| `source_deleted_at`, `source_deleted_batch_id` | Marca de no vigencia. |
| `change_detected_at` | Último cambio real. |
| `requiere_revision`, `revision_codigo`, `revision_label` | Resultado de comparación/revisión. |
| `es_servicio_importado` | Línea de servicio importada. |
| `descripcion_importada` | Descripción/concepto importado, especialmente para servicios. |

**Identidad vigente:**

```sql
UNIQUE (folio_oc, folio_sol, source_identity_key)
```

**Reglas:**

- `row_hash` solo detecta cambios, no identifica la línea.
- Si existe `linea_fuente`, usar `linea_fuente:<valor>` como identidad.
- Si no existe `linea_fuente`, usar `producto:<cod_producto>`.
- Para servicios importados sin identidad estable, se reemplazan líneas del servicio según batch/archivo.
- `orden_compra_detalle.cantidad` es cantidad comprada; no se copia a `cantidad_solicitada_sistema`.
### `public.orden_compra_import_staging`

**Propósito:** Tabla staging para procesar filas crudas de importación OC.

**Columnas agregadas al contexto vigente:**

| Columna | Propósito |
|---|---|
| `import_action` | Resultado por fila: `insertado`, `actualizado`, `sin_cambios`, `servicio_reemplazado`, `omitido` o `error`. |
| `normalized_folio_oc` | Folio OC normalizado. |
| `normalized_folio_sol` | Folio solicitud/requisición normalizado. |
| `normalized_cod_producto` | Código de producto normalizado. |
| `source_identity_key` | Clave estable calculada para el detalle. |

**Regla:**

`line_number` existe solo para staging/archivo; no significa línea OC ni línea interna de solicitud.
### `public.vw_solicitudes_con_diferencias_oc`

**Propósito:** Vista de diferencias vigentes entre app, sistema externo de compras y OC importada.

**Reglas vigentes:**

- Lee desde `solicitud_compra_diferencia`.
- Incluye `linea_solicitud` cuando la diferencia corresponde a un detalle interno.
- No calcula diferencias para solicitudes tipo servicio.
- No muestra diferencias si no existe OC o dato externo aplicable.

**Campos esperados:**

```txt
linea_solicitud
fuente
diferencia_codigo
diferencia_label
cantidad_gerencia
cantidad_solicitada_sistema
cantidad_comprada
folio_oc
cod_producto
```
## Vistas para frontend, listas y badges

| Objeto | Tipo | Propósito |
|---|---|---|
| `public.vw_solicitudes_lista` | `VIEW` | Vista principal para listado de solicitudes con badges y conteos. |
| `public.vw_solicitud_detalle_completo` | `VIEW` | Vista de detalle completo de solicitud para frontend. |
| `public.vw_solicitudes_pendientes_badges` | `VIEW` | Vista agregada para badges de pendientes por estado. |

### `public.vw_solicitudes_lista`

**Propósito:** Vista principal para listado con badges, fechas operativas, OC agregadas y diferencias.

**Cambios aplicados por conflicto:**

- No debe seleccionar `sc.folio_oc` porque `folio_oc` no pertenece a `solicitud_compra`.
- Los folios OC se obtienen desde `orden_compra`.
- La fecha mostrada usa prioridad: proveedor/OC > sistema > original.

**Campos OC agregados esperados:**

```txt
cantidad_oc
folio_oc_principal
folios_oc
ordenes_compra_resumen
estado_oc_principal
evaluacion_principal
recepcion_principal
proveedor_principal
```

**Fecha mostrada:**

```sql
COALESCE(fecha_entrega_proveedor, fecha_entrega_sistema, fecha_entrega)
```

**Badges:**

- `Bloqueado` visible para todos si aplica.
- `Diferencia OC` solo cuando existe diferencia activa y rol puede verla.
- Secretaría no ve folio OC ni Diferencia OC.
- Almacén no ve folio, folio OC, adjuntos ni Diferencia OC en listado.
### `public.vw_solicitud_detalle_completo`

**Propósito:** Vista de detalle completo de solicitud para frontend.

**Reglas vigentes:**

- `productos` debe incluir `linea_solicitud`, `cantidad_solicitada_sistema`, `requiere_revision_sistema`, `revision_sistema_codigo`, `revision_sistema_label` y `ciclo`.
- `servicios` debe incluir `linea_solicitud` y `ciclo`.
- OC se obtiene desde `orden_compra` y `orden_compra_detalle`, no desde `solicitud_compra.folio_oc`.
- La fecha mostrada usa `COALESCE(fecha_entrega_proveedor, fecha_entrega_sistema, fecha_entrega)`.
- Para gerencia, la vista operativa debe filtrar productos/servicios activos del ciclo actual cuando se use en revisión.

**Vista relacionada recomendada:**

```txt
vw_solicitud_detalle_gerencia_ciclo_actual
```

Uso: mostrar a gerencia únicamente productos y servicios activos cuyo `ciclo` coincide con `solicitud_compra.ciclo_estado`.
### `public.vw_solicitudes_pendientes_badges`

**Propósito:** Vista agregada para badges de pendientes por estado.

**Tipo:** `VIEW`

**Columnas:**

| Columna | Tipo | Nullable | Default |
|---|---|---:|---|
| `estado_codigo` | `text` | YES | `` |
| `estado_nombre` | `text` | YES | `` |
| `total` | `bigint` | YES | `` |


**Definición de vista:**

```sql
SELECT estado_codigo,
    estado_nombre,
    count(*) AS total
   FROM vw_solicitudes_lista
  WHERE (estado_codigo = ANY (ARRAY['para_revision_almacen'::text, 'para_revision_supervisor'::text, 'para_revision_gerencia'::text, 'aprobado'::text, 'subido_sistema_compra'::text, 'orden_compra'::text, 'oc_recibido_parcial_almacen'::text]))
  GROUP BY estado_codigo, estado_nombre;
```

**RLS / Policies:**
- RLS: no detectado.


## Funciones y RPC por submódulo

### Helpers internos

| Función/RPC | Seguridad | Volatilidad | Lenguaje |
|---|---|---|---|
| `fn_compras_normalize(p_text text)` → `text` | `SECURITY DEFINER=False` | `immutable` | `sql` |
| `fn_current_email()` → `text` | `SECURITY DEFINER=False` | `stable` | `sql` |
| `fn_estado_codigo(p_estado_id bigint)` → `text` | `SECURITY DEFINER=False` | `stable` | `sql` |
| `fn_estado_id(p_codigo text)` → `bigint` | `SECURITY DEFINER=False` | `stable` | `sql` |
| `fn_generar_codigo_producto_temporal()` → `text` | `SECURITY DEFINER=False` | `volatile` | `sql` |
| `fn_get_actor_area_codigo(p_email text)` → `text` | `SECURITY DEFINER=True` | `stable` | `plpgsql` |
| `fn_get_actor_area_id(p_email text)` → `bigint` | `SECURITY DEFINER=True` | `stable` | `sql` |
| `fn_get_actor_role_codigo(p_email text)` → `text` | `SECURITY DEFINER=True` | `stable` | `plpgsql` |
| `fn_get_actor_role_id(p_email text)` → `bigint` | `SECURITY DEFINER=True` | `stable` | `sql` |
| `fn_prioridad_id(p_codigo text)` → `bigint` | `SECURITY DEFINER=False` | `stable` | `sql` |
| `fn_require_actor(p_allowed_roles text[])` → `jsonb` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `fn_set_solicitud_estado(p_solicitud_id uuid, p_estado_codigo text, p_action_key text DEFAULT 'cambiar_estado'::text, p_observacion text DEFAULT NULL::text, p_payload_anterior jsonb DEFAULT NULL::jsonb, p_payload_nuevo jsonb DEFAULT NULL::jsonb)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `fn_set_updated_at()` → `trigger` | `SECURITY DEFINER=False` | `volatile` | `plpgsql` |
| `fn_solicitud_estado_codigo(p_solicitud_id uuid)` → `text` | `SECURITY DEFINER=False` | `stable` | `sql` |
| `fn_solicitud_lock_pertenece_usuario(p_solicitud_id uuid, p_email text)` → `boolean` | `SECURITY DEFINER=False` | `stable` | `sql` |
| `fn_solicitud_tiene_lock_activo(p_solicitud_id uuid)` → `boolean` | `SECURITY DEFINER=False` | `stable` | `sql` |
| `fn_tipo_adjunto_id(p_codigo text)` → `bigint` | `SECURITY DEFINER=False` | `stable` | `sql` |
| `fn_tipo_solicitud_id(p_codigo text)` → `bigint` | `SECURITY DEFINER=False` | `stable` | `sql` |
| `fn_unidad_id(p_codigo text)` → `bigint` | `SECURITY DEFINER=False` | `stable` | `sql` |

### Workflow de solicitudes

| Función/RPC | Seguridad | Volatilidad | Lenguaje |
|---|---|---|---|
| `rpc_actualizar_borrador_solicitud(p_solicitud_id uuid, p_fecha_entrega date, p_observacion text, p_prioridad_codigo text DEFAULT 'normal'::text)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_agregar_producto_solicitud(p_solicitud_id uuid, p_producto_id uuid, p_cantidad numeric)` → `uuid` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_agregar_producto_temporal_solicitud(p_solicitud_id uuid, p_descripcion text, p_unidad_codigo text, p_cantidad numeric)` → `uuid` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_agregar_servicio_solicitud(p_solicitud_id uuid, p_descripcion text, p_cantidad numeric DEFAULT 1, p_unidad_codigo text DEFAULT 'servicio'::text)` → `uuid` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_aprobar_solicitud(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_crear_borrador_solicitud(p_tipo_codigo text, p_fecha_entrega date, p_observacion text DEFAULT ''::text, p_prioridad_codigo text DEFAULT 'normal'::text)` → `uuid` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_devolver_a_supervisor(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_enviar_a_almacen(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_enviar_a_gerencia(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_enviar_a_supervisor(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_enviar_servicio_a_gerencia(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_guardar_revision_almacen(p_solicitud_id uuid, p_detalles jsonb)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_guardar_revision_gerencia(p_solicitud_id uuid, p_productos jsonb DEFAULT '[]'::jsonb, p_servicios jsonb DEFAULT '[]'::jsonb)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_guardar_revision_supervisor(p_solicitud_id uuid, p_detalles jsonb)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_marcar_subido_sistema(p_solicitud_id uuid, p_folio_sol text, p_fecha_entrega date DEFAULT NULL::date)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |

> Contexto actualizado: en esta RPC, `p_fecha_entrega` debe guardarse en `solicitud_compra.fecha_entrega_sistema`, no sobrescribir `solicitud_compra.fecha_entrega`. Esta RPC no debe escribir `solicitud_compra.folio_oc`; `folio_oc` se llena únicamente al importar/procesar órdenes de compra. La auditoría del cambio se maneja con `solicitud_evento.payload_anterior` y `solicitud_evento.payload_nuevo`.
| `rpc_rechazar_solicitud(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_reenviar_a_almacen(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |

### Locks y toma de revisión

| Función/RPC | Seguridad | Volatilidad | Lenguaje |
|---|---|---|---|
| `rpc_liberar_edicion_propia(p_solicitud_id uuid)` → `boolean` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_tomar_revision_almacen(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_tomar_revision_gerencia(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_tomar_revision_supervisor(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_tomar_subida_sistema(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `tomar_solicitud_para_edicion(p_solicitud_id uuid, p_creado_por text)` → `jsonb` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `tomar_solicitud_para_edicion(p_solicitud_id uuid, p_estado_edicion_id integer, p_creado_por text)` → `jsonb` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |


### Secretaría delegada y correcciones

| Función/RPC | Seguridad | Volatilidad | Lenguaje |
|---|---|---|---|
| `rpc_secretaria_crear_correccion_sistema_compras(...)` → `uuid` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_secretaria_crear_solicitud_gerencia_normal(...)` → `uuid` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `fn_secretaria_get_usuario(p_email text)` → `record/json` | `SECURITY DEFINER=True` | `stable` | `plpgsql` |

Regla: estos RPC son la única vía para crear solicitudes de Secretaría en representación de otro usuario o por corrección administrativa.

### Adjuntos

| Función/RPC | Seguridad | Volatilidad | Lenguaje |
|---|---|---|---|
| `rpc_eliminar_solicitud_adjunto(p_adjunto_id uuid)` → `boolean` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_registrar_solicitud_adjunto(p_solicitud_id uuid, p_storage_path text, p_nombre_original text, p_mime_type text, p_extension text DEFAULT NULL::text, p_size_bytes bigint DEFAULT NULL::bigint, p_tipo_adjunto_codigo text DEFAULT 'general'::text, p_descripcion text DEFAULT NULL::text)` → `uuid` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |

### Órdenes de compra / importación

| Función/RPC | Seguridad | Volatilidad | Lenguaje |
|---|---|---|---|
| `rpc_importar_oc_staging(p_rows jsonb)` → `uuid` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_marcar_oc_recibida_completa(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_marcar_oc_recibida_parcial(p_solicitud_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |
| `rpc_procesar_importacion_oc(p_batch_id uuid)` → `void` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |

### Automatización / pg_cron

| Función/RPC | Seguridad | Volatilidad | Lenguaje |
|---|---|---|---|
| `rpc_descartar_solicitudes_abandonadas()` → `integer` | `SECURITY DEFINER=True` | `volatile` | `plpgsql` |

## Storage

### Buckets detectados

| Bucket | Público | Límite bytes | MIME permitidos |
|---|---:|---:|---|
| `solicitudes-compras` | `False` | `10485760` | `image/jpeg, image/png, image/webp, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/plain` |

### Relación con el módulo

- Los archivos físicos van en el bucket `solicitudes-compras`.
- La metadata funcional va en `public.solicitud_adjunto`.
- Los adjuntos están a nivel de solicitud, no de detalle ni de orden de compra.

## Relaciones globales principales

| Origen | Relación | Destino | Regla delete |
|---|---|---|---|
| `app_usuario.area_id` | FK | `app_area.id` | `NO ACTION` |
| `app_usuario.role_id` | FK | `app_role.id` | `NO ACTION` |
| `estado_contexto.estado_id` | FK | `estado.id` | `CASCADE` |
| `orden_compra.solicitud_id` | FK | `solicitud_compra.id` | `SET NULL` |
| `orden_compra_detalle.orden_compra_id` | FK | `orden_compra.id` | `CASCADE` |
| `orden_compra_detalle.solicitud_id` | FK | `solicitud_compra.id` | `SET NULL` |
| `orden_compra_import_staging.batch_id` | FK | `oc_import_batch.id` | `CASCADE` |
| `precio_producto.producto_id` | FK | `producto.id` | `CASCADE` |
| `producto.unidad_medida_id` | FK | `unidad_medida.id` | `NO ACTION` |
| `producto_codigo_resolucion.producto_real_id` | FK | `producto.id` | `NO ACTION` |
| `producto_codigo_resolucion.producto_temporal_id` | FK | `producto.id` | `NO ACTION` |
| `producto_codigo_resolucion.solicitud_producto_detalle_id` | FK | `solicitud_producto_detalle.id` | `CASCADE` |
| `solicitud_adjunto.solicitud_id` | FK | `solicitud_compra.id` | `CASCADE` |
| `solicitud_adjunto.subido_por_area_id` | FK | `app_area.id` | `NO ACTION` |
| `solicitud_adjunto.subido_por_role_id` | FK | `app_role.id` | `NO ACTION` |
| `solicitud_adjunto.tipo_adjunto_id` | FK | `tipo_adjunto.id` | `NO ACTION` |
| `solicitud_compra.area_solicitante_id` | FK | `app_area.id` | `NO ACTION` |
| `solicitud_compra.estado_id` | FK | `estado.id` | `NO ACTION` |
| `solicitud_compra.prioridad_id` | FK | `prioridad.id` | `NO ACTION` |
| `solicitud_compra.role_solicitante_id` | FK | `app_role.id` | `NO ACTION` |
| `solicitud_compra.tipo_solicitud_id` | FK | `tipo_solicitud.id` | `NO ACTION` |
| `solicitud_compra_lock.locked_by_area_id` | FK | `app_area.id` | `NO ACTION` |
| `solicitud_compra_lock.locked_by_role_id` | FK | `app_role.id` | `NO ACTION` |
| `solicitud_compra_lock.solicitud_id` | FK | `solicitud_compra.id` | `CASCADE` |
| `solicitud_equipo.solicitud_id` | FK | `solicitud_compra.id` | `CASCADE` |
| `solicitud_estado_historial.estado_id` | FK | `estado.id` | `NO ACTION` |
| `solicitud_estado_historial.solicitud_id` | FK | `solicitud_compra.id` | `CASCADE` |
| `solicitud_estado_transicion.estado_destino_id` | FK | `estado.id` | `CASCADE` |
| `solicitud_estado_transicion.estado_origen_id` | FK | `estado.id` | `CASCADE` |
| `solicitud_evento.estado_anterior_id` | FK | `estado.id` | `NO ACTION` |
| `solicitud_evento.estado_nuevo_id` | FK | `estado.id` | `NO ACTION` |
| `solicitud_evento.solicitud_id` | FK | `solicitud_compra.id` | `CASCADE` |
| `solicitud_producto_detalle.estado_detalle_id` | FK | `estado.id` | `NO ACTION` |
| `solicitud_producto_detalle.producto_id` | FK | `producto.id` | `NO ACTION` |
| `solicitud_producto_detalle.solicitud_id` | FK | `solicitud_compra.id` | `CASCADE` |
| `solicitud_producto_detalle.unidad_medida_id` | FK | `unidad_medida.id` | `NO ACTION` |
| `solicitud_servicio_detalle.estado_detalle_id` | FK | `estado.id` | `NO ACTION` |
| `solicitud_servicio_detalle.solicitud_id` | FK | `solicitud_compra.id` | `CASCADE` |
| `solicitud_servicio_detalle.unidad_medida_id` | FK | `unidad_medida.id` | `NO ACTION` |

## Notas para IA

- No inventar columnas: usar los nombres exactos listados en este documento.
- Para estados usar `estado.codigo`, no IDs numéricos.
- La escritura crítica debe hacerse por RPC: cambios de estado, aprobación, rechazo, locks, importación y adjuntos.
- `solicitud_compra` es la cabecera; productos, servicios, equipos, adjuntos, historial, locks y OC dependen de ella.
- `folio_oc` reemplaza a `folio_sistema_compra` y representa el folio de la orden de compra importada; no lo llena Secretaría al marcar subida al sistema.
- `fecha_entrega` es la fecha original solicitada; `fecha_entrega_sistema` es la fecha registrada por Secretaría al subir al sistema.
- No sobrescribir `fecha_entrega` desde `rpc_marcar_subido_sistema`; si Secretaría informa una fecha, guardar en `fecha_entrega_sistema`.
- No escribir `folio_oc` desde `rpc_marcar_subido_sistema`; ese valor se llena desde el proceso de importación de OC.
- Para frontend, usar `fecha_entrega_mostrada = COALESCE(fecha_entrega_sistema, fecha_entrega)` cuando se quiera mostrar la fecha operativa actual.
- Para detectar cambio de fecha del sistema, usar `fecha_entrega_sistema_diferente = fecha_entrega_sistema IS NOT NULL AND fecha_entrega_sistema <> fecha_entrega`.
- `disponible_desde` debe salir del historial abierto que coincida con el estado actual: `h.estado_id = sc.estado_id`, `h.ciclo = sc.ciclo_estado`, `h.fecha_fin IS NULL` y `h.invalidado = false`.
- `solicitud_adjunto` solo apunta a `solicitud_compra`; no se relaciona con detalles ni OC.
- `solicitud_estado_historial` y `solicitud_evento` son las tablas clave para tracking.
- `solicitud_compra_lock` controla edición concurrente.
- `orden_compra` y `orden_compra_detalle` provienen de importación externa; no son el núcleo de edición de la solicitud.
- `storage` es interno de Supabase; no modificar directamente salvo policies/buckets necesarios.

# Tema actualizado: línea interna, importación OC y Secretaría delegada/corrección

Actualizado: `2026-06-15`.

## 1. Línea interna de productos y servicios

Se adopta la lógica de líneas internas generadas **solo al llegar a aprobación de gerencia**.

### Regla principal

```txt
linea_solicitud se mantiene NULL mientras la solicitud está en revisión.
linea_solicitud se genera cuando la solicitud llega al estado configurado por fn_estado_generar_linea_solicitud().
Estado configurado actualmente: aprobado_gerencia.
```

### Tablas con línea interna

| Tabla | Regla |
|---|---|
| `solicitud_producto_detalle` | Tiene `linea_solicitud integer NULL`. Se numera al aprobar gerencia. |
| `solicitud_servicio_detalle` | Tiene `linea_solicitud integer NULL`. Se numera al aprobar gerencia. |

### Reglas de numeración

- Solo se numeran detalles activos.
- Solo se numeran detalles del ciclo actual.
- No se numeran detalles descartados/inactivos.
- No se renumeran líneas existentes.
- No se copian líneas desde una solicitud original cuando Secretaría crea una corrección.
- La numeración es independiente por tabla: productos tienen sus líneas y servicios tienen sus líneas.
- La línea interna no viene de Excel, Power BI ni OC.

### Ciclos y devolución de gerencia

- Cuando gerencia devuelve, `solicitud_compra.ciclo_estado` aumenta.
- Cuando supervisor vuelve a enviar a gerencia, se actualiza el `ciclo` de productos/servicios activos al ciclo actual.
- No se crean registros nuevos para cambiar ciclo.
- Los descartados/inactivos quedan en su ciclo histórico.
- Antes de mover productos activos, se valida que no haya duplicados que rompan `UNIQUE (solicitud_id, producto_id, ciclo)`.

## 2. Importación OC

La importación se maneja como sincronización con tres modos:

| Modo | Regla |
|---|---|
| `delta` | Actualiza solo lo que vino; no toca lo que no vino. |
| `window_snapshot` | Si `is_complete_scope = true`, marca no vigente lo que no vino dentro del rango. |
| `full_snapshot` | Si `is_complete_scope = true`, marca no vigente lo que no vino para esa fuente. |

### Identidad de línea importada

```txt
source_identity_key = identidad estable de la línea importada.
row_hash = detector de cambios.
```

No usar `row_hash` como parte de la identidad.

### Folio OC

- `folio_oc` no vive en `solicitud_compra`.
- `folio_oc` vive en `orden_compra` y `orden_compra_detalle`.
- Una solicitud puede tener varias OC.
- Secretaría no llena `folio_oc` al marcar subida al sistema.

### Cantidades

| Campo | Significado |
|---|---|
| `solicitud_producto_detalle.cantidad` | Cantidad solicitada originalmente. |
| `solicitud_producto_detalle.cantidad_gerencia` | Cantidad aprobada por gerencia. |
| `solicitud_producto_detalle.cantidad_solicitada_sistema` | Cantidad registrada/solicitada en sistema externo. |
| `orden_compra_detalle.cantidad` | Cantidad comprada en OC. |

La cantidad comprada en OC no debe copiarse a `cantidad_solicitada_sistema`.

### Servicios en importación

- Se puede guardar OC de servicios.
- No se calculan diferencias OC para solicitudes tipo servicio.
- No se compara servicio por descripción.
- Las líneas importadas de servicio se reemplazan según la estrategia definida, porque no tienen identidad estable por producto.

## 3. Secretaría: delegación y corrección

Se agrega una tabla única:

```txt
solicitud_creacion_delegada
```

No se agregan columnas nuevas a `solicitud_compra` para esta auditoría.

### Casos soportados

| Caso | RPC | Flujo |
|---|---|---|
| Corrección por error de Secretaría al subir/registrar en sistema de compras | `rpc_secretaria_crear_correccion_sistema_compras` | Crea una solicitud nueva ya en `aprobado_gerencia`, con solo lo corregido. Puede ser para área operativa o gerencia. |
| Solicitud normal creada por Secretaría a nombre de gerencia | `rpc_secretaria_crear_solicitud_gerencia_normal` | Sigue el flujo normal. Si es servicio, va directo a gerencia. Si es producto, sigue flujo normal de productos. |

### Tabla `solicitud_creacion_delegada`

Campos principales:

```txt
solicitud_id
solicitud_origen_id
creada_por_email
creada_por_area_id
creada_por_role_id
creada_para_email
creada_para_area_id
creada_para_role_id
tipo_delegacion
motivo
payload
created_at
updated_at
```

### Reglas de corrección

- La corrección no modifica la solicitud original.
- La nueva solicitud contiene solo los productos/servicios que se corrigen.
- El detalle de la corrección se guarda en `payload`.
- No se crea tabla `solicitud_detalle_correccion`.
- La nueva solicitud genera sus propias líneas internas.
- La línea original puede guardarse como referencia dentro de `payload`.

### Reglas de validación

- Solo usuarios con rol `secretaria` pueden ejecutar estos RPC.
- Para solicitud normal por Secretaría, el representado debe ser `gerencia`.
- Para corrección, el representado puede ser área operativa o gerencia.
- Las solicitudes normales de gerencia creadas por Secretaría respetan el flujo del tipo de solicitud.

## 4. Reglas finales para IA y desarrollo

- No inventar `folio_oc` en `solicitud_compra`.
- No mezclar `linea_solicitud` con `linea_fuente`.
- No usar `row_hash` como identidad de línea OC.
- No copiar cantidad comprada a `cantidad_solicitada_sistema`.
- No calcular diferencias OC para servicios.
- No borrar físicamente OC ni líneas que dejan de aparecer; usar `activo_fuente = false`.
- Generar `linea_solicitud` solo al aprobar gerencia.
- No crear detalles nuevos para cambiar ciclo; actualizar `ciclo` solo en activos.
- Auditar delegación/corrección de Secretaría en `solicitud_creacion_delegada.payload`.
