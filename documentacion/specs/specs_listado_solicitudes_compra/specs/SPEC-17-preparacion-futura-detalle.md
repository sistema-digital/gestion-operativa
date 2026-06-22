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

# SPEC-17 — Preparación futura de navegación a detalle

## Objetivo

Dejar preparado el click en fila/card para abrir el detalle en el futuro, sin implementar navegación ni vista detalle ahora.

## Archivos afectados

```txt
src/views/compras/SolicitudesCompraView.vue
src/components/compras/list/useSolicitudesCompraList.ts
src/components/compras/list/desktop/SolicitudesDesktopTable.vue
src/components/compras/list/mobile/SolicitudesMobileList.vue
src/components/compras/list/mobile/SolicitudMobileCard.vue
```

## Subspec lógica

### Desktop

- La fila completa emite `row-click` con el item o ID.
- La tabla no navega.

### Mobile

- La card completa emite `card-click` con el item o ID.
- La card no navega.

### Composable

El composable expone:

```txt
onRowClick(item)
onCardClick(item)
```

Ambos llaman una función común:

```txt
store.prepararAbrirDetalle(item.id)
```

### Store

`prepararAbrirDetalle(itemId)` por ahora:

- no navega;
- puede guardar `selectedSolicitudId` si el state lo define;
- deja un comentario para integrar ruta futura.

## Subspec types

No crear tipos nuevos.

Usar:

```txt
SolicitudCompraListItem
```

## Subspec views / components

Reglas visuales:

- Cursor pointer en desktop.
- Hover sutil en desktop.
- Card táctil en mobile.
- No botón `Ver`.
- No texto `Doble click`.

## No hacer

- No modificar `router`.
- No crear ruta `/compras/solicitudes/:id` todavía.
- No crear `SolicitudCompraDetalleView.vue`.
- No consultar `vw_solicitud_detalle_completo`.
- No tomar lock.

## Criterios de aceptación

- Click en fila/card no rompe.
- El evento llega al composable/store.
- No hay navegación real.
- La integración futura queda clara.
