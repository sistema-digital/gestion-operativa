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

# SPEC-01 — Types base del listado de solicitudes

## Objetivo

Crear los tipos TypeScript base para el listado de solicitudes, separando claramente:

- parámetros que se envían al RPC;
- filas crudas que devuelve el RPC;
- modelo UI que consumen tabla y cards;
- estado del store;
- filtros;
- paginación;
- equipos mock/futuros.

## Archivos a crear

```txt
src/stores/db_compras/solicitudes_compra/solicitudesCompra.types.ts
```

## Archivos que no se deben modificar

```txt
src/views/compras/SolicitudesCompraView.vue
src/components/compras/list/**
src/stores/db_compras/solicitudes_compra/solicitudesCompra.store.ts
src/stores/db_compras/solicitudes_compra/solicitudesCompra.service.ts
```

## Subspec lógica

Este spec no debe ejecutar lógica de negocio.

Solo debe declarar contratos para los specs posteriores.

Reglas:

- No importar `supabase`.
- No importar stores.
- No importar componentes.
- No ejecutar funciones.
- No crear valores constantes complejos.
- No implementar permisos por rol todavía.
- No usar `any` salvo que se justifique para JSON externo y se encapsule.

## Subspec types

Crear los siguientes tipos.

### 1. Rol del visor

```txt
SolicitudCompraRoleCodigo
```

Valores:

```txt
admin
gerencia
almacen
secretaria
operativo
```

Debe permitir fallback seguro para valores desconocidos si el RPC devuelve un rol no contemplado. Recomendación:

```txt
SolicitudCompraRoleCodigo = 'admin' | 'gerencia' | 'almacen' | 'secretaria' | 'operativo'
```

Y manejar valores desconocidos en helpers/mappers, no aquí.

### 2. Grupo de listado

```txt
SolicitudCompraGrupoListado
```

Valores:

```txt
en_proceso
completadas
descartadas
```

### 3. Column key

```txt
SolicitudCompraColumnKey
```

Debe cubrir columnas posibles:

```txt
folio
observacion
estado
prioridad
equipos
area
solicitante
fechaEntrega
indicadores
bloqueado
```

### 4. Parámetros del RPC

```txt
SolicitudCompraListRpcParams
```

Debe incluir:

```txt
p_busqueda: string | null
p_grupo_listado: SolicitudCompraGrupoListado | null
p_estado_codigo: string | null
p_prioridad_codigo: string | null
p_fecha_desde: string | null
p_fecha_hasta: string | null
p_solo_bloqueadas: boolean
p_solo_diferencia_oc: boolean
p_limit: number | null
p_offset: number | null
```

Notas:

- Las fechas se mandan como string `YYYY-MM-DD` desde frontend.
- En carga normal se usa `p_limit = 25`.
- En búsqueda se usa `p_limit` alto y `p_offset = 0`.

### 5. Fila cruda del RPC

```txt
SolicitudCompraListRpcRow
```

Debe representar lo que devuelve `rpc_obtener_solicitudes_lista_usuario`.

Campos mínimos esperados:

```txt
id
viewer_email
viewer_role_codigo
viewer_area_codigo
folio_sol
folio_oc_principal
folios_oc
observacion
estado_codigo
estado_nombre
badge_codigo
badge_label
prioridad_codigo
prioridad_nombre
area_solicitante_codigo
area_solicitante_nombre
solicitante_nombre
fecha_entrega_mostrada
fecha_entrega_origen
grupo_listado
disponible_desde
bloqueada
locked_by_email
locked_at
cantidad_adjuntos
tiene_adjuntos
cantidad_oc
ordenes_compra_resumen
estado_oc_principal
evaluacion_principal
recepcion_principal
proveedor_principal
cantidad_diferencias
tiene_diferencia_oc
productos_total
productos_activos
servicios_total
total_count
```

Campos nullable:

- `folio_sol` puede venir `null` para roles que no lo ven.
- `folio_oc_principal` puede venir `null`.
- `area_solicitante_nombre` puede venir `null` según rol.
- `solicitante_nombre` puede venir `null` según rol.
- `fecha_entrega_mostrada` puede venir `null` según rol.

### 6. Modelo UI de folio

```txt
SolicitudCompraFolioUi
```

Debe incluir:

```txt
folioSol: string | null
folioSolLabel: string | null
folioOcPrincipal: string | null
foliosOc: string[]
```

