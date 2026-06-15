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

# SPEC-03 — Helpers y mappers del listado

## Objetivo

Crear funciones puras para normalizar valores y convertir filas crudas del RPC en items de UI listos para tabla desktop y cards mobile.

## Archivos a crear

```txt
src/stores/db_compras/solicitudes_compra/solicitudesCompra.helpers.ts
src/stores/db_compras/solicitudes_compra/solicitudesCompra.mappers.ts
```

## Subspec lógica

### Helpers requeridos

Crear funciones puras en:

```txt
solicitudesCompra.helpers.ts
```

Funciones mínimas:

```txt
normalizarBusqueda(value: string): string
isSearchMode(value: string): boolean
crearEquiposMock(): SolicitudCompraEquipoPreview
calcularEquiposVisibles(codigos: string[], max?: number): { visibles: string[]; ocultos: number }
formatFolioSol(folioSol: string | null): string | null
safeArrayText(value: unknown): string[]
getInitialPagination(totalCount?: number): SolicitudCompraPagination
getNextRemoteOffset(pagination): number
canLoadMoreRemote(pagination): boolean
canShowMoreLocal(totalItems, visibleCount): boolean
```

Reglas:

- `crearEquiposMock()` debe devolver:

```txt
codigos = ['422005', '422009', '422014']
visibles = ['422005', '422009', '422014']
ocultos = 0
loading = false
error = null
source = 'mock'
```

- `calcularEquiposVisibles()` debe soportar máximo 3 chips por defecto.
- `formatFolioSol()` debe devolver `#18532` cuando recibe `18532`.
- No debe devolver `#null` ni `#undefined`.
- `normalizarBusqueda()` debe hacer trim y colapsar espacios.

### Mapper requerido

Crear funciones en:

```txt
solicitudesCompra.mappers.ts
```

Funciones mínimas:

```txt
mapSolicitudCompraListRowToItem(row): SolicitudCompraListItem
mapSolicitudCompraListRowsToItems(rows): SolicitudCompraListItem[]
```

### Reglas del mapper

El mapper debe:

1. Convertir `folio_sol` en estructura UI.
2. Mantener `folio_oc_principal` solo si viene del RPC.
3. Mantener `folios_oc` como array seguro.
4. Copiar `observacion` como string seguro.
5. Crear `estado` con código/nombre/badge.
6. Crear `prioridad` con código/nombre.
7. Crear `area` solo con código/nombre.
8. Crear `solicitante` solo con nombre.
9. Crear `fechaEntrega` con `fecha_entrega_mostrada` y `fecha_entrega_origen`.
10. Crear `indicadores` con datos disponibles.
11. Crear `equipos` usando mock temporal.
12. Crear `conteos`.
13. Crear `ocResumen`.
14. No decidir navegación.
15. No filtrar por rol aquí, salvo preparar datos seguros.
16. No consultar equipos reales.

### Indicadores en mapper

Inicialmente:

```txt
bloqueado.visible = row.bloqueada === true
adjuntos.visible = row.tiene_adjuntos === true && row.cantidad_adjuntos > 0
diferenciaOc.visible = row.tiene_diferencia_oc === true && row.cantidad_diferencias > 0 && row.cantidad_oc > 0
```

La visibilidad final por rol se aplicará luego en `solicitudListRoleConfig.ts` y componentes.

## Subspec types

Importar desde:

```txt
./solicitudesCompra.types
```

Tipos usados:

```txt
SolicitudCompraListRpcRow
SolicitudCompraListItem
SolicitudCompraEquipoPreview
SolicitudCompraPagination
```

No declarar tipos duplicados.

## Subspec views / composables / components

No aplica.

## No hacer

- No llamar Supabase.
- No importar stores.
- No importar componentes.
- No implementar permisos visuales por rol aquí.
- No implementar búsqueda por equipo real.
- No crear funciones asíncronas.

## Criterios de aceptación

- Una fila RPC se convierte en un item UI completo.
- Los campos null no rompen la UI.
- Los equipos mock aparecen en cada item.
- Los indicadores no se muestran si no aplican.
- El mapper queda listo para usar por el store.
