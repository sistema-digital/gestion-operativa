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

# SPEC-05 — Store Pinia del listado

## Objetivo

Crear el store Pinia que coordina carga inicial, scroll infinito, búsqueda, filtros y estados de UI del listado.

## Archivos a crear

```txt
src/stores/db_compras/solicitudes_compra/solicitudesCompra.store.ts
```

## Archivos a leer

```txt
src/stores/db_compras/solicitudes_compra/solicitudesCompra.types.ts
src/stores/db_compras/solicitudes_compra/solicitudesCompra.service.ts
src/stores/db_compras/solicitudes_compra/solicitudesCompra.helpers.ts
src/stores/db_compras/solicitudes_compra/solicitudesCompra.mappers.ts
```

## Subspec lógica

Crear store:

```txt
useSolicitudesCompraStore
```

### Estado requerido

```txt
items: SolicitudCompraListItem[]
allSearchItems: SolicitudCompraListItem[]
rawRows: SolicitudCompraListRpcRow[]
loading: boolean
loadingMore: boolean
searching: boolean
error: string | null
filters: SolicitudCompraListFilters
pagination: SolicitudCompraPagination
lastRequestKey: string | null
initialized: boolean
```

### Filtros iniciales

```txt
busqueda = ''
grupoListado = 'en_proceso'
estadoCodigo = null
prioridadCodigo = null
fechaDesde = null
fechaHasta = null
soloBloqueadas = false
soloDiferenciaOc = false
```

### Paginación inicial

```txt
pageSize = 25
remoteOffset = 0
localVisibleCount = 25
totalCount = 0
hasMore = true
```

### Actions requeridas

```txt
cargarInicial()
cargarMas()
buscar()
actualizarFiltro(partialFilters)
limpiarFiltros()
cambiarGrupoListado(grupo)
refrescar()
prepararAbrirDetalle(itemId)
prepararCrearSolicitud()
```

### cargarInicial()

Reglas:

- Setear `loading = true`.
- Limpiar errores.
- Usar filtros actuales.
- Si `busqueda` está vacía:
  - llamar `obtenerSolicitudesListaPagina()` con `p_limit = 25`, `p_offset = 0`.
  - mapear filas.
  - reemplazar `items`.
  - actualizar `totalCount` desde `total_count` de primera fila si existe.
  - calcular `hasMore`.
- Si `busqueda` tiene texto:
  - llamar `buscar()`.
- Al finalizar, `initialized = true`.

### cargarMas()

Reglas para modo normal:

- No ejecutar si `loadingMore = true`.
- No ejecutar si `hasMore = false`.
- No ejecutar si hay búsqueda activa.
- Llamar RPC con `p_limit = 25` y `p_offset` actual.
- Agregar resultados al final.
- Actualizar `remoteOffset`.
- Actualizar `hasMore`.

Reglas para modo búsqueda:

- No llamar RPC.
- Incrementar `localVisibleCount` en 25.
- `items = allSearchItems.slice(0, localVisibleCount)`.
- Actualizar `hasMore` según longitud local.

### buscar()

Reglas:

- Setear `searching = true`.
- Llamar `buscarSolicitudesLista()` del service.
- Usar `p_offset = 0`.
- Usar límite alto razonable, por ejemplo 500.
- Mapear todos los resultados a `allSearchItems`.
- Mostrar solo los primeros 25 en `items`.
- `localVisibleCount = 25`.
- `hasMore = allSearchItems.length > 25`.

### actualizarFiltro(partialFilters)

Reglas:

- Fusionar filtros.
- Resetear paginación.
- Llamar `cargarInicial()`.

### limpiarFiltros()

Reglas:

- Mantener `grupoListado` actual o resetear a `en_proceso` según decisión del producto.
- Recomendación: mantener grupo activo y limpiar lo demás.

### cambiarGrupoListado(grupo)

Reglas:

- Cambiar `filters.grupoListado`.
- Resetear offset.
- Cargar inicial.

### prepararAbrirDetalle(itemId)

Por ahora:

- No navegar.
- Guardar opcionalmente `selectedSolicitudId` si se decide agregar al state.
- Dejar comentario claro para futura ruta.

### prepararCrearSolicitud()

Por ahora:

- No crear.
- No llamar RPC.
- Dejar comentario claro para futura ruta/formulario.

## Subspec types

Usar:

```txt
SolicitudCompraListState
SolicitudCompraListFilters
SolicitudCompraListItem
SolicitudCompraListRpcParams
SolicitudCompraPagination
SolicitudCompraGrupoListado
```

No declarar interfaces dentro del store.

## Subspec views / composables / components

No crear UI.

El store será consumido por:

```txt
src/components/compras/list/useSolicitudesCompraList.ts
```

## Preparación futura de equipos

En este spec los equipos siguen mockeados por mapper.

No implementar:

```txt
obtenerEquiposPorSolicitudes
```

Pero el store no debe bloquear la UI por equipos. La estructura debe permitir que luego se agregue una action futura:

```txt
cargarEquiposBatchParaItemsVisibles()
```

## No hacer

- No llamar `.rpc(...)` directamente.
- No importar `supabase`.
- No crear componentes.
- No navegar.
- No llamar RPC de creación.
- No consultar BD de equipos.

## Criterios de aceptación

- Carga 25 solicitudes iniciales.
- Carga 25 más por scroll en modo normal.
- En búsqueda llama RPC una vez y muestra 25 resultados locales.
- En búsqueda el “cargar más” muestra más resultados locales sin llamar RPC.
- Cambiar filtros reinicia paginación.
- No hay navegación real.
- No hay creación real.
- El store compila en TypeScript estricto.
