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

# SPEC-14 — Loading, empty, error y scroll trigger

## Objetivo

Separar los estados visuales del listado para no mezclar loaders, errores y scroll infinito dentro de la tabla o cards.

## Archivos a crear

```txt
src/components/compras/list/SolicitudesListSkeleton.vue
src/components/compras/list/SolicitudesListEmptyState.vue
src/components/compras/list/SolicitudesListErrorState.vue
src/components/compras/list/SolicitudesListLoadMoreTrigger.vue
```

## Subspec lógica

### SolicitudesListSkeleton

Props:

```txt
variant: 'desktop' | 'mobile'
rows?: number
```

Reglas:

- Desktop: simular filas de tabla ERP.
- Mobile: simular cards.
- No depender del store.

### SolicitudesListEmptyState

Props:

```txt
searchActive: boolean
```

Mensajes sugeridos:

- Sin búsqueda: `No hay solicitudes para mostrar`.
- Con búsqueda: `No se encontraron solicitudes con esos filtros`.

No usar textos largos.

### SolicitudesListErrorState

Props:

```txt
message: string
```

Emits:

```txt
retry
```

Reglas:

- Mostrar error compacto.
- Botón `Reintentar`.

### SolicitudesListLoadMoreTrigger

Props:

```txt
loadingMore: boolean
hasMore: boolean
```

Emits:

```txt
load-more
```

Reglas:

- Usar `IntersectionObserver` o un botón/trigger simple según patrón del proyecto.
- No bloquear la pantalla completa mientras carga más.
- Si `hasMore = false`, no emitir.
- Si `loadingMore = true`, mostrar loader pequeño.

## Subspec types

No requiere tipos complejos.

Puede usar literales locales:

```txt
'desktop' | 'mobile'
```

## Subspec views / components

La vista principal debe decidir cuándo mostrar cada estado:

```txt
loading inicial → Skeleton
error → ErrorState
items vacío → EmptyState
items con datos → tabla/cards + LoadMoreTrigger
```

## No hacer

- No llamar Supabase.
- No llamar store directamente si no es necesario.
- No implementar lógica de filtros.
- No crear loaders de equipos reales aquí.

## Criterios de aceptación

- Carga inicial tiene skeleton adecuado.
- Carga de más datos tiene loader pequeño.
- Error permite reintentar.
- Empty state no usa textos largos.
- Scroll infinito no duplica llamadas.
