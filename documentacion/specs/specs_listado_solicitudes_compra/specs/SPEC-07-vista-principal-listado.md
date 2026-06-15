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

# SPEC-07 — Vista principal del listado

## Objetivo

Crear la pantalla principal del listado de solicitudes de compra, coordinando toolbar, tabs, tabla desktop, lista mobile y estados visuales.

## Archivos a crear

```txt
src/views/compras/SolicitudesCompraView.vue
```

## Subspec lógica

La vista debe:

- consumir `useSolicitudesCompraList()`;
- llamar `loadInitial()` al montar;
- pasar datos a componentes hijos;
- escuchar eventos de filtros, tabs, click, crear y scroll;
- no llamar Supabase;
- no contener lógica de mapeo ni paginación compleja;
- no implementar navegación real.

### Layout general

Desktop:

```txt
fondo claro
bloque toolbar arriba
tabs encima de tabla
tabla desktop
trigger/loader para cargar más
```

Mobile:

```txt
topbar o integración con layout mobile existente
buscador + botón filtros
tabs
cards
FAB Crear
bottom nav si el layout lo requiere
```

### Responsive

Usar Tailwind:

```txt
hidden md:block
md:hidden
```

o el patrón responsive existente del proyecto.

### Carga inicial

Al montar:

```txt
await loadInitial()
```

### Click en fila/card

La vista debe recibir evento y enviarlo al composable.

No debe hacer:

```txt
router.push(...)
```

por ahora.

### Crear

La vista debe conectar el evento del botón `Crear` y del FAB.

No debe llamar:

```txt
rpc_crear_borrador_solicitud
```

por ahora.

## Subspec types

No declarar tipos locales grandes.

Usar los tipos ya definidos desde el store/composable.

## Subspec views / components

La vista debe usar:

```txt
SolicitudesListToolbar.vue
SolicitudesGrupoTabs.vue
SolicitudesDesktopTable.vue
SolicitudesMobileList.vue
SolicitudesListSkeleton.vue
SolicitudesListEmptyState.vue
SolicitudesListErrorState.vue
SolicitudesListLoadMoreTrigger.vue
```

## Reglas visuales

- No mostrar título grande `Solicitudes`.
- No mostrar subtítulo largo.
- La pantalla inicia con filtros.
- Sidebar existente no se modifica.
- No dibujar sidebar dentro de componentes del listado.
- No mostrar botón `Ver` en filas/cards.
- No mostrar texto `Doble click para ver detalle`.

## No hacer

- No crear ruta.
- No modificar router.
- No crear formulario de nueva solicitud.
- No crear vista detalle.
- No llamar Supabase.
- No duplicar columnas por rol aquí.

## Criterios de aceptación

- La vista carga datos al montarse.
- Desktop muestra tabla.
- Mobile muestra cards.
- Loading, empty y error se muestran correctamente.
- Click en fila/card no rompe.
- Crear no rompe.
- La vista se mantiene delgada.