Regla:

- `folioSolLabel` debe poder representar `#18532`.
- No se debe crear texto `Sin OC`.

### 7. Modelo UI de estado

```txt
SolicitudCompraEstadoUi
```

Debe incluir:

```txt
codigo
nombre
badgeCodigo
badgeLabel
```

### 8. Modelo UI de prioridad

```txt
SolicitudCompraPrioridadUi
```

Debe incluir:

```txt
codigo
nombre
```

### 9. Modelo UI de área

```txt
SolicitudCompraAreaUi
```

Debe incluir:

```txt
codigo: string | null
nombre: string | null
```

### 10. Modelo UI de solicitante

```txt
SolicitudCompraSolicitanteUi
```

Debe incluir:

```txt
nombre: string | null
```

No incluir email en el modelo UI del listado.

### 11. Modelo UI de fecha

```txt
SolicitudCompraFechaEntregaUi
```

Debe incluir:

```txt
fecha: string | null
origen: 'proveedor' | 'sistema' | 'solicitud' | null
```

Regla:

- La UI muestra una sola fecha.
- No mostrar nombre técnico `fecha_entrega_sistema`.

### 12. Equipos preview

```txt
SolicitudCompraEquipoPreview
```

Debe incluir:

```txt
loading: boolean
codigos: string[]
visibles: string[]
ocultos: number
error: string | null
source: 'mock' | 'batch' | 'none'
```

Regla inicial:

- `source = 'mock'`.
- `codigos = ['422005', '422009', '422014']`.
- `loading = false`.

Preparación futura:

- Cuando se carguen equipos reales por batch, `loading` se activará por solicitud.
- `source` pasará a `batch`.

### 13. Indicadores

```txt
SolicitudCompraIndicadores
```

Debe incluir:

```txt
bloqueado: {
  visible: boolean
  lockedByEmail: string | null
  lockedAt: string | null
}
adjuntos: {
  visible: boolean
  cantidad: number
}
diferenciaOc: {
  visible: boolean
  cantidad: number
}
```

Regla:

- Los permisos finales de visibilidad se resuelven en config/mapper/componentes.
- El modelo debe soportar no mostrar badges vacíos.

### 14. Item UI del listado

```txt
SolicitudCompraListItem
```

Debe incluir:

```txt
id
viewerRoleCodigo
viewerAreaCodigo
folio
observacion
estado
prioridad
equipos
area
solicitante
fechaEntrega
indicadores
grupoListado
disponibleDesde
conteos
ocResumen
```

`conteos` debe incluir:

```txt
productosTotal
productosActivos
serviciosTotal
cantidadOc
```

`ocResumen` debe incluir:

```txt
estadoOcPrincipal
evaluacionPrincipal
recepcionPrincipal
proveedorPrincipal
ordenesCompraResumen
```

### 15. Filtros del listado

```txt
SolicitudCompraListFilters
```

Debe incluir:

```txt
busqueda: string
grupoListado: SolicitudCompraGrupoListado
estadoCodigo: string | null
prioridadCodigo: string | null
fechaDesde: string | null
fechaHasta: string | null
soloBloqueadas: boolean
soloDiferenciaOc: boolean
```

### 16. Paginación

```txt
SolicitudCompraPagination
```

Debe incluir:

```txt
pageSize: number
remoteOffset: number
localVisibleCount: number
totalCount: number
hasMore: boolean
```

Reglas:

- `pageSize = 25`.
- En carga normal: `remoteOffset` se usa contra RPC.
- En búsqueda: `localVisibleCount` controla cuántos resultados mostrar de los ya recibidos.

### 17. Estado del store

```txt
SolicitudCompraListState
```

Debe incluir:

```txt
items
allSearchItems
rawRows
loading
loadingMore
searching
error
filters
pagination
lastRequestKey
initialized
```

## Subspec views / composables / components

No crear componentes en este spec.

## No hacer

- No crear store.
- No crear service.
- No crear mapper.
- No crear componentes.
- No llamar Supabase.
- No implementar permisos por rol aquí.

## Criterios de aceptación

- TypeScript compila en modo estricto.
- Los tipos soportan carga normal y búsqueda.
- Los tipos soportan UI desktop y mobile.
- Los tipos soportan roles.
- Los tipos soportan equipos mock y futura carga batch.
- El archivo no contiene lógica de negocio ejecutable.
