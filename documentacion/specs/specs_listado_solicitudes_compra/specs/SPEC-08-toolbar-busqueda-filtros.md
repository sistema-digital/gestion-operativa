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

# SPEC-08 — Toolbar de búsqueda y filtros

## Objetivo

Crear el bloque superior de búsqueda y filtros para desktop y mobile.

## Archivos a crear

```txt
src/components/compras/list/SolicitudesListToolbar.vue
```

Opcional si se desea granularidad interna:

```txt
src/components/compras/list/SolicitudesSearchInput.vue
src/components/compras/list/SolicitudesFilterChipSelect.vue
src/components/compras/list/SolicitudesDateRangeButton.vue
```

No crear estos subcomponentes si el proyecto queda más simple con un solo archivo.

## Subspec lógica

Props requeridas:

```txt
filters
loading
searching
isMobile
```

Emits requeridos:

```txt
update:search
update:estado
update:prioridad
update:fechaDesde
update:fechaHasta
update:soloBloqueadas
update:soloDiferenciaOc
create
openMobileFilters
```

### Desktop

Distribución:

```txt
Buscador → Estado → Prioridad → Rango de fecha → checkboxes → Crear
```

Reglas:

- Buscador compacto.
- Ícono de búsqueda a la izquierda.
- Selects tipo chip, no formulario alto.
- Rango de fecha como control compacto.
- Checkboxes en una columna o fila compacta según ancho.
- Botón `Crear` a la derecha.
- Altura recomendada de controles desktop ERP:

```txt
32px a 36px
```

Placeholder desktop:

```txt
Buscar por folio, observación, equipo u orden de compra
```

Aunque la búsqueda por equipo real todavía no esté implementada, el placeholder queda porque el diseño se preparará para esa integración.

### Mobile

Distribución:

```txt
Buscador compacto + botón Filtros
```

Placeholder mobile:

```txt
Buscar folio, observación o equipo
```

Reglas:

- No mostrar todos los filtros extendidos en la primera línea mobile.
- El botón `Filtros` solo emite `openMobileFilters`.
- No implementar modal/drawer de filtros en este spec salvo que ya exista patrón.

### Crear

Desktop:

- Botón `Crear` en toolbar.
- Solo emite `create`.

Mobile:

- El FAB se define en vista o spec de crear futuro.
- Toolbar no debe duplicar FAB.

## Subspec types

Usar:

```txt
SolicitudCompraListFilters
```

No declarar tipos grandes.

## Subspec views / components

Tailwind únicamente.

Estilo desktop ERP:

```txt
h-8 o h-9
text-xs
rounded-lg
border suave
sombra muy ligera
```

Estilo mobile:

```txt
h-12 aproximado
text-base o text-sm legible
rounded-2xl
```

## No hacer

- No llamar store directamente si se está usando composable en la vista.
- No llamar Supabase.
- No implementar menú avanzado mobile si no está en el alcance.
- No implementar búsqueda por equipo real.
- No crear solicitud real.

## Criterios de aceptación

- Toolbar desktop se ve como barra compacta ERP.
- Toolbar mobile se ve cómoda y táctil.
- Cada cambio emite evento correcto.
- El componente no conoce Supabase.
- El componente no sabe de paginación.
