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

# SPEC-11 — Celdas reutilizables desktop/mobile

## Objetivo

Crear componentes pequeños para renderizar cada campo del listado sin dejar una tabla/card con lógica gigante.

## Archivos a crear

```txt
src/components/compras/list/cells/SolicitudFolioCell.vue
src/components/compras/list/cells/SolicitudObservacionCell.vue
src/components/compras/list/cells/SolicitudEstadoBadge.vue
src/components/compras/list/cells/SolicitudPrioridadBadge.vue
src/components/compras/list/cells/SolicitudEquiposCell.vue
src/components/compras/list/cells/SolicitudFechaEntregaCell.vue
src/components/compras/list/cells/SolicitudIndicadoresCell.vue
src/components/compras/list/cells/SolicitudAreaCell.vue
src/components/compras/list/cells/SolicitudSolicitanteCell.vue
src/components/compras/list/cells/SolicitudBloqueadoCell.vue
```

## Subspec lógica

Reglas generales para todas las celdas:

- Reciben props.
- Emiten eventos solo si es estrictamente necesario.
- No llaman stores.
- No llaman Supabase.
- No conocen paginación.
- No cargan datos externos.
- No implementan navegación.

### SolicitudFolioCell

Props sugeridas:

```txt
folio
canSeeOc
compact
```

Reglas:

- Mostrar `#folioSol` si existe.
- Mostrar OC debajo solo si `canSeeOc = true` y `folioOcPrincipal` existe.
- Texto OC más pequeño, opaco y secundario.
- No mostrar `Sin OC`.

### SolicitudObservacionCell

Props:

```txt
observacion
```

Reglas:

- Usar `line-clamp-3`.
- No mostrar tooltip obligatorio.
- No expandir inline.

### SolicitudEstadoBadge

Props:

```txt
estado
```

Reglas:

- Usar `badgeLabel` si existe.
- Si no, usar `estado.nombre`.
- Estilo suave teal/verde.
- Compacto en desktop, cómodo en mobile.

### SolicitudPrioridadBadge

Props:

```txt
prioridad
```

Reglas de color:

```txt
urgente: rojo suave
alta: dorado/ámbar
normal: gris/beige
baja: gris suave
```

Debe funcionar aunque llegue prioridad desconocida.

### SolicitudEquiposCell

Props:

```txt
equipos
```

Reglas:

- Si `loading = true`, mostrar loader pequeño.
- Si `error`, mostrar indicador discreto o nada según diseño.
- Si hay códigos, mostrar chips.
- Máximo 3 visibles.
- Si hay más, mostrar `+N`.
- Por ahora recibirá mock.

### SolicitudFechaEntregaCell

Props:

```txt
fechaEntrega
```

Reglas:

- Mostrar una sola fecha.
- Formato visual recomendado: `18 Jun 2026`.
- No mostrar nombre técnico del origen.
- Puede mostrar texto secundario `Entrega` si se mantiene como en referencia desktop.

### SolicitudIndicadoresCell

Props:

```txt
indicadores
roleConfig
```

Reglas:

- Mostrar `Adjuntos N` solo si visible y cantidad > 0.
- Mostrar `Diferencia OC` solo si visible y cantidad > 0.
- Mostrar `Bloqueado` solo si visible.
- No mostrar badges vacíos.
- Orden recomendado:

```txt
Adjuntos
Diferencia OC
Bloqueado
```

pero puede ajustarse visualmente según desktop/mobile.

### SolicitudAreaCell

Props:

```txt
area
```

Reglas:

- Mostrar nombre.
- No mostrar código salvo que nombre falte.
- No mostrar vacío innecesario.

### SolicitudSolicitanteCell

Props:

```txt
solicitante
```

Reglas:

- Mostrar nombre.
- No mostrar email.
- No mostrar vacío innecesario.

### SolicitudBloqueadoCell

Props:

```txt
indicadores.bloqueado
```

Reglas:

- Mostrar badge `Bloqueado` solo si aplica.
- No mostrar locked_by_email en la tabla.

## Subspec types

Importar tipos mínimos:

```txt
SolicitudCompraListItem
SolicitudCompraFolioUi
SolicitudCompraEstadoUi
SolicitudCompraPrioridadUi
SolicitudCompraEquipoPreview
SolicitudCompraFechaEntregaUi
SolicitudCompraIndicadores
```

No duplicar interfaces.

## Subspec views / components

Las celdas deben ser reutilizables por:

```txt
SolicitudesDesktopTable.vue
SolicitudMobileCard.vue
```

Deben aceptar props como `compact` o `variant` si se necesita adaptar desktop/mobile.

## No hacer

- No llamar Supabase.
- No usar store.
- No cargar equipos.
- No poner lógica de columnas por rol dentro de las celdas.
- No mostrar datos que no vienen en props.

## Criterios de aceptación

- Cada celda es pequeña y reutilizable.
- La tabla queda limpia.
- La card mobile puede reutilizar badges/chips.
- No se muestran valores vacíos innecesarios.
- No se muestran badges vacíos.
