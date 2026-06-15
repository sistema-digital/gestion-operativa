# Specs granulares — Listado de Solicitudes de Compra

> Módulo: Compras / Solicitudes de Compra  
> Stack: Vue 3 + TypeScript estricto + Pinia + Supabase + Tailwind  
> Fuente principal de datos: `rpc_obtener_solicitudes_lista_usuario`  
> Vista principal confirmada: `src/views/compras/SolicitudesCompraView.vue`  
> Store confirmado: `src/stores/db_compras/solicitudes_compra/`

## Contexto obligatorio antes de implementar

Antes de implementar este spec, leer:

```txt
referencias/fileproject_ubicacion_archivos.md
referencias/contexto_bd_compras_por_submodulos_CORREGIDO_2026_06_15.md
referencias/contexto_final_CORREGIDO_2026_06_15.md
referencias/screen_list_Desktop.png
referencias/screen_main_mobile.png
```

Reglas transversales:

- No modificar base de datos desde estos specs.
- No crear migraciones.
- No crear rutas de detalle todavía.
- No implementar creación de solicitud todavía.
- No implementar carga real de equipos todavía.
- No usar PrimeVue; solo Tailwind y componentes Vue propios.
- No llamar `.rpc(...)` ni `.from(...)` fuera de archivos `.service.ts`.
- No declarar tipos dentro del store.
- Usar `estado.codigo`, no IDs numéricos.
- `folio_oc` no pertenece a `solicitud_compra`; viene agregado desde OC/importación.
- `PROFILE` y equipos son dependencias externas: no se crean, no se eliminan y no se alteran desde este módulo.

---

# SPEC-10 — Tabla desktop base

## Objetivo

Crear la tabla desktop dinámica por rol para el listado de solicitudes.

## Archivos a crear

```txt
src/components/compras/list/desktop/SolicitudesDesktopTable.vue
```

## Subspec lógica

Props:

```txt
items: SolicitudCompraListItem[]
roleCodigo: SolicitudCompraRoleCodigo
loading: boolean
loadingMore: boolean
```

Emits:

```txt
row-click
```

Reglas:

- Obtener columnas desde `solicitudListRoleConfig.ts`.
- No hardcodear columnas por rol dentro del template principal.
- Usar un renderer por `columnKey`.
- La fila completa es clickeable.
- No mostrar botón `Ver`.
- No implementar navegación.
- No tener scroll vertical interno.
- La página puede crecer verticalmente.

## Subspec types

Usar:

```txt
SolicitudCompraListItem
SolicitudCompraRoleCodigo
SolicitudCompraColumnKey
```

## Subspec views / components

Celdas usadas:

```txt
SolicitudFolioCell.vue
SolicitudObservacionCell.vue
SolicitudEstadoBadge.vue
SolicitudPrioridadBadge.vue
SolicitudEquiposCell.vue
SolicitudFechaEntregaCell.vue
SolicitudIndicadoresCell.vue
SolicitudAreaCell.vue
SolicitudSolicitanteCell.vue
SolicitudBloqueadoCell.vue
```

### Columnas por rol

La tabla debe respetar `solicitudListRoleConfig.ts`:

```txt
operativo: folio, observacion, estado, prioridad, equipos, fechaEntrega, indicadores
admin: folio, observacion, estado, prioridad, equipos, area, solicitante, fechaEntrega, indicadores
gerencia: folio, observacion, estado, prioridad, equipos, area, fechaEntrega, indicadores
almacen: observacion, area, prioridad, estado, bloqueado
secretaria: folio, observacion, area, solicitante, prioridad, estado, fechaEntrega, bloqueado
```

### Estilo desktop ERP

La tabla debe parecer ERP administrativo:

```txt
fuente base 12px a 13px
headers 11px a 12px
filas 72px a 92px
padding px-2/px-3 py-2
badges compactos
chips compactos
observación hasta 3 líneas
```

No usar filas enormes tipo dashboard:

```txt
no 108px a 128px
no inputs grandes
no cards
```

### Observación

- Debe ser la columna principal.
- Debe tener mayor ancho que otras columnas.
- Debe usar `line-clamp-3`.
- Si excede, corta con `...`.

### Folio

- Mostrar `#folio_sol`.
- Mostrar OC debajo solo si existe y el rol lo permite.
- No mostrar `Sin OC`.

### Equipos

- Mostrar chips mock `422005`, `422009`, `422014`.
- Soportar `loading` para futuro.
- Máximo 3 chips visibles y `+N` si hay más.

## No hacer

- No llamar Supabase.
- No cargar equipos reales.
- No implementar búsqueda.
- No implementar navegación.
- No mostrar rol como label visual.
- No duplicar permisos por rol dentro de cada celda si se puede usar config.

## Criterios de aceptación

- La tabla cambia columnas según rol.
- Desktop se ve tipo ERP administrativo.
- Se ven varias filas sin zoom exagerado.
- No hay cards en desktop.
- La fila completa es clickeable.
- No hay botón Ver.
