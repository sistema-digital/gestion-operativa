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

# SPEC-06 — Composable de pantalla del listado

## Objetivo

Crear un composable que conecte la vista con el store y mantenga la vista principal limpia.

## Archivos a crear

```txt
src/components/compras/list/useSolicitudesCompraList.ts
```

## Subspec lógica

El composable debe usar:

```txt
useSolicitudesCompraStore
```

Debe exponer propiedades computadas:

```txt
items
loading
loadingMore
searching
error
filters
activeGrupo
hasMore
isSearchMode
initialized
```

Debe exponer métodos:

```txt
loadInitial()
loadMore()
onSearchChange(value)
onGrupoChange(grupo)
onFilterChange(partialFilters)
onRetry()
onRowClick(item)
onCardClick(item)
onCreateClick()
```

### Debounce de búsqueda

El composable debe manejar debounce.

Reglas:

- El componente toolbar emite cambios inmediatamente.
- El composable aplica debounce antes de llamar al store.
- Tiempo recomendado:

```txt
300ms a 400ms
```

- Si el usuario limpia búsqueda, recargar vista normal paginada.

### loadInitial()

Debe llamar:

```txt
store.cargarInicial()
```

### loadMore()

Debe llamar:

```txt
store.cargarMas()
```

Debe evitar doble ejecución si:

```txt
loadingMore = true
loading = true
hasMore = false
```

### onRowClick() y onCardClick()

Por ahora:

- llamar `store.prepararAbrirDetalle(item.id)`;
- no navegar.

### onCreateClick()

Por ahora:

- llamar `store.prepararCrearSolicitud()`;
- no navegar;
- no crear borrador.

## Subspec types

Importar tipos:

```txt
SolicitudCompraListFilters
SolicitudCompraListItem
SolicitudCompraGrupoListado
```

No declarar tipos grandes dentro del composable.

## Subspec views / components

Este composable será usado por:

```txt
src/views/compras/SolicitudesCompraView.vue
```

No debe renderizar UI.

## No hacer

- No llamar Supabase.
- No crear store adicional.
- No implementar ruta de detalle.
- No implementar ruta de creación.
- No cargar equipos reales.
- No manipular DOM directamente.

## Criterios de aceptación

- La vista puede consumir datos y acciones desde un solo composable.
- La búsqueda tiene debounce.
- El scroll infinito queda expuesto como método.
- El click en fila/card queda preparado.
- El botón crear queda preparado.
