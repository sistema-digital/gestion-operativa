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

# SPEC-12 — Lista mobile base

## Objetivo

Crear el renderer mobile del listado usando cards apiladas, no tabla comprimida.

## Archivos a crear

```txt
src/components/compras/list/mobile/SolicitudesMobileList.vue
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
card-click
```

Reglas:

- Renderizar una `SolicitudMobileCard` por item.
- No filtrar columnas aquí.
- No llamar store.
- No llamar Supabase.
- No implementar navegación.
- No implementar scroll interno.

## Subspec types

Usar:

```txt
SolicitudCompraListItem
SolicitudCompraRoleCodigo
```

## Subspec views / components

Renderiza:

```txt
SolicitudMobileCard.vue
```

### Reglas visuales mobile

- Fondo claro.
- Cards apiladas con separación cómoda.
- No tabla.
- No columnas comprimidas.
- No scroll interno dentro de cards.
- La página crece verticalmente.

### Estados

Si `loading`:

- la vista principal puede mostrar `SolicitudesListSkeleton`.

Si `items.length === 0`:

- la vista principal puede mostrar `SolicitudesListEmptyState`.

Este componente no debe decidir empty/error global si la vista ya lo controla.

## No hacer

- No crear FAB aquí si la vista lo maneja globalmente.
- No crear bottom nav si ya existe en layout.
- No renderizar toolbar.
- No implementar filtros.
- No usar tabla.

## Criterios de aceptación

- Mobile muestra cards.
- Card completa es clickeable.
- No hay botones internos de Ver.
- No parece ERP.
- La lista se integra con scroll infinito.
